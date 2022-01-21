/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CharCode } from "src/base/common/char";
import { IS_WINDOWS } from "src/base/node/os";
import * as paths from "src/base/common/file/path";

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

    /**
     * returns a single string form of the URI
     */
    toString(): string;
}

export const enum Schemas {
	FILE = 'file',
	HTTP = 'http'
}

const _empty = '';
const _slash = '/';
const _regexp = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;

export class URI implements IURI {
    
    public readonly scheme!: string;
    public readonly authority!: string;
	public readonly path!: string;
	public readonly query!: string;
	public readonly fragment!: string;

	/** @internal */
    private constructor(scheme: string, authority: string, path: string, query: string, fragment: string) {
        this.scheme = scheme;
        this.authority = authority;
        this.path = path;
        this.query = query;
        this.fragment = fragment;
    }

    /**
	 * Creates a new URI from a string, e.g. `http://www.msft.com/some/path`,
	 * `file:///usr/home`, or `scheme:with/path`.
	 *
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

    public static isUri(thing: any): thing is URI {
		if (thing instanceof URI) {
			return true;
		}
		if (!thing) {
			return false;
		}
		return typeof (<URI>thing).authority === 'string'
			&& typeof (<URI>thing).fragment === 'string'
			&& typeof (<URI>thing).path === 'string'
			&& typeof (<URI>thing).query === 'string'
			&& typeof (<URI>thing).scheme === 'string'
			&& typeof (<URI>thing).toString === 'function';
	}

	/** @description Compute `fsPath` for the given uri. */
	public static toFsPath(uri: URI, keepDriveLetterCasing: boolean = true): string {

		let value: string;
		if (uri.authority && uri.path.length > 1 && uri.scheme === 'file') {
			// unc path: file://shares/c$/far/boo
			value = `${uri.authority}${uri.path}`;
		} else if (
			uri.path.charCodeAt(0) === CharCode.Slash
			&& (uri.path.charCodeAt(1) >= CharCode.A && uri.path.charCodeAt(1) <= CharCode.Z || uri.path.charCodeAt(1) >= CharCode.a && uri.path.charCodeAt(1) <= CharCode.z)
			&& uri.path.charCodeAt(2) === CharCode.Colon
		) {
			if (!keepDriveLetterCasing) {
				// windows drive letter: file:///c:/far/boo
				value = uri.path[1]!.toLowerCase() + uri.path.substr(2);
			} else {
				value = uri.path.substr(1);
			}
		} else {
			// other path
			value = uri.path;
		}
		if (IS_WINDOWS) {
			value = value.replace(/\//g, '\\');
		}
		return value;
	}

	/**
	 * Creates a new URI from a file system path, e.g. `c:\my\files`,
	 * `/usr/home`, or `\\server\share\some\path`.
	 *
	 * The *difference* between `URI#parse` and `URI#fromFile` is that the latter treats the argument
	 * as path, not as stringified-uri. E.g. `URI.fromFile(path)` is **not the same as**
	 * `URI.parse('file://' + path)` because the path might contain characters that are
	 * interpreted (# and ?). See the following sample:
	 * ```ts
		const good = URI.file('/coding/c#/project1');
		good.scheme === 'file';
		good.path === '/coding/c#/project1';
		good.fragment === '';
		const bad = URI.parse('file://' + '/coding/c#/project1');
		bad.scheme === 'file';
		bad.path === '/coding/c'; // path is now broken
		bad.fragment === '/project1';
		```
	 *
	 * @param path A file system path (see `URI#fsPath`)
	 */
	static fromFile(path: string): URI {

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

		return new URI('file', authority, path, _empty, _empty);
	}

	/**
	 * Creates a string representation for this URI. It's guaranteed that calling
	 * `URI.parse` with the result of this function creates an URI which is equal
	 * to this URI.
	 *
	 * * The result shall *not* be used for display purposes but for externalization or transport.
	 * * The result will be encoded using the percentage encoding and encoding happens mostly
	 * ignore the scheme-specific encoding rules.
	 *
	 * @param skipEncoding Do not encode the result, default is `true`
	 */
	 public toString(skipEncoding: boolean = true): string {
        return _toString(this, skipEncoding);
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
const encodeTable: { [ch: number]: string } = {
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

function encodeURIComponentFast(uriComponent: string, allowSlash: boolean): string {
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
			|| (allowSlash && code === CharCode.Slash)
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

function _toString(uri: URI, skipEncoding: boolean): string {

	const encoder = !skipEncoding ? encodeURIComponentFast : encodeURIComponentMinimal;

	let res = '';
	let { scheme, authority, path, query, fragment } = uri;
	if (scheme) {
		res += scheme;
		res += ':';
	}
	if (authority || scheme === 'file') {
		res += _slash;
		res += _slash;
	}
	if (authority) {
		let idx = authority.indexOf('@');
		if (idx !== -1) {
			// <user>@<auth>
			const userinfo = authority.substr(0, idx);
			authority = authority.substr(idx + 1);
			idx = userinfo.indexOf(':');
			if (idx === -1) {
				res += encoder(userinfo, false);
			} else {
				// <user>:<pass>@<auth>
				res += encoder(userinfo.substr(0, idx), false);
				res += ':';
				res += encoder(userinfo.substr(idx + 1), false);
			}
			res += '@';
		}
		authority = authority.toLowerCase();
		idx = authority.indexOf(':');
		if (idx === -1) {
			res += encoder(authority, false);
		} else {
			// <auth>:<port>
			res += encoder(authority.substr(0, idx), false);
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
		res += encoder(path, true);
	}
	if (query) {
		res += '?';
		res += encoder(query, false);
	}
	if (fragment) {
		res += '#';
		res += !skipEncoding ? encodeURIComponentFast(fragment, false) : fragment;
	}
	return res;
}

/*******************************************************************************
 * URI Helper Functions
 ******************************************************************************/

export function isAbsoluteURI(uri: URI): boolean {
	return !!uri.path && uri.path[0] !== '.';
}

export function resolveURI(uri: URI, path: string): URI {
	if (uri.scheme === Schemas.FILE) {
		const newURI = URI.fromFile(paths.resolve(URI.toFsPath(uri), path));
		return newURI;
	}
	throw new Error('given uri is not legal');
}