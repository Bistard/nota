import { CharCode } from "src/base/common/utilities/char";
import * as paths from "src/base/common/files/path";
import { IS_WINDOWS, OS_CASE_SENSITIVE, Platform } from "src/base/common/platform";
import { IReviverRegistrant } from "src/platform/ipc/common/revive";
import { isParentOf } from "src/base/common/files/glob";
import { panic } from "src/base/common/utilities/panic";
import { ITildifyFormatter, normalizeDriveLetter, tildify, toForwardSlash, toPosixPath } from "src/base/common/files/extpath";
import { Strings } from "src/base/common/utilities/string";

/**
 * Uniform Resource Identifier (URI) http://tools.ietf.org/html/rfc3986.
 * This class is a simple parser which creates the basic component parts
 * (http://tools.ietf.org/html/rfc3986#section-3) with minimal validation
 * and encoding.
 *
 * ```txt
 *       foo://example.com:8042/over/there?name=ferret#nose
 *       \_/   \______________/\_________/ \_________/ \__/
 *        |           |            |            |        |
 *     scheme     authority       path        query   fragment
 *        |   _____________________|__
 *       / \ /                        \
 *       urn:example:animal:ferret:nose
 * ```
 */
export interface IURI {

	/**
	 * scheme is the 'http' part of 'http://www.msft.com/some/path?query#fragment'.
	 * The part before the first colon.
	 */
	readonly scheme: string;

	/**
	 * authority is the 'www.msft.com' part of 'http://www.msft.com/some/path?query#fragment'.
	 * The part between the first double slashes and the next slash.
	 */
	readonly authority: string;

	/**
	 * path is the '/some/path' part of 'http://www.msft.com/some/path?query#fragment'.
	 */
	readonly path: string;

	/**
	 * query is the 'query' part of 'http://www.msft.com/some/path?query#fragment'.
	 */
	readonly query: string;

	/**
	 * fragment is the 'fragment' part of 'http://www.msft.com/some/path?query#fragment'.
	 */
	readonly fragment: string;
}

export const enum Schemas {
	FILE = 'file',
	HTTP = 'http',
	HTTPS = 'https',
}

const _empty = '';
const _slash = '/';
const _regexp = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;

export class URI implements IURI {

	// [field]

	public readonly scheme!: string;
	public readonly authority!: string;
	public readonly path!: string;
	public readonly query!: string;
	public readonly fragment!: string;

	// [constructor]

	constructor(scheme: string, authority?: string, path?: string, query?: string, fragment?: string, strict = false) {
		this.scheme = __schemeFix(scheme, strict);
		this.authority = authority || _empty;
		this.path = __referenceResolution(this.scheme, path || _empty);
		this.query = query || _empty;
		this.fragment = fragment || _empty;

		__validateUri(this, strict);
	}

	/**
	 * @description Creates a new URI from a string, e.g. `http://www.msft.com/some/path`,
	 * `file:///usr/home`, or `scheme:with/path`.
	 * @param value A string which represents an URI (see `URI#toString`).
	 */
	public static parse(value: string): URI {
		const match = _regexp.exec(value);
		if (!match) {
			return new URI(_empty, _empty, _empty, _empty, _empty);
		}
		return new URI(
			match[2] || _empty,
			percentDecode(match[4] || _empty),
			percentDecode(match[5] || _empty),
			percentDecode(match[7] || _empty),
			percentDecode(match[9] || _empty)
		);
	}

	/**
	 * @description Check if a given object is an instance of `URI`.
	 */
	public static isURI(obj: any): obj is URI {
		if (obj instanceof URI) {
			return true;
		}

		if (!obj) {
			return false;
		}

		return typeof (<URI>obj).authority === 'string'
			&& typeof (<URI>obj).fragment === 'string'
			&& typeof (<URI>obj).path === 'string'
			&& typeof (<URI>obj).query === 'string'
			&& typeof (<URI>obj).scheme === 'string';
	}

