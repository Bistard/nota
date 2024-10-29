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

            if (isObject(obj) || Array.isArray(obj)) {
                try {
                    obj = JSON.stringify(obj);
                } catch (e) {
                    obj = '[Strings.stringify() error]';
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
     * @description Escapes special characters in a string.
     * @param str The string to be escaped.
     * @returns The escaped string with special characters replaced.
     * 
     * @example
     * const input = 'Hello\nWorld! "Test" \\Example\\';
     * console.log(escape(input)); // 'Hello\\nWorld! \\"Test\\" \\\\Example\\\\'
     */
    export function escape(str: string): string {
        let escapedStr = '';
    
        for (let i = 0; i < str.length; i++) {
            const char = str[i]!;
            if (_escapeMap[char]) {
                escapedStr += _escapeMap[char];
            } else {
                escapedStr += char;
            }
        }
        return escapedStr;
    }

    /**
     * @description Iterates over a string, splitting it by the specified 
     * character, and yields an object containing each segment (line) and its 
     * line number.
     * 
     * @note This function processes the input string character by character 
     * without using `String.prototype.split()`, making it efficient for large inputs.
     * 
     * @param text The input string to iterate over.
     * @param char The character used to split the string.
     * @yields An object containing:
     * - `line`: The content of the segment (without the split character).
     * - `lineNumber`: The zero-based index of the segment.
     * 
     * @example
     * const text = `Hello,World,This,is,a,test`;
     * for (const { line, lineNumber } of iterateSplit(text, ',')) {
     *     console.log(`Segment ${lineNumber}: ${line}`);
     * }
     * // Segment 0: Hello
     * // Segment 1: World
     * // Segment 2: This
     * // Segment 3: is
     * // Segment 4: a
     * // Segment 5: test
     */
    export function *iterateSplit(text: string, char: string): IterableIterator<{ line: string; lineNumber: number, isLastLine: boolean }> {
        let lineStart = 0;
        let lineNumber = 0;

        for (let i = 0; i < text.length; i++) {
            if (text[i] === char) {
                yield { line: text.slice(lineStart, i), lineNumber, isLastLine: false };
                lineStart = i + 1;
                lineNumber++;
            }
        }

        // yield the last line if any remaining
        if (lineStart <= text.length) {
            yield { line: text.slice(lineStart), lineNumber, isLastLine: true };
        } 
        // handle the case where the last character is the split character
        else if (text[text.length - 1] === char) {
            yield { line: '', lineNumber, isLastLine: true };
        }
    }

    /**
     * @description Iterates over each line in the provided text, yielding an 
     * object containing the line and its line number.
     * 
     * @note This function processes the input string character by character 
     * without using `String.prototype.split()`, making it more efficient for 
     * large inputs.
     * 
     * @param text The input text to iterate over.
     * @yields An object containing:
     * - `line`: The content of the line (without the newline character).
     * - `lineNumber`: The zero-based line number of the line.
     * - `isLastLine`: Determine if the line is the last one.
     * 
     * @example
     * const text = `Hello, World!\nThis is line 2.\nAnd this is line 3`;
     * for (const { line, lineNumber } of iterateLines(text)) {
     *     console.log(`Line ${lineNumber}: ${line}`);
     * }
     * // Line 0: Hello, World!
     * // Line 1: This is line 2.
     * // Line 2: And this is line 3
     */
    export function *iterateLines(text: string): IterableIterator<{ line: string; lineNumber: number, isLastLine: boolean }> {
        for (const result of iterateSplit(text, '\n')) {
            yield result;
        }
    }

    /**
     * @description Returns a substring from the start of the given string `s` 
     * up to (but not including) the first occurrence of the specified character 
     * `c`. If the character `c` is not found, returns the entire string.
     *
     * @param s The input string to extract the substring from.
     * @param c The character to search for in the string `s`.
     * @param startPosition The initial index for searching string. 0 if not provided.
     * @returns The substring from the start of `s` up to but not including the 
     *          first occurrence of `c`. If `c` is not found, returns the entire 
     *          string.
     * @example
     * substringUntilChar('hello world', 'o'); // returns 'hell'
     * substringUntilChar('javascript', 'a'); // returns 'j'
     * substringUntilChar('javascript', 'z'); returns 'javascript' (because 'z' is not found)
     */
    export function substringUntilChar(s: string, c: string, startPosition?: number): string {
        const index = s.indexOf(c, startPosition ?? 0);
        if (index === -1) {
            return s;
        }
        return s.slice(0, index);
    }

    /**
     * @description Returns an object containing the index of the first occurrence
     * of the specified character `c` in the given string `s` (starting from an 
     * optional `startPosition`) and the substring from the beginning of `s` up 
     * to (but not including) that character. If `c` is not found, the index 
     * will be `-1` and the substring will be the entire string.
     *
     * @param s The input string to search and extract the substring from.
     * @param c The character to search for within the string `s`.
     * @param [startPosition=0] The starting index from which to begin the search in `s`.
     * @returns An object containing:
     *  - `index`: the index of the first occurrence of `c` in `s`, or `-1` if not found.
     *  - `str`: the substring from the start of `s` up to, but not including, the first occurrence of `c`.
     *           If `c` is not found, returns the entire string.
     * @example
     * substringUntilChar2('hello world', 'o'); // returns { index: 4, str: 'hell' }
     * substringUntilChar2('javascript', 'a');  // returns { index: 1, str: 'j' }
     * substringUntilChar2('javascript', 'z');  // returns { index: -1, str: 'javascript' } (because 'z' is not found)
     */
    export function substringUntilChar2(s: string, c: string, startPosition: number = 0): { index: number, str: string } {
        const index = s.indexOf(c, startPosition);
        if (index === -1) {
            return { index: -1, str: s };
        }
        const subStr = s.slice(0, index);
        return { index: index, str: subStr };
    }

    /**
     * @description Finds the first non-space character in a given string 
     * starting from a specified position.
     *
     * @param s The string to search through.
     * @param [startPosition=0] The position to start searching from. Defaults to `0`.
     * @returns An object containing:
     *   - `index`: The index of the first non-space character, or `-1` if not found.
     *   - `char`: The first non-space character found, or an empty string if none exists.
     *
     * @example
     * firstNonSpaceChar("   hello");    // Returns { index: 3, char: 'h' }
     * firstNonSpaceChar("   hello", 5); // Returns { index: 5, char: 'e' }
     * firstNonSpaceChar("     ");       // Returns { index: -1, char: '' }
     */
    export function firstNonSpaceChar(s: string, startPosition: number = 0): { index: number, char: string } {
        if (startPosition < 0 || startPosition >= s.length) {
            return { index: -1, char: '' };
        }
        for (let i = startPosition; i < s.length; i++) {
            const c = s[i]!;
            if (c !== ' ') {
                return { index: i, char: c! };
            }
        }
        return { index: -1, char: '' };
    }

    /**
     * @description Removes all the characters c from the string s.
     * @param s The string to be modified.
     * @param c The character to be removed.
     * @returns A new string without character c.
     */
    export function removeAllChar(s: string, c: string): string {
        const regex = new RegExp(c, 'g');
        return s.replace(regex, '');
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

    /**
     * @description Parses an HTML tag string and extracts information such as the 
     * tag type, tag name, and attributes.
     *
     * @param htmlTag The HTML tag string to be parsed (e.g., "<div class='container'>").
     * @returns An object containing the parsed tag's type, tag name, and attributes.
     *
     * @example
     * resolveHtmlTag('<div class="container">');
     * // Returns:
     * // {
     * //   type: 'open',
     * //   tagName: 'div',
     * //   attributes: { class: 'container' }
     * // }
     *
     * resolveHtmlTag('<img src="image.jpg" alt="An image" />');
     * // Returns:
     * // {
     * //   type: 'self-closing',
     * //   tagName: 'img',
     * //   attributes: { src: 'image.jpg', alt: 'An image' }
     * // }
     *
     * resolveHtmlTag('</div>');
     * // Returns:
     * // {
     * //   type: 'close',
     * //   tagName: 'div',
     * //   attributes: null
     * // }
     *
     * resolveHtmlTag('<invalid');
     * // Returns:
     * // {
     * //   type: 'unknown',
     * //   tagName: null,
     * //   attributes: null
     * // }
     */
    export function resolveHtmlTag(htmlTag: string): IHtmlTagResult {
        const tagPattern = /^<\s*\/?([a-zA-Z0-9]+)([^>]*)\s*\/?\s*>$/;
        const attributePattern = /([a-zA-Z0-9\-:]+)\s*=\s*"(.*?)"/g;

        const tagMatch = htmlTag.match(tagPattern);
        if (!tagMatch) {
            return {
                type: HtmlTagType.unknown,
                tagName: null,
                attributes: null
            };
        }

        const tagName = tagMatch[1] || null;
        const attributesString = tagMatch[2] || '';

        let tagType: HtmlTagType = HtmlTagType.open;
        if (htmlTag.startsWith('</')) {
            tagType = HtmlTagType.close;
        } else if (htmlTag.endsWith('/>')) {
            tagType = HtmlTagType.selfClosing;
        }

        const attributes: { [key: string]: string } = {};
        let anyAttributes = false;
        let attributeMatch: RegExpExecArray | null = null;

        do {
            attributeMatch = attributePattern.exec(attributesString);
            if (attributeMatch) {
                const attributeName = attributeMatch[1] || ''; // Attribute name (e.g., "src", "alt")
                const attributeValue = attributeMatch[2] || ''; // Attribute value (e.g., "image.jpg")
                attributes[attributeName] = attributeValue;
                anyAttributes = true;
            }
        } while (attributeMatch);

        return {
            type: tagType,
            tagName: tagName,
            attributes: anyAttributes ? attributes : null
        };
    }
}

/**
 * (U)niversal (U)nique (ID)entifier.
 */
export type UUID = string;

/**
 * The type of the HTML tag. 
 *   - 'open' indicates a start tag (e.g., <div>), 
 *   - 'close' indicates an end tag (e.g., </div>), 
 *   - 'self-closing' indicates a self-closing tag (e.g., <img />),
 *   - 'unknown' indicates that the tag could not be recognized.
 */
export const enum HtmlTagType {
    open = 'open', 
    close = 'close',
    selfClosing = 'self-closing',
    unknown = 'unknown',
}

/**
 * Represents the result of parsing an HTML tag.
 *
 * @property {} type See {@link HtmlTagType}.
 * @property {} tagName The name of the tag (e.g., 'div', 'img')
 * @property {} attributes An object representing the tag's attributes (key-value pairs), or null if no attributes are found.
 */
export interface IHtmlTagResult {
    readonly type: HtmlTagType;
    readonly tagName: string | null;
    readonly attributes: { [key: string]: string } | null;
}

/**
 * @description Sorts two strings in ascending order.
 * @param str1 The first string to compare.
 * @param str2 The second string to compare.
 * @returns A negative number if str1 should come before str2, a positive number 
 *          if str1 should come after str2, or 0 if they are equal.
 */
export function sortStringsAsc(str1: string, str2: string): number {
    return str1.localeCompare(str2);
}

/**
 * @description Sorts two strings in descending order.
 * @param str1 The first string to compare.
 * @param str2 The second string to compare.
 * @returns A positive number if str1 should come before str2, a negative number 
 *          if str1 should come after str2, or 0 if they are equal.
 */
export function sortStringsDesc(str1: string, str2: string): number {
    return str2.localeCompare(str1);
}

const _escapeMap = {
    '\\': '\\\\',
    '"': '\\"',
    '\'': '\\\'',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\b': '\\b',
    '\f': '\\f'
};
