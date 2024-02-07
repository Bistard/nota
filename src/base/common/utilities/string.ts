import { Arrays } from "src/base/common/utilities/array";
import { Iterable } from "src/base/common/utilities/iterable";
import { isObject } from "src/base/common/utilities/type";

/**
 * @namespace Strings A collection of functions that relates to string types.
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
                } catch (e) { }
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
     * @description Try to convert an error to a human readable message in string.
     * @param error The given error.
     * @param verbose If output the stack trace.
     * @returns A string formated error message.
     *
     * @note This function never throws.
     */
    export function errorToMessage(error: any, verbose: boolean = true): string {
        if (!error) {
            return UNKNOWN_MESSAGE;
        }

        if (Array.isArray(error)) {
            const errors = Arrays.coalesce(error);
            const firstErrorMessage = errorToMessage(errors[0], verbose);

            if (errors.length > 1) {
                return Strings.format('{0}, ({1} more errors in total)', [firstErrorMessage, errors.length - 1]);
            }

            return firstErrorMessage;
        }

        if (typeof error === 'string') {
            return error;
        }

        if (error.stack && verbose) {
            return Strings.format('{0} (stack trace - {1})', [error.message || UNKNOWN_MESSAGE, __stackToMessage(error.stack)]);
        }

        if (error.message) {
            return error.message;
        }

        return `${UNKNOWN_MESSAGE}: ${JSON.stringify(error)}`;
    }
}

/**
 * (U)niversal (U)nique (ID)entifier.
 */
export type UUID = string;

const UNKNOWN_MESSAGE = 'An unknown error occured. Please consult the log for more details.';
function __stackToMessage(stack: any): string {
    if (Array.isArray(stack)) {
        return stack.join('\n');
    } else {
        return stack;
    }
}
