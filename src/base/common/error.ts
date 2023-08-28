import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Arrays } from "src/base/common/util/array";
import { Strings } from "src/base/common/util/string";

type IErrorCallback = (error: any) => void;
type IErrorListener = IErrorCallback;

/**
 * @internal
 * @class An unexposed singleton that manages all the unexpected errors that are
 * caught by the {@link ErrorHandler.onUnexpectedError}.
 * 
 * {@link _ErrorRegistrant} cannot be accessed directly. All the functionalites 
 * can be found in a wrapper namespace {@link ErrorHandler}.
 * 
 * @default unexpectedErrorExternalCallback behaviour is calling `console.error(err)`
 * then simply throw it out.
 */
const _ErrorRegistrant = new class extends class ErrorRegistrant {
    
    // [field]

    private _unexpectedErrorExternalCallback: IErrorCallback;
    private readonly _listeners: IErrorListener[] = [];

    // [constructor]

    constructor() {
        this._unexpectedErrorExternalCallback = (error: any) => {
            console.error(error);
            throw error;
        };
    }

    // [public methods]

    public setUnexpectedErrorExternalCallback(callback: IErrorCallback): void {
        this._unexpectedErrorExternalCallback = callback;
    }
    
    public onUnexpectedError(error: any): void {
        this._unexpectedErrorExternalCallback(error);
        this.__fire(error);
    }

    public onUnexpectedExternalError(error: any): void {
        this._unexpectedErrorExternalCallback(error);
    }

    public registerListener(listener: IErrorListener): IDisposable {
        this._listeners.push(listener);
        return toDisposable(() => this.__removeListener(listener));
    }

    // [private helper methods]

    private __fire(error: any): void {
        for (const listener of this._listeners) {
            listener(error);
        }
    }

    private __removeListener(listener: IErrorListener): void {
        this._listeners.splice(this._listeners.indexOf(listener), 1);
    }

} {};

/**
 * @namespace ErrorHandler Supports a series of functions to handle unexpected
 * errors.
 * 
 * @note Since handler idealy should handling unexpected errors, thus those 
 * errors should be very important and even be fatal to some functionalities of 
 * the application. In that case, use these functions CAREFULLY.
 * 
 * @implements
 * The {@link ErrorHandler} is designed using the singleton pattern to ensure 
 * consistent and reliable operation of the system.
 * 
 * If we were to design an ErrorHandlerService as a microservice, we would 
 * introduce a dependency on our InstantiationService. This would potentially 
 * create a point of failure because any issues in the InstantiationService 
 * could impact the ErrorHandlerService. We aim to avoid such dependencies to 
 * ensure that our ErrorHandler remains fully functional regardless of the state 
 * of the InstantiationService.
 */
export namespace ErrorHandler {
    
    /**
     * @description Register a listener on unexpected errors (will not recieve 
     * external error fired by {@link ErrorHandler.onUnexpectedExternalError}).
     * @returns Returns a {@link IDisposable} for unregistration.
     */
    export function registerListener(listener: IErrorListener): IDisposable {
        return _ErrorRegistrant.registerListener(listener);
    }

    /**
     * @description Set a new unexpected error handler callback when any errors 
     * is caught (including external errors).
     */
    export function setUnexpectedErrorExternalCallback(callback: IErrorCallback): void {
        _ErrorRegistrant.setUnexpectedErrorExternalCallback(callback);
    }

    /**
     * @description Fires an error that will be notified to all the listeners 
     * and invoked by the
     * @param error The unexpected error to be fired.
     */
    export function onUnexpectedError(error: any): void {
        _ErrorRegistrant.onUnexpectedError(error);
    }

    /**
     * @description Different than {@link ErrorHandler.onUnexpectedError}, the
     * registered listeners will not be notified by this error since this is 
     * for external purpose.
     */
    export function onUnexpectedExternalError(error: any): void {
        _ErrorRegistrant.onUnexpectedExternalError(error);
    }
}

export const enum ErrorType {
    Cancelled = 'cancelled',
    Expected = 'expected',
}

export class CancellationError extends Error {
    public readonly type = ErrorType.Cancelled;
}

export class ExpectedError extends Error {
	public readonly type = ErrorType.Expected;
}

export function isCancellationError(error: any): error is CancellationError {
    return error.type === ErrorType.Cancelled;
}

export function isExpectedError(error: any): error is ExpectedError {
    return error.type === ErrorType.Expected;
}

const UNKNOWN_MESSAGE = 'An unknown error occured. Please consult the log for more details.';

/**
 * @description Try to convert an error to a human readable message in string.
 * @param error The given error.
 * @param verbose If output the stack trace.
 * @returns A string formated error message.
 * 
 * @note This function never throws.
 */
export function errorToMessage(error: any, verbose: boolean = false): string {
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
        return Strings.format('{0} (stack trace - {1})', [error.message || UNKNOWN_MESSAGE, stackToMessage(error.stack)]);
    }

    if (error.message) {
		return error.message;
	}

    return UNKNOWN_MESSAGE;
}

function stackToMessage(stack: any): string {
    if (Array.isArray(stack)) {
        return stack.join('\n');
    } else {
        return stack;
    }
}

/**
 * @description Executes the given function and returns its result. If an error 
 * occurs during execution, it calls the provided error handler and returns a 
 * default value.
 * @param defaultValue The default value to return in case of error.
 * @param fn The function to execute.
 * @param onError The error handler function to call when an error occurs.
 * @param onFinally The function to call after everything happens.
 * 
 * @note Does not support async callback.
 */
export function tryOrDefault<T>(defaultValue: T, fn: () => T, onError?: (err: any) => void, onFinally?: () => void): T {
    try {
        return fn();
    } catch (err) {
        onError?.(err);
        return defaultValue;
    } finally {
        onFinally?.();
    }
}

/**
 * @class A simple utility that make sure {@link InitProtector.init()} can only 
 * be invoked once.
 */
export class InitProtector {

    private _initialized: boolean;

    constructor() {
        this._initialized = false;
    }

    get isInit(): boolean {
        return this._initialized;
    }

    public init(errorMessage: string): void {
        if (!this._initialized) {
            this._initialized = true;
            return;
        }

        throw new Error(`${errorMessage}`);
    }
}

/**
 * @type {Result}
 * 
 * @description Represents a type that encapsulates a successful value of type 
 * `T` (using the {@link Ok} variant) or an error of type `E` (using the 
 * {@link Err} variant). 
 * 
 * @note This type is useful for representing operations that might fail, 
 * allowing for explicit error handling without relying on exceptions.
 * 
 * @template T The type of the value for successful outcomes.
 * @template E The type of the error for failed outcomes.
 * 
 * @example
 * // Handling successful outcomes:
 * function divide(a: number, b: number): Result<number, string> {
 *     if (b === 0) {
 *         return new Err("Division by zero");
 *     }
 *     return new Ok(a / b);
 * }
 * 
 * const result = divide(4, 2);
 * if (result.isOk()) {
 *     console.log("Division result:", result.value);
 * } else {
 *     console.error("Error:", result.error);
 * }
 * 
 * @example
 * // Handling error outcomes:
 * const anotherResult = divide(4, 0);
 * if (anotherResult.isOk()) {
 *     console.log("Division result:", anotherResult.value);
 * } else {
 *     console.error("Error:", anotherResult.error);
 * }
 * 
 * @see {@link Ok}
 * @see {@link Err}
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * An interface for {@link Ok} and {@link Err}.
 */
interface IResult<T, E> {
    