	public static isAbsolutePath(resource: URI): boolean {
		return !!resource.path && resource.path[0] === '/';
	}

	public static isEqualAuthority(a1: string | undefined, a2: string | undefined): boolean {
		return a1 === a2 || (a1 !== undefined && a2 !== undefined && Strings.IgnoreCase.equals(a1, a2));
	}

	/**
	 * @description Compute the file system path for the given URI. 
	 */
	public static toFsPath(uri: URI, keepDriveLetterCasing: boolean = false): string {
		let path: string;

		// file path
		if (uri.authority && uri.path.length > 1 && uri.scheme === Schemas.FILE) {
			// unc path: file://shares/c$/far/boo
			path = `//${uri.authority}${uri.path}`;
		}

		else if (
			uri.path.charCodeAt(0) === CharCode.Slash
			&& (uri.path.charCodeAt(1) >= CharCode.A && uri.path.charCodeAt(1) <= CharCode.Z || uri.path.charCodeAt(1) >= CharCode.a && uri.path.charCodeAt(1) <= CharCode.z)
			&& uri.path.charCodeAt(2) === CharCode.Colon
		) {
			if (!keepDriveLetterCasing) {
				// windows drive letter: file:///c:/far/boo
				path = uri.path[1]!.toLowerCase() + uri.path.substr(2);
			} else {
				path = uri.path.substr(1);
			}
		}

		// other path
		else {
			path = uri.path;
		}

		if (IS_WINDOWS) {
			path = path.replace(/\//g, '\\');
		}

		return path;
	}

	/**
	 * @description Creates a new URI from a file system path, e.g. `c:\my\files`,
	 * `/usr/home`, or `\\server\share\some\path`.
	 * @param path A file system path (see `URI#fsPath`)
	 *
	 * The *difference* between `URI#parse` and `URI#fromFile` is that the latter 
	 * treats the argument as path, not as stringified-uri. E.g. `URI.fromFile(path)` 
	 * is **not the same as** `URI.parse('file://' + path)` because the path 
	 * might contain characters that are interpreted (# and ?). See the 
	 * following sample:
	 * ```ts
	 * const good = URI.file('/coding/c#/project1');
	 * good.scheme === 'file';
	 * good.path === '/coding/c#/project1';
	 * good.fragment === '';
	 * const bad = URI.parse('file://' + '/coding/c#/project1');
	 * bad.scheme === 'file';
	 * bad.path === '/coding/c'; // path is now broken
	 * bad.fragment === '/project1';
	 * ```
	 */
	public static fromFile(path: string): URI {
		let authority = _empty;

		// normalize to fwd-slashes on windows,
		// on other systems bwd-slashes are valid
		// filename character, eg /f\oo/ba\r.txt
		if (IS_WINDOWS) {
			path = path.replace(/\\/g, _slash);
		}

		// check for authority as used in UNC shares
		// or use the path as given
		if (path[0] === _slash && path[1] === _slash) {
			const idx = path.indexOf(_slash, 2);
			if (idx === -1) {
				authority = path.substring(2);
				path = _slash;
			} else {
				authority = path.substring(2, idx);
				path = path.substring(idx) || _slash;
			}
		}

		return new URI(Schemas.FILE, authority, path, _empty, _empty);
	}

	/**
	 * @description Join a URI with one or more string file/folder names.
	 */
	public static join(uri: URI, ...path: string[]): URI {
		if (!uri.path) {
			panic(`[URI]: cannot call joinPath on URI without path`);
		}

		if (path.length === 0) {
			return uri;
		}

		let newPath: string;
		if (IS_WINDOWS && uri.scheme === Schemas.FILE) {
			newPath = URI.fromFile(paths.win32.join(URI.toFsPath(uri, true), ...path)).path;
		} else {
			newPath = paths.posix.join(uri.path, ...path);
		}

		return URI.with(uri, { path: newPath });
	}

	/**
	 * @description Computes the relative path from one URI to another. If both 
	 * URIs share the same scheme and authority.
	 * @param from The starting URI from which to calculate the relative path.
	 * @param to The target URI to which the relative path is calculated.
	 * @returns The relative path from the `from` URI to the `to` URI, if 
	 * 			applicable, otherwise `undefined`.
	 * 
	 * @note When dealing with file URIs on a Windows system, the resulting path 
	 * 		 is converted to use forward slashes.
	 * @note If the URIs have different schemes or authorities, or if the 
	 * 		 calculation is not applicable, the function returns `undefined`.
	 */
	public static relative(from: URI, to: URI): string | undefined {
		if (from.scheme !== to.scheme || !URI.isEqualAuthority(from.authority, to.authority)) {
			return undefined;
		}
		if (from.scheme === Schemas.FILE) {
			const relativePath = paths.relative(URI.toFsPath(from, true), URI.toFsPath(to, true));
			return IS_WINDOWS ? toForwardSlash(relativePath) : relativePath;
		}
		let fromPath = from.path || '/';
		const toPath = to.path || '/';
		
		// disabled by now (@Bistard)
		if (0) {
			// make casing of fromPath match toPath
			let i = 0;
			for (const len = Math.min(fromPath.length, toPath.length); i < len; i++) {
				if (fromPath.charCodeAt(i) !== toPath.charCodeAt(i)) {
					if (fromPath.charAt(i).toLowerCase() !== toPath.charAt(i).toLowerCase()) {
						break;
					}
				}
			}
			fromPath = toPath.substr(0, i) + fromPath.substr(i);
		}

		return paths.posix.relative(fromPath, toPath);
	}
	
	/**
	 * @description Calculates a URI based on a base URI and a path, which can 
	 * be either relative or absolute.
	 * @param base The base URI used as the starting point.
	 * @param path The path to resolve against the base URI.
	 * @returns The resulting URI after resolving the given path against the base URI.
	 * 
	 * @note The provided path may follow either POSIX or Windows standards.
	 */
	public static resolve(base: URI, path: string): URI {
		if (base.scheme === Schemas.FILE) {
			const newURI = URI.fromFile(paths.resolve(URI.toFsPath(base, true), path));
			return URI.with(base, {
				authority: newURI.authority,
				path: newURI.path
			});
		}

		path = toPosixPath(path); // we allow path to be a windows path
		return URI.with(base, {
			path: paths.posix.resolve(base.path, path)
		});
	}

	/**
	 * @description If the candidate is the parent of the given uri.
	 * @param uri The given uri.
	 * @param candidate The possible parent of the given uri.
	 * @param ignoreCase Make it case insensitive.
	 */
	public static isParentOf(uri: URI, candidate: URI, ignoreCase?: boolean): boolean {
		const uriStr = URI.toFsPath(uri);
		const candidateStr = URI.toFsPath(candidate);
		return isParentOf(uriStr, candidateStr, ignoreCase);
	}

	/**
	 * @description Check if two given URIs are equal.
	 */
	public static equals(uri1: URI, uri2: URI, ignoreCase: boolean = OS_CASE_SENSITIVE, ignoreFragment?: boolean): boolean {
		
		uri1 = URI.with(uri1, {
			path: ignoreCase ? uri1.path.toLowerCase() : undefined,
			fragment: ignoreFragment ? null : undefined,
		});
		
		uri2 = URI.with(uri2, {
			path: ignoreCase ? uri2.path.toLowerCase() : undefined,
			fragment: ignoreFragment ? null : undefined,
		});

		return URI.toString(uri1) === URI.toString(uri2);
	}

	/**
	 * @description Identifies and returns a list of unique parent URIs from a 
	 * given array, excluding any URIs that are children of others in the array. 
	 * 
	 * @param uris An array of URI objects to be evaluated for parent-child 
	 * 			   relationships.
	 * @returns An array of URI objects representing distinct parent URIs, with 
	 * 			no child URIs included.
	 * 
	 * @note This function is useful for filtering out URIs to ensure that only 
	 * top-level (parent) resources are considered, without any duplicates.
	 */
	public static distinctParents(uris: URI[]): URI[] {
		const distinct: URI[] = [];

		for (let i = 0; i < uris.length; i++) {
			const uri = uris[i]!;

			const isChildOrParent = uris.some((other, idx) => {
				if (idx === i) {
					return false;
				}

				return URI.isParentOf(uri, other) || URI.equals(uri, other);
			});

			if (!isChildOrParent) {
				distinct.push(uri);
			}
		}

		return distinct;
	}
	
	/**
	 * @description Same as {@link URI.distinctParents}, but instead of directly
	 * filtering the URI, this is filtering a generic type T.
	 * @param items Array of items of generic type T.
	 * @param getURI Function to extract URI from an item.
	 * @returns Array of distinct items based on their URIs.
	 */
	public static distinctParentsByUri<T>(items: T[], getURI: (item: T) => URI): T[] {
		const distinct: T[] = [];

		for (let i = 0; i < items.length; i++) {
			const item = items[i]!;
			const uri = getURI(item);

			const isChildOrParent = items.some((other, idx) => {
				if (idx === i) {
					return false;
				}

				const otherUri = getURI(other);
				return URI.isParentOf(uri, otherUri) || URI.equals(uri, otherUri);
			});

			if (!isChildOrParent) {
				distinct.push(item);
			}
		}

		return distinct;
	}

	/**
	 * @description Creates a string representation for this URI. It's 
	 * guaranteed that calling `URI.parse` with the result of this function 
	 * creates an URI which is equal to this URI.
	 * @param skipEncoding Do not encode the result, default is `true`
	 * 
	 * * The result shall *not* be used for display purposes but for externalization or transport.
	 * * The result will be encoded using the percentage encoding and encoding happens mostly
	 * ignore the scheme-specific encoding rules.
	 */
	public static toString(uri: URI, skipEncoding: boolean = true): string {
		return __toString(uri, skipEncoding);
	}

	/**
	 * @description Return the last part of a URI path.
	 */
	public static basename(uri: URI): string {
		return paths.posix.basename(uri.path);
	}

	/**
	 * @description Return the extension of the URI path.
	 */
	public static extname(uri: URI): string {
		return paths.posix.extname(uri.path);
	}

	/**
	 * @description Return the directory of the URI path.
	 */
	public static dirname(uri: URI): URI {
		if (uri.path.length === 0) {
			return uri;
		}

		let dirname: string;

		if (uri.scheme === Schemas.FILE) {
			dirname = URI.fromFile(paths.dirname(URI.toFsPath(uri, true))).path;
		}
		else {
			dirname = paths.posix.dirname(uri.path);
			if (uri.authority && dirname.length && dirname.charCodeAt(0) !== CharCode.Slash) {
				console.error(`dirname("${uri.toString})) resulted in a relative path`);
				dirname = '/'; // If a URI contains an authority component, then the path component must either be empty or begin with a CharCode.Slash ("/") character
			}
		}

		return URI.with(uri, { path: dirname });
	}

	public static from(components: Partial<IURI> & { scheme: string; }, strict?: boolean): URI {
		return new URI(
			components.scheme,
			components.authority,
			components.path,
			components.query,
			components.fragment,
			strict,
		);
	}

	/**
	 * @description Creates a new URI by merging the given changes into the given URI.
	 */
	public static with(uri: IURI, change: { scheme?: string; authority?: string | null; path?: string | null; query?: string | null; fragment?: string | null; }): URI {
		if (!change) {
			return uri;
		}

		let { scheme, authority, path, query, fragment } = change;
		scheme    = scheme === undefined    ? uri.scheme    : (scheme === null    ? _empty : scheme);
		authority = authority === undefined ? uri.authority : (authority === null ? _empty : authority);
		path      = path === undefined      ? uri.path      : (path === null      ? _empty : path);
		query     = query === undefined     ? uri.query     : (query === null     ? _empty : query);
		fragment  = fragment === undefined  ? uri.fragment  : (fragment === null  ? _empty : fragment);

		if (scheme === uri.scheme
			&& authority === uri.authority
			&& path === uri.path
			&& query === uri.query
			&& fragment === uri.fragment
		) {
			return uri;
		}

		return new URI(scheme, authority, path, query, fragment);
	}

	/**
	 * @description Revive a serialized URI.
	 */
	public static revive(obj: any, registrant: IReviverRegistrant): URI {
		if (!obj) {
			return obj;
		}

		if (obj instanceof URI) {
			return obj;
		}

		const uri = registrant.revive<URI>(obj);
		return uri;
	}

	/**
	 * @description Gets the human readable label (in string) for a uri.
	 */
	public static tildify(uri: URI, formatter: ITildifyFormatter): string {
		const { os, tildify: tildifyFormatter } = formatter;

		/**
		 * Try to resolve a absolute path label and apply target OS standard 
		 * path separators if target OS differs from actual OS we are running in.
		 */
		let absolutePath = URI.toFsPath(uri);
		if (os === Platform.Windows && !IS_WINDOWS) {
			absolutePath = absolutePath.replace(/\//g, '\\');
		} else if (os !== Platform.Windows && IS_WINDOWS) {
			absolutePath = absolutePath.replace(/\\/g, '/');
		}

		// macOS/Linux: tildify with provided user home directory
		if (os !== Platform.Windows && tildifyFormatter?.userHome) {
			const userHome = URI.toFsPath(tildifyFormatter.userHome);

			/**
			 * This is a bit of a hack, but in order to figure out if the 
			 * resource is in the user home, we need to make sure to convert it
			 * to a user home resource. We cannot assume that the resource is
			 * already a user home resource.
			 */
			let userHomeCandidate: string;
			if (uri.scheme !== tildifyFormatter.userHome.scheme && uri.path[0] === paths.posix.sep && uri.path[1] !== paths.posix.sep) {
				userHomeCandidate = URI.toFsPath(URI.with(tildifyFormatter.userHome, { path: uri.path }));
			} else {
				userHomeCandidate = absolutePath;
			}

			absolutePath = tildify(userHomeCandidate, userHome, os);
		}

		// normalize
		const pathLib = os === Platform.Windows ? paths.win32 : paths.posix;
		return pathLib.normalize(normalizeDriveLetter(absolutePath, os === Platform.Windows));
	}
}

/*******************************************************************************
 * decoding URI
 ******************************************************************************/

function decodeURIComponentGraceful(str: string): string {
	try {
		return decodeURIComponent(str);
	} catch {
		if (str.length > 3) {
			return str.substr(0, 3) + decodeURIComponentGraceful(str.substr(3));
		} else {
			return str;
		}
	}
}

const _rEncodedAsHex = /(%[0-9A-Za-z][0-9A-Za-z])+/g;

function percentDecode(str: string): string {
	if (!str.match(_rEncodedAsHex)) {
		return str;
	}
	return str.replace(_rEncodedAsHex, (match) => decodeURIComponentGraceful(match));
}

// reserved characters: https://tools.ietf.org/html/rfc3986#section-2.2
const encodeTable: { [ch: number]: string; } = {
	[CharCode.Colon]: '%3A', // gen-delims
	[CharCode.Slash]: '%2F',
	[CharCode.QuestionMark]: '%3F',
	[CharCode.Hash]: '%23',
	[CharCode.OpenSquareBracket]: '%5B',
	[CharCode.CloseSquareBracket]: '%5D',
	[CharCode.AtSign]: '%40',

	[CharCode.ExclamationMark]: '%21', // sub-delims
	[CharCode.DollarSign]: '%24',
	[CharCode.Ampersand]: '%26',
	[CharCode.SingleQuote]: '%27',
	[CharCode.OpenParen]: '%28',
	[CharCode.CloseParen]: '%29',
	[CharCode.Asterisk]: '%2A',
	[CharCode.Plus]: '%2B',
	[CharCode.Comma]: '%2C',
	[CharCode.Semicolon]: '%3B',
	[CharCode.Equals]: '%3D',

	[CharCode.Space]: '%20',
};

function encodeURIComponentFast(uriComponent: string, isPath: boolean, isAuthority: boolean): string {
	let res: string | undefined = undefined;
	let nativeEncodePos = -1;

	for (let pos = 0; pos < uriComponent.length; pos++) {
		const code = uriComponent.charCodeAt(pos);

		// unreserved characters: https://tools.ietf.org/html/rfc3986#section-2.3
		if (
			(code >= CharCode.a && code <= CharCode.z)
			|| (code >= CharCode.A && code <= CharCode.Z)
			|| (code >= CharCode.Digit0 && code <= CharCode.Digit9)
			|| code === CharCode.Dash
			|| code === CharCode.Period
			|| code === CharCode.Underline
			|| code === CharCode.Tilde
			|| (isPath && code === CharCode.Slash)
			|| (isAuthority && code === CharCode.OpenSquareBracket)
			|| (isAuthority && code === CharCode.CloseSquareBracket)
			|| (isAuthority && code === CharCode.Colon)
		) {
			// check if we are delaying native encode
			if (nativeEncodePos !== -1) {
				res += encodeURIComponent(uriComponent.substring(nativeEncodePos, pos));
				nativeEncodePos = -1;
			}
			// check if we write into a new string (by default we try to return the param)
			if (res !== undefined) {
				res += uriComponent.charAt(pos);
			}

		} else {
			// encoding needed, we need to allocate a new string
			if (res === undefined) {
				res = uriComponent.substr(0, pos);
			}

			// check with default table first
			const escaped = encodeTable[code];
			if (escaped !== undefined) {

				// check if we are delaying native encode
				if (nativeEncodePos !== -1) {
					res += encodeURIComponent(uriComponent.substring(nativeEncodePos, pos));
					nativeEncodePos = -1;
				}

				// append escaped variant to result
				res += escaped;

			} else if (nativeEncodePos === -1) {
				// use native encode only when needed
				nativeEncodePos = pos;
			}
		}
	}

	if (nativeEncodePos !== -1) {
		res += encodeURIComponent(uriComponent.substring(nativeEncodePos));
	}

	return res !== undefined ? res : uriComponent;
}

function encodeURIComponentMinimal(path: string): string {
	let res: string | undefined = undefined;
	for (let pos = 0; pos < path.length; pos++) {
		const code = path.charCodeAt(pos);
		if (code === CharCode.Hash || code === CharCode.QuestionMark) {
			if (res === undefined) {
				res = path.substr(0, pos);
			}
			res += encodeTable[code];
		} else {
			if (res !== undefined) {
				res += path[pos];
			}
		}
	}
	return res !== undefined ? res : path;
}

function __toString(uri: URI, skipEncoding: boolean): string {

	const encoder = !skipEncoding ? encodeURIComponentFast : encodeURIComponentMinimal;

	let res = '';
	let { authority, path } = uri;
	const { scheme, query, fragment } = uri;

	if (scheme) {
		res += scheme;
		res += ':';
	}
	if (authority || scheme === Schemas.FILE) {
		res += _slash + _slash;
	}
	if (authority) {
		let idx = authority.indexOf('@');
		if (idx !== -1) {
			// <user>@<auth>
			const userinfo = authority.substr(0, idx);
			authority = authority.substr(idx + 1);
			idx = userinfo.lastIndexOf(':');
			if (idx === -1) {
				res += encoder(userinfo, false, false);
			} else {
				// <user>:<pass>@<auth>
				res += encoder(userinfo.substr(0, idx), false, false);
				res += ':';
				res += encoder(userinfo.substr(idx + 1), false, true);
			}
			res += '@';
		}
		authority = authority.toLowerCase();
		idx = authority.lastIndexOf(':');
		if (idx === -1) {
			res += encoder(authority, false, true);
		} else {
			// <auth>:<port>
			res += encoder(authority.substr(0, idx), false, true);
			res += authority.substr(idx);
		}
	}
	if (path) {
		// lower-case windows drive letters in /C:/fff or C:/fff
		if (path.length >= 3 && path.charCodeAt(0) === CharCode.Slash && path.charCodeAt(2) === CharCode.Colon) {
			const code = path.charCodeAt(1);
			if (code >= CharCode.A && code <= CharCode.Z) {
				path = `/${String.fromCharCode(code + 32)}:${path.substr(3)}`; // "/c:".length === 3
			}
		} else if (path.length >= 2 && path.charCodeAt(1) === CharCode.Colon) {
			const code = path.charCodeAt(0);
			if (code >= CharCode.A && code <= CharCode.Z) {
				path = `${String.fromCharCode(code + 32)}:${path.substr(2)}`; // "/c:".length === 3
			}
		}
		// encode the rest of the path
		res += encoder(path, true, false);
	}
	if (query) {
		res += '?';
		res += encoder(query, false, false);
	}
	if (fragment) {
		res += '#';
		res += !skipEncoding ? encodeURIComponentFast(fragment, false, false) : fragment;
	}
	return res;
}

export function isAbsoluteURI(uri: URI): boolean {
	return !!uri.path && uri.path[0] !== '.';
}

const _schemePattern = /^\w[\w\d+.-]*$/;
const _singleSlashStart = /^\//;
const _doubleSlashStart = /^\/\//;

function __validateUri(ret: URI, _strict?: boolean): void {

	// scheme, must be set
	if (!ret.scheme && _strict) {
		panic(`[URI]: Scheme is missing: {scheme: "", authority: "${ret.authority}", path: "${ret.path}", query: "${ret.query}", fragment: "${ret.fragment}"}`);
	}

	// scheme, https://tools.ietf.org/html/rfc3986#section-3.1
	// ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
	if (ret.scheme && !_schemePattern.test(ret.scheme)) {
		panic('[URI]: Scheme contains illegal characters.');
	}

	// path, http://tools.ietf.org/html/rfc3986#section-3.3
	// If a URI contains an authority component, then the path component
	// must either be empty or begin with a slash ("/") character.  If a URI
	// does not contain an authority component, then the path cannot begin
	// with two slash characters ("//").
	if (ret.path) {
		if (ret.authority) {
			if (!_singleSlashStart.test(ret.path)) {
				panic('[URI]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character');
			}
		} else {
			if (_doubleSlashStart.test(ret.path)) {
				panic('[URI]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")');
			}
		}
	}
}

// for a while we allowed uris *without* schemes and this is the migration
// for them, e.g. an uri without scheme and without strict-mode warns and falls
// back to the file-scheme. that should cause the least carnage and still be a
// clear warning
function __schemeFix(scheme: string, _strict: boolean): string {
	if (!scheme && !_strict) {
		return Schemas.FILE;
	}
	return scheme;
}

// implements a bit of https://tools.ietf.org/html/rfc3986#section-5
function __referenceResolution(scheme: string, path: string): string {

	// the slash-character is our 'default base' as we don't
	// support constructing URIs relative to other URIs. This
	// also means that we alter and potentially break paths.
	// see https://tools.ietf.org/html/rfc3986#section-5.1.4
	switch (scheme) {
		case Schemas.HTTPS:
		case Schemas.HTTP:
		case Schemas.FILE:
			if (!path) {
				path = _slash;
			} else if (path[0] !== _slash) {
				path = _slash + path;
			}
			break;
	}
	return path;
}