import { Strings } from "src/base/common/utilities/string";
import { isNullable } from "src/base/common/utilities/type";

/**
 * To prevent potential circular dependency issues due to the wide use of `panic` 
 * throughout the program, this function has been relocated to a separate file 
 * that does not import any other files.
 */

/**
 * @description Panics the program by throwing an error with the provided message.
 *
 * @remark `panic` is for situations where the error is unrecoverable and the
 * program cannot proceed further. Use it very carefully.
 *
 * @param messageOrError - The error to be thrown.
 * @throws Will throw an error.
 * @returns This function never returns normally; always throws an error.
 */

export function panic(error: unknown): never {
    if (isNullable(error)) {
        // eslint-disable-next-line local/code-no-throw
        throw new Error('unknown panic error');
    }

    if (error instanceof Error) {
        // eslint-disable-next-line local/code-no-throw
        throw error;
    }

    // eslint-disable-next-line local/code-no-throw
    throw new Error(errorToMessage(error));
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
        const errors = error.filter(e => !!e);
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

const UNKNOWN_MESSAGE = 'An unknown error occured. Please consult the log for more details.';
function __stackToMessage(stack: any): string {
    if (Array.isArray(stack)) {
        return stack.join('\n');
    } else {
        return stack;
    }
}