    /**
     * @description Represents the inner data value or error value of the 
     * {@link IResult} instance. 
     * - In case of a successful outcome, the data is of type `T`. 
     * - If there's an error, it's of type `E`.
     * 
     * Users should utilize the {@link isOk} and {@link isErr} methods to 
     * ascertain the type of data before accessing it.
     * - Force the user to handle the potential error.
     * 
     * @example
     * ```
     * // Successful outcome:
     * const success: IResult<number, string> = new Ok(42);
     * if (success.isOk()) {
     *     console.log(success.data); // 42
     * }
     * 
     * // Error outcome:
     * const error: IResult<number, string> = new Err("Some error");
     * if (error.isErr()) {
     *     console.error(error.data); // "Some error"
     * }
     * ```
     */
    readonly data: T | E;

    /**
     * @description Returns `true` if the {@link Result} is an {@link Ok} 
     * instance, and `false` otherwise.
     * 
     * @example
     * ```
     * const result: Result<number, string> = new Ok(42);
     * console.log(result.isOk()); // true
     * console.log(result.isErr()); // false
     * ```
     */
    isOk(): this is Ok<T>;
    
    /**
     * @description Returns `true` if the {@link Result} is an {@link Err} 
     * instance, and `false` otherwise.
     * 
     * @example
     * ```
     * const result: Result<number, string> = new Err("Some error");
     * console.log(result.isErr()); // true
     * console.log(result.isOk()); // false
     * ```
     */
    isErr(): this is Err<E>;

    /**
     * @description Returns the inner value if the {@link Result} is an {@link Ok}
     * instance. Throws an {@link Error} if the {@link Result} is an {@link Err} 
     * instance.
     * 
     * @throws Will throw an error if the {@link Result} is an {@link Err} instance.
     * 
     * @example
     * ```
     * const result: Result<number, string> = new Ok(42);
     * console.log(result.unwrap()); // 42
     * ```
     * @example
     * ```
     * const result: Result<number, string> = new Err('Some error');
     * console.log(result.unwrap()); // throws an error
     * console.log('reached');       // cannot be reached
     * ```
     */
    unwrap(): T | never;
    
    /**
     * @description Returns the inner value if the {@link Result} is an {@link Ok}
     * instance. If the {@link Result} is an {@link Err} instance, it will 
     * return the provided default value `data`.
     * 
     * @param data Default value to return if the {@link Result} is an {@link Err} instance.
     * 
     * @example
     * ```
     * const result: Result<number, string> = new Ok(42);
     * console.log(result.unwrapOr(0)); // 42
     * ```
     * @example
     * ```
     * const result: Result<number, string> = new Err("Some error");
     * console.log(result.unwrapOr(0)); // 0
     * ```
     */
    unwrapOr(data: T): T;

    /**
     * @description Matches the current {@link Result} and applies the provided 
     * functions based on whether it is an {@link Ok} or an {@link Err} instance. 
     * Returns a value of type `U` resulting from the applied function.
     * 
     * @param onOk Function to apply if the {@link Result} is an {@link Ok} instance.
     * @param onError Function to apply if the {@link Result} is an {@link Err} instance.
     * @returns Result of applying either `onOk` or `onError` function of type `U`.
     * 
     * @example
     * ```
     * const result: Result<number, string> = Ok(42);
     * const output = result.match(data => data * 2, error => 0);
     * console.log(output); // 84
     * ```
     * @example
     * ```
     * const result: Result<number, string> = Err('Some error');
     * const output = result.match(data => data * 2, error => 0);
     * console.log(output); // 0
     * ```
     */
    match<U>(onOk: (data: T) =>  U, onError: (error: E) =>  U): U;




    // REVIEW: discussion on whether to bring those API into TypeScript.
    // map<T2>(onOk: (data: T) => T2): Result<T2, E>;
    // mapErr<E2>(onErr: (err: E) => E2): Result<T, E2>;

    // then<T2, E2>(onOk: (data: T) => Result<T2, E2>): Result<T2, E | E2>;
    // else<E2>(onErr: (err: E) => Result<T, E2>): Result<T, E2>;
}

// TODO: class Ok

// TODO: class Err
