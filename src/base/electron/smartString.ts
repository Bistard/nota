import { Strings } from "src/base/common/utilities/string";
import { OS_CASE_SENSITIVE } from "src/base/common/platform";

/**
 * This namespace will smartly detecting should enable or disable ignoring
 * case when doing string comparison.
 */
export namespace SmartStrings {
    
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