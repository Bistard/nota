import { compareSubstringIgnoreCase } from "src/base/common/files/glob";
import { OS_CASE_SENSITIVE } from "src/base/common/platform";
import { Iterable } from "src/base/common/utilities/iterable";
import { CompareOrder, isObject } from "src/base/common/utilities/type";

/**
 * @namespace Strings A collection of functions that relates to string types.
 * 
 * A list of sub-namespaces.
 * @see Strings.IgnoreCase
 * @see Strings.Smart
 */
export namespace Strings {

    /**
     * @description Check if any of the given {@link RegExp} is applied to the
     * provided string.
     * @param str The provided string.
     * @param rules An array of {@link RegExp}.
     * @returns If any rules is applied.
     * @note empty rules return true.
     */
    export function anyRegExp(str: string, rules: readonly RegExp[]): boolean {
        if (rules.length === 0) {
            return true;
        }
        return Iterable.reduce<RegExp, boolean>(rules, false, (tot, rule) => tot ? true : rule.test(str));
    }

    /**
     * @description Stringify the given arguments and join them using a space.
     * @param args The given arguments.
     */
    export function stringify(...args: any): string {
        let result = '';

        for (let i = 0; i < args.length; i++) {
            let obj = args[i];

            if (isObject(obj)) {
                try {
                    obj = JSON.stringify(obj);
                } catch (e) {
                    console.log(`[Strings.stringify] error: ${e}`);
                }
            }

            result += (i > 0 ? ' ' : '') + obj;
        }

        return result;
    }

    /**
     * @description Format a given raw string with the given interpolation using
     * indice.
     * @returns The formatted new string.
     * @example format('hello {0}', ['Chris']) -> 'Hello Chris'
     */
    export function format(raw: string, interpolation: any[]): string {
        if (interpolation.length === 0) {
            return raw;
        }
        
        let result = '';
        result = raw.replace(/\{(\d+)\}/g, (match, rest) => {
            const index = rest[0];
            const arg = interpolation[index];
            let result = match;
            if (typeof arg === 'string') {
                result = arg;
            } else if ((typeof arg === 'number') || (typeof arg === 'boolean') || (arg === void 0) || (arg === null)) {
                result = String(arg);
            }
            return result;
        });

        return result;
    }
    
    /**
     * @description Trims all occurrences of a specified substring from the end 
     * of a given string.
     * 
     * @note The function iterates from the end of the string (`haystack`) and 
     * removes each occurrence of the `needle` substring until it encounters a 
     * part of the `haystack` that does not end with the `needle`.
     * 
     * @note If the `haystack` or `needle` is empty, or if the `needle` is not 
     * found at the end of the `haystack`, the original `haystack` string is 
     * returned unchanged.
     * 
     * @param haystack The string from which to remove the trailing occurrences 
     *                 of `needle`.
     * @param needle The substring to remove from the end of `haystack`.
     * @returns The modified string with the `needle` removed from the end, or 
     *          the original `haystack` if no `needle` is found at the end.
     * 
     * @example
     * rtrim('Hello world!!!', '!'); // Returns 'Hello world'
     * rtrim('foobarbarbar', 'bar'); // Returns 'foo'
     * rtrim('abcabc', 'abc'); // Returns ''
     */
    export function rtrim(haystack: string, needle: string): string {
        if (!haystack || !needle) {
            return haystack;
        }

        const needleLen = needle.length;
        const haystackLen = haystack.length;

        if (needleLen === 0 || haystackLen === 0) {
            return haystack;
        }

        let offset = haystackLen;
        let idx = -1;

        while (true) {
            idx = haystack.lastIndexOf(needle, offset - 1);
            if (idx === -1 || idx + needleLen !== offset) {
                break;
            }
            if (idx === 0) {
                return '';
            }
            offset = idx;
        }

        return haystack.substring(0, offset);
    }

    /**
     * This namespace contains a list of string comparison utilities that will
     * ignore case sensitivity.
     */
    export namespace IgnoreCase {
        
        export function equals(a: string, b: string): boolean {
            return a.length === b.length && compareSubstringIgnoreCase(a, b) === CompareOrder.Same;
        }

        export function startsWith(str: string, candidate: string): boolean {
            const candidateLength = candidate.length;
            if (candidate.length > str.length) {
                return false;
            }
            return compareSubstringIgnoreCase(str, candidate, 0, candidateLength) === CompareOrder.Same;
        }
    }

    /**
     * This namespace will smartly detecting should enable or disable ignoring
     * case when doing string comparison.
     */
    export namespace Smart {
        
        /**
         * @description If case sensitive, return the same string, otherwise
         * a lower case version of the string returned.
         */
        export function adjust(str: string): string {
            if (OS_CASE_SENSITIVE) {
                return str;
            }
            return str.toLowerCase();
        }

        export function equals(a: string, b: string): boolean {
            if (OS_CASE_SENSITIVE) {
                return a === b;
            }
            return Strings.IgnoreCase.equals(a, b);
        }

        export function startsWith(str: string, candidate: string): boolean {
            if (OS_CASE_SENSITIVE) {
                return str.startsWith(candidate);
            }
            return Strings.IgnoreCase.startsWith(str, candidate);
        }
    }
}

/**
 * (U)niversal (U)nique (ID)entifier.
 */
export type UUID = string;

