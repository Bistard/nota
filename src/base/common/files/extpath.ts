import { posix } from "path";
import { CharCode } from "src/base/common/utilities/char";

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