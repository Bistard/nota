import { sep } from "src/base/common/files/path";
import { Character } from "src/base/common/utilities/char";
import { CompareOrder } from "src/base/common/utilities/type";

/**
 * @description If the candidate is the parent of the given path.
 * @param path The given path.
 * @param candidate The possible parent of the given path.
 * @param ignoreCase Make it case insensitive.
 */
export function isParentOf(path: string, candidate: string, ignoreCase?: boolean): boolean {
	if (!path || !candidate || path === candidate) {
		return false;
	}

	if (candidate.length > path.length) {
		return false;
	}

	if (candidate.charAt(candidate.length - 1) !== sep) {
		candidate += sep;
	}

	if (ignoreCase) {
		return compareSubstringIgnoreCase(path, candidate, 0, candidate.length) === 0;
	}

	return path.indexOf(candidate) === 0;
}

/**
 * @description Compare the substrings of a and b, ignore the case of the string,
 * i.e. A and a are considered equal.
 * return a negative number if the substring of a is smaller, 
 * return a positive number if the substring of b is smaller,
 * return 0 if the substring of a and substring of b is equal.
 * @param a The first full string.
 * @param b The second full string.
 * @param aStart The index of the start of a's substring in a.
 * @param aEnd The index of the end of a's substring in a.
 * @param bStart The index of the start of b's substring in b.
 * @param bEnd The index of the end of b's substring in b.
 */
export function compareSubstringIgnoreCase(a: string, b: string, aStart: number = 0, aEnd: number = a.length, bStart: number = 0, bEnd: number = b.length): number {

	for (; aStart < aEnd && bStart < bEnd; aStart++, bStart++) {
		let codeA = a.charCodeAt(aStart);
		let codeB = b.charCodeAt(bStart);

		if (codeA === codeB) {
			// equal
			continue;
		}

		if (codeA >= 128 || codeB >= 128) {
			// not ASCII letters -> fallback to lower-casing strings
			return compareSubstring(a.toLowerCase(), b.toLowerCase(), aStart, aEnd, bStart, bEnd);
		}

		// mapper lower-case ascii letter onto upper-case varinats
		// [97-122] (lower ascii) --> [65-90] (upper ascii)
		if (Character.isLowerAscii(codeA)) {
			codeA -= 32;
		}
		if (Character.isLowerAscii(codeB)) {
			codeB -= 32;
		}

		// compare both code points
		const diff = codeA - codeB;
		if (diff === 0) {
			continue;
		}

		return diff;
	}

	const aLen = aEnd - aStart;
	const bLen = bEnd - bStart;

	if (aLen < bLen) {
		return CompareOrder.First;
	} else if (aLen > bLen) {
		return CompareOrder.Second;
	}

	return 0;
}

/**
 * @description Compare the substrings of a and b, 
 * return a negative number if the substring of a is smaller, 
 * return a positive number if the substring of b is smaller,
 * return 0 if the substring of a and substring of b is equal.
 * @param a The first full string.
 * @param b The second full string.
 * @param aStart The index of the start of a's substring in a.
 * @param aEnd The index of the end of a's substring in a.
 * @param bStart The index of the start of b's substring in b.
 * @param bEnd The index of the end of b's substring in b.
 */
export function compareSubstring(a: string, b: string, aStart: number = 0, aEnd: number = a.length, bStart: number = 0, bEnd: number = b.length): number {
	for (; aStart < aEnd && bStart < bEnd; aStart++, bStart++) {
		const codeA = a.charCodeAt(aStart);
		const codeB = b.charCodeAt(bStart);
		if (codeA < codeB) {
			return CompareOrder.First;
		} else if (codeA > codeB) {
			return CompareOrder.Second;
		}
	}
	const aLen = aEnd - aStart;
	const bLen = bEnd - bStart;
	if (aLen < bLen) {
		return CompareOrder.First;
	} else if (aLen > bLen) {
		return CompareOrder.Second;
	}
	return 0;
}