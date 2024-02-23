import { Strings } from "src/base/common/utilities/string";
import { isNullable } from "src/base/common/utilities/type";

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
    throw new Error(Strings.errorToMessage(error));
}
