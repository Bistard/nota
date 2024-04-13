
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
    if (error === undefined || error === null) {
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
 * @description Asserts that the provided object is neither `undefined` nor 
 * `null`. 
 * @param obj The object to assert.
 * @param message Optional. The custom error message.
 * @panic 
 */
export function assert<T>(obj: T, message?: string): NonNullable<T>;
export function assert<T>(obj: any, message?: string): T {
    if (obj === undefined || obj === null) {
        panic(message ?? `assert error: ${obj}`);
    }
    return obj;
}

/**
 * @description Evaluates a condition and triggers a panic if the condition is 
 * false.
 * @param condition If the condition is false, the function will trigger a panic.
 * @param message Optional. The custom error message.
 * @panic
 */
export function check(condition: boolean, message?: string): void {
    if (!condition) {
        panic(message ?? `unknown check condition error`);
    }
}

/**
 * @description Asserts that an object is of a specific type. If the assertion 
 * fails, the function panic.
 * 
 * @param obj The object to assert.
 * @param assert A predicate function that checks if the object is of type T.
 * @param message Optional. The custom error message.
 * @panic 
 */
export function assertType<T>(obj: any, assert: (obj: any) => boolean, message?: string): T {
    if (assert(obj)) {
        return obj;
    }
    panic(message ?? `assert error: ${obj}`);
}

/**
 * @description Validates an object against a given predicate. Panic if the 
 * validation fails.
 * 
 * @param obj The object to assert.
 * @param assert A predicate function to test the object.
 * @param message Optional. The custom error message.
 * @panic 
 */
export function assertValue<T>(obj: T, assert: (obj: T) => boolean, message?: string): T {
    if (assert(obj)) {
        return obj;
    }
    panic(message ?? `assert error: ${obj}`);
}

/**
 * @description Validates that the first element of an array meets a specified 
 * condition. Assumes uniformity across the array.
 * 
 * @param array The array to check.
 * @param assert The predicate function for the assertion.
 * @param message Optional. The custom error message.
 * @returns The validated array.
 * 
 * @note An empty array passes the check. 
 * @panic If the first element fails the assertion.
 */
export function assertArray<T>(array: any[], assert: (firstElement: any) => boolean, message?: string): T[] {
    if (array.length === 0) {
        return array;
    }

    const firstElement = array[0]!;
    if (!assert(firstElement)) {
        panic(message ?? `assertArray error: ${array}`);
    }

    return array;
}

/**
 * @description Try to convert an error to a human readable message in string.
 * @param error The given error.
 * @param verbose If output the stack trace.
 * @returns A string formatted error message.
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
            return `${firstErrorMessage}, (${errors.length - 1} more errors in total)`;
        }

        return firstErrorMessage;
    }

    if (typeof error === 'string') {
        return error;
    }

    if (error.stack && verbose) {
        return `${error.message || UNKNOWN_MESSAGE} (stack trace - ${__stackToMessage(error.stack)})`;
    }

    if (error.message) {
        return error.message;
    }

    return `${UNKNOWN_MESSAGE}: ${JSON.stringify(error)}`;
}

const UNKNOWN_MESSAGE = 'An unknown error occurred. Please consult the log for more details.';
function __stackToMessage(stack: any): string {
    if (Array.isArray(stack)) {
        return stack.join('\n');
    } else {
        return stack;
    }
}
