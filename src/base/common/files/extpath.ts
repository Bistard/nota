import { posix } from "src/base/common/files/path";
import { URI } from "src/base/common/files/uri";
import { IS_WINDOWS, Platform } from "src/base/common/platform";
import { CharCode } from "src/base/common/utilities/char";
import { Strings } from "src/base/common/utilities/string";

/**
 * @description Determines if the provided code corresponds to a path separator 
 * character ('/' or '\').
 * @param code The character code to be evaluated.
 */
export function isPathSeparator(code: number) {
	return code === CharCode.Slash || code === CharCode.Backslash;
}

/**
 * @description Converts backslashes in a Windows-style path to forward slashes.
 * @param path The Windows-style path to convert.
 * @returns The modified path with forward slashes.
 * 
 * @note This should only be done for OS paths from Windows (or user provided 
 *       paths potentially from Windows).
 * @note Applying it to paths from other OS (e.g., Linux or macOS) may lead to 
 *       unintended modifications.
 */
export function toForwardSlash(path: string): string {
	return path.replace(/[\\/]/g, posix.sep);
}

/**
 * @description Takes a Windows OS path (using backward or forward slashes) and turns it into a posix path:
 * - turns backward slashes into forward slashes
 * - makes it absolute if it starts with a drive letter
 * 
 * @note This should only be done for OS paths from Windows (or user provided 
 *        paths potentially from Windows).
 * @note Applying it to paths from other OS (e.g., Linux or macOS) may lead to 
 *       unintended modifications.
 */
export function toPosixPath(path: string): string {
	if (path.indexOf('/') === -1) {
		path = toForwardSlash(path);
	}

    // starts with a drive letter
	if (/^[a-zA-Z]:(\/|$)/.test(path)) {
		path = '/' + path;
	}
    
	return path;
}

export function normalizeDriveLetter(path: string, isWindowsOS: boolean = IS_WINDOWS): string {
	if (hasDriveLetter(path, isWindowsOS)) {
		return path.charAt(0).toUpperCase() + path.slice(1);
	}

	return path;
}

export function hasDriveLetter(path: string, isWindowsOS: boolean = IS_WINDOWS): boolean {
	if (isWindowsOS) {
		return isWindowsDriveLetter(path.charCodeAt(0)) && path.charCodeAt(1) === CharCode.Colon;
	}
	return false;
}

export function isWindowsDriveLetter(char0: number): boolean {
	return char0 >= CharCode.A && char0 <= CharCode.Z || char0 >= CharCode.a && char0 <= CharCode.z;
}

export interface ITildifyFormatter {

	/**
	 * The OS the path label is from to produce a label that matches OS 
	 * expectations.
	 */
	readonly os: Platform;

	/**
	 * Whether to add a `~` when the path is in the user home directory.
	 * @note this only applies to Linux, macOS but NOT Windows.
	 */
	readonly tildify?: { readonly userHome: URI; };
}

let normalizedUserHomeCached: { original: string; normalized: string; } = Object.create(null);

/**
 * @description Converts a given path to use a tilde (`~`) as a shorthand for 
 * the user's home directory, if the path is within the user's home directory. 
 * @param path The file path to potentially convert to a tilde shorthand.
 * @param userHome The user's home directory path.
 * @param os The operating system platform.
 * 
 * @note This function is supported on non-Windows platforms only.
 */
export function tildify(path: string, userHome: string, os: Platform): string {
	if (os === Platform.Windows || !path || !userHome) {
		return path; // unsupported on Windows
	}

	let normalizedUserHome = normalizedUserHomeCached.original === userHome ? normalizedUserHomeCached.normalized : undefined;
	if (!normalizedUserHome) {
		normalizedUserHome = userHome;
		if (IS_WINDOWS) {
			// make sure that the path is POSIX normalized on Windows
			normalizedUserHome = toForwardSlash(normalizedUserHome);
		}
		normalizedUserHome = `${Strings.rtrim(normalizedUserHome, posix.sep)}${posix.sep}`;
		normalizedUserHomeCached = { original: userHome, normalized: normalizedUserHome };
	}

	let normalizedPath = path;
	if (IS_WINDOWS) {
		// make sure that the path is POSIX normalized on Windows
		normalizedPath = toForwardSlash(normalizedPath);
	}

	// Linux: case sensitive, macOS: case insensitive
	if (Strings.Smart.startsWith(normalizedPath, normalizedUserHome)) {
		return `~/${normalizedPath.substring(normalizedUserHome.length)}`;
	}

	return path;
}