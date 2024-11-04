import type { Callable } from "src/base/common/utilities/type";
import { panic } from "src/base/common/utilities/panic";

/**
 * An namespace that contains a list of helper functions that relates to 
 * {@link Result}.
 */
export namespace Result {

    /**
     * @description Check if the given obj is one of {@link IResult}.
     * @param obj The given obj
     * @returns A boolean indicates if success.
     */
    export function is<T, E>(obj: any): obj is Result<T, E> {
        return obj instanceof Ok || obj instanceof Err;
    }

    /**
     * @description Wraps a callable function that might throw an error. If the
     * function successfully returns, the result will be wrapped inside an
     * {@link Ok} variant. If the function throws, the error will be wrapped
     * inside an {@link Err} variant after invoking the provided `onError`
     * callback.
     *
     * @template T Type of the expected return value from the `mightThrow` callable.
     * @template E Type that the `onError` function produces.
     *
     * @param mightThrow A callable that might throw an error.
     * @param onError Callback that gets invoked if `mightThrow` throws.
     *
     * @example
     * function mightFail(): number {
     *     throw new Error("Failed!");
     * }
     * const result = Result.fromThrowable(
     *     mightFail,
     *     error => console.error(`Caught error: ${error}`)
     * );
     * // Logs: Caught error: Error: Failed!
     */
    export function fromThrowable<T, E>(mightThrow: Callable<any[], T>, onError?: (error: unknown) => E): Result<T, E> {
        let res: T;

        try {
            res = mightThrow();
        }
        catch (error: unknown) {
            if (onError) {
                return err(onError(error));
            }
            return err(<E>error);
        }

        return ok(res);
    }

    /**
     * @description Wraps a callable function that might reject its promise. If
     * the function successfully resolves, the result will be wrapped inside an
     * {@link Ok} variant. If the function rejects, the error will be wrapped
     * inside an {@link Err} variant after invoking the provided `onError`
     * callback.
     *
     * @template T Type of the expected resolved value from the `mightThrow` callable.
     * @template E Type that the `onError` function produces.
     *
     * @param mightThrow A callable that might reject its promise.
     * @param onError Callback that gets invoked if `mightThrow` rejects.
     *
     * @example
     * async function mightReject(): Promise<number> {
     *     throw new Error("Promise rejected!");
     * }
     * const result = await Result.fromPromise(
     *     mightReject,
     *     error => console.error(`Caught rejection: ${error}`)
     * );
     * // Logs: Caught rejection: Error: Promise rejected!
     */
    export function fromPromise<T, E>(mightThrow: Callable<any[], Promise<T>>, onError?: (error: unknown) => E): AsyncResult<T, E> {
        const next = mightThrow()
            .then(data => ok<T, E>(data))
            .catch(error => err<T, E>(onError ? onError(error) : error));

        return new AsyncResult(next);
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
 *     console.log("Division result:", result.data);
 * } else {
 *     console.error("Error:", result.error);
 * }
 *
 * @example
 * // Handling error outcomes:
 * const anotherResult = divide(4, 0);
 * if (anotherResult.isOk()) {
 *     console.log("Division result:", anotherResult.data);
 * } else {
 *     console.error("Error:", anotherResult.error);
 * }
 *
 * @see {@link Ok}
 * @see {@link Err}
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

export type ResultLike<T, E> = (IResult<T, E> & { data: T; error: undefined; }) | (IResult<T, E> & { error: E; data: undefined; });

export type GetOkType<R> = R extends Result<infer T, infer E> ? T : never;
export type GetErrType<R> = R extends Result<infer T, infer E> ? E : never;

export type GetAsyncOkType<R> = R extends AsyncResult<infer T, infer E> ? T : never;
export type GetAsyncErrType<R> = R extends AsyncResult<infer T, infer E> ? E : never;

/**
 * An interface for {@link Ok} and {@link Err}.
 */
interface IResult<T, E> {

    /**
     * @description Represents the inner DATA value of the {@link IResult}
     * instance.
     * - In case of a successful outcome, the data is of type `T`.
     *
     * Users should utilize the {@link isOk} method to ascertain the type of
     * data before accessing it.
     * - Force the user to handle the potential error.
     *
     * @example
     * ```
     * // Successful outcome:
     * const success: IResult<number, string> = new Ok(42);
     * if (success.isOk()) {
     *     console.log(success.data); // 42
     *     console.log(success.error); // undefined
     * }
     * ```
     */
    readonly data?: T;

    /**
     * @description Represents the inner ERROR value of the {@link IResult}
     * instance.
     * - In case of an error, it's of type `E`.
     *
     * Users should utilize the {@link isOk} method to ascertain the type of
     * data before accessing it.
     * - Force the user to handle the potential error.
     *
     * @example
     * ```
     * // Error outcome:
     * const error: IResult<number, string> = new Err("Some error");
     * if (error.isErr()) {
     *     console.error(error.error); // "Some error"
     *     console.log(error.data); // undefined
     * }
     * ```
     */
    readonly error?: E;

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
    isOk(): this is Ok<T, E>;

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
    isErr(): this is Err<T, E>;

    /**
     * @description Returns the inner value if the {@link Result} is an {@link Ok}
     * instance. Panics if the {@link Result} is an {@link Err} instance.
     *
     * @throws Will panic if the {@link Result} is an {@link Err} instance.
     * @note Because this function may panic, its use is generally discouraged.
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
     * @description Returns the inner error if the {@link Result} is an {@link Err}
     * instance. Panics if the {@link Result} is an {@link Ok} instance.
     *
     * @throws Will panic if the {@link Result} is an {@link Ok} instance.
     * @note Because this function may panic, its use is generally discouraged.
     *
     * @example
     * ```
     * const result: Result<number, string> = new Ok(42);
     * console.log(result.unwrapErr()); // panics
     * ```
     * @example
     * ```
     * const result: Result<number, string> = new Err('Some error');
     * console.log(result.unwrapErr()); // 'Some error'
     * ```
     */
    unwrapErr(): E;

    /**
     * @description Ensures that the {@link IResult} instance is an {@link Ok}
     * type and returns its value. If the {@link IResult} is an {@link Err}
     * instance, it will {@link panic} with the provided error message.
     *
     * @note This method is useful for cases where the user expects the result
     * to be successful and wants to provide a custom error message for
     * potential failures.
     * @note Because this function may panic, its use is generally discouraged.
     *
     * @param errMessage The error message to use when throwing an exception.
     * @throws Will {@link panic} with the provided `errMessage` if the
     *         {@link IResult} is an {@link Err} instance.
     *
     * @example
     * ```
     * const result: IResult<number, string> = new Ok(42);
     * console.log(result.expect("Failed to get the expected value.")); // 42
     * ```
     *
     * @example
     * ```
     * const result: IResult<number, string> = new Err("Some error");
     * console.log(result.expect("Failed to get the expected value.")); // throws an error with the message "Failed to get the expected value."
     * ```
     */
    expect(errMessage: string): T | never;

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
    match<U>(onOk: (data: T) => U, onError: (error: E) => U): U;

    /**
     * @description Applies a function to the contained value (if {@link Ok})
     * and returns a new {@link Result} with the result of the function. If the
     * {@link IResult} is an {@link Err}, it returns the original {@link Err}
     * value without applying the function.
     *
     * This method can be used for chaining multiple computations that might
     * fail, while handling errors at each step.
     *
     * @param predicate The function to apply to the {@link Ok} value.
     * @returns A new {@link Result} instance containing the result of the
     * `predicate` function if the original {@link Result} is an {@link Ok}. If
     * the original {@link Result} is an
     * {@link Err}, it returns the original {@link Err} value.
     *
     * @example
     * ```
     * const result: IResult<number, string> = new Ok(42);
     * const newResult = result.map(x => x * 2);
     * console.log(newResult.unwrap()); // 84
     * ```
     *
     * @example
     * ```
     * const result: IResult<number, string> = new Err("Some error");
     * const newResult = result.map(x => x * 2);
     * console.log(newResult.isErr()); // true
     * ```
     */
    map<T1>(predicate: (data: T) => T1): Result<T1, E>;


    /**
     * @description Applies a function to the contained error value (if {@link Err})
     * and returns a new {@link Result} with the result of the function. If the
     * {@link IResult} is an {@link Ok}, it returns the original {@link Ok} value
     * without applying the function.
     *
     * @param predicate The function to apply to the {@link Err} value.
     * @returns A new {@link Result} instance containing the result of the
     * `predicate` function if the original {@link Result} is an {@link Err}. If
     * the original {@link Result} is an {@link Ok}, it returns the original
     * {@link Ok} value.
     *
     * @example
     * ```
     * const result: IResult<number, string> = new Err("Not found");
     * const updatedResult = result.mapErr(error => `Error: ${error}`);
     * console.log(updatedResult.error); // "Error: Not found"
     * ```
     */
    mapErr<E1>(predicate: (error: E) => E1): Result<T, E1>;

    /**
     * @description Applies a function to the contained value (if {@link Ok}) and
     * returns the result wrapped in a new {@link Result}. Useful for chaining
     * operations that may fail.
     *
     * @param onOk The function to apply to the {@link Ok} value, returning a new
     * {@link Result}.
     * @returns The result of applying `onOk` if the original {@link Result} is an
     * {@link Ok}. If the original {@link Result} is an {@link Err}, it returns the
     * original {@link Err}.
     *
     * ...
     * @example
     * ```
     * const parseNumber = (value: string): IResult<number, string> =>
     *     isNaN(Number(value)) ? new Err("Not a number") : new Ok(Number(value));
     *
     * const double = (n: number): IResult<number, string> => new Ok(n * 2);
     *
     * const result = parseNumber("42").andThen(double);
     * console.log(result.unwrap()); // 84
     *
     * const resultError = parseNumber("not a number").andThen(double);
     * console.log(resultError.isErr()); // true
     * ```
     */
    andThen<T1, E1>(onOk: (data: T) => Result<T1, E1>): Result<T1, E | E1>;

    /**
     * @description Applies a function to the contained error value (if {@link Err})
     * and returns the result wrapped in a new {@link Result}. If the {@link IResult}
     * is an {@link Ok}, it returns the original {@link Ok} value.
     *
     * @param onError The function to apply to the {@link Err} value, returning a new
     * {@link Result}.
     * @returns The result of applying `onError` if the original {@link Result} is an
     * {@link Err}. If the original {@link Result} is an {@link Ok}, it returns the
     * original {@link Ok} value.
     *
     * ...
     * @example
     * ```
     * const result: IResult<number, string> = new Err("Failed");
     * const recoveredResult = result.orElse(error => new Ok(0));
     * console.log(recoveredResult.unwrap()); // 0
     *
     * const okResult: IResult<number, string> = new Ok(42);
     * const stillOkResult = okResult.orElse(error => new Ok(0));
     * console.log(stillOkResult.unwrap()); // 42
     * ```
     */
    orElse<E1>(onError: (error: E) => Result<T, E1>): Result<T, E | E1>;

    /**
     * @description Transforms the {@link IResult} into an {@link AsyncResult},
     * allowing for integration with asynchronous operations. This method wraps
     * the {@link Result} in a Promise, making it compatible with async-await
     * patterns or Promise-based workflows.
     *
     * This method is particularly useful for scenarios where a synchronous
     * {@link Result} needs to be incorporated into asynchronous function chains,
     * or when interacting with APIs that return Promises.
     */
    toAsync(): AsyncResult<T, E>;
}

/**
 * @description Creates and returns an instance of the `Ok` class with the
 * provided value. This function serves as a shorthand utility to create `Ok`
 * instances without using the `new` keyword, making it more concise and
 * readable.
 *
 * @example
 * ```
 * const successfulResult = ok(42);
 * ```
 */
export function ok<T extends void, E>(): Ok<T, E>;
export function ok<T, E>(data: T): Ok<T, E>;
export function ok<T, E>(data?: T): Ok<T, E> {
    return new Ok(data!);
}

/**
 * @description Creates and returns an instance of the `Err` class with the
 * provided error value. This function serves as a shorthand utility to create
 * `Err` instances without using the `new` keyword, making it more concise and
 * readable.
 *
 * @example
 * ```
 * const errorResult = err("An error occurred");
 * ```
 */
export function err<T, E extends void>(): Err<T, E>;
export function err<T, E>(error: E): Err<T, E>;
export function err<T, E>(error?: E): Err<T, E> {
    return new Err(error!);
}

/**
 * @class Represents a successful outcome with a value of type `T`.
 *
 * Instances of `Ok` contain a single `data` property representing the
 * successful value, and methods to manipulate or query this result.
 *
 * @template T The type of the successful value.
 * @template E The type of the error value.
 *
 * @example
 * ```
 * const success = new Ok(42);
 * console.log(success.isOk());     // true
 * console.log(success.isErr());    // false
 * console.log(success.unwrap());   // 42
 * ```
 */
export class Ok<T, E> implements IResult<T, E> {

    constructor(public readonly data: T) { }

    public isOk(): this is Ok<T, E> {
        return true;
    }

    public isErr(): this is Err<T, E> {
        return false;
    }

    public unwrap(): T {
        return this.data;
    }

    public unwrapOr(_data: T): T {
        return this.data;
    }

    public unwrapErr(): E {
        return panic(`Tried to unwrap an Ok`);
    }

    public expect(_errMessage: string): T {
        return this.data;
    }

    public match<U>(onOk: (data: T) => U, _onError: (error: E) => U): U {
        return onOk(this.data);
    }

    public map<U>(predicate: (data: T) => U): Result<U, E> {
        return ok(predicate(this.data));
    }

    public mapErr<E1>(_predicate: (error: E) => E1): Result<T, E1> {
        return ok(this.data);
    }

    public andThen<T1, E1>(onOk: (data: T) => Result<T1, E1>): Result<T1, E | E1> {
        return onOk(this.data);
    }

    public orElse<E1>(_onError: (error: E) => Result<T, E1>): Result<T, E | E1> {
        return this;
    }

    public toAsync(): AsyncResult<T, E> {
        return new AsyncResult(Promise.resolve(ok(this.data)));
    }
}

/**
 * @class Represents an error outcome with a value of type `E`.
 *
 * Instances of `Err` contain a single `data` property representing the
 * error value, and methods to manipulate or query this result.
 *
 * Attempting to `unwrap` an `Err` will trigger a panic (a thrown error in
 * this context).
 *
 * @template T The type of the successful value.
 * @template E The type of the error value.
 *
 * @example
 * ```
 * const error = new Err("Something went wrong");
 * console.log(error.isOk());     // false
 * console.log(error.isErr());    // true
 * console.error(error.unwrap()); // Will throw an error with the message "Something went wrong"
 * ```
 */
export class Err<T, E> implements IResult<T, E> {

    constructor(public readonly error: E) { }

    public isOk(): this is Ok<T, E> {
        return false;
    }

    public isErr(): this is Err<T, E> {
        return true;
    }

    public unwrap(): never {
        panic(this.error);
    }

    public unwrapOr(error: T): T {
        return error;
    }

    public unwrapErr(): E {
        return this.error;
    }

    public expect(errMessage: string): never {
        panic(errMessage);
    }

    public match<U>(_onOk: (data: T) => U, onError: (error: E) => U): U {
        return onError(this.error);
    }

    public map<U>(_predicate: (data: T) => U): Result<U, E> {
        return err(this.error);
    }

    public mapErr<E1>(predicate: (error: E) => E1): Result<T, E1> {
        return err(predicate(this.error));
    }

    public andThen<T1, E1>(_onOk: (data: T) => Result<T1, E1>): Result<T1, E | E1> {
        return err(this.error);
    }

    public orElse<E1>(onError: (error: E) => Result<T, E1>): Result<T, E | E1> {
        return onError(this.error);
    }

    public toAsync(): AsyncResult<T, E> {
        return new AsyncResult(Promise.resolve(err(this.error)));
    }
}

/**
 * @class Represents an asynchronous operation that yields a result upon
 * completion. The `AsyncResult` class encapsulates a `Promise` which resolves
 * to a `Result<T, E>`, providing a functional way to handle asynchronous
 * operations and their success or failure outcomes.
 *
 * The `AsyncResult` class is particularly useful in scenarios where you need to
 * perform a series of asynchronous operations, each dependent on the success of
 * the previous one, and handle errors at any point in the chain. It allows for
 * writing clean, readable asynchronous code without deeply nested callbacks or
 * complex error-handling structures.
 */
export class AsyncResult<T, E> {

    // [field]
    private readonly _promise: Promise<Result<T, E>>;

    // [constructor]
    constructor(promise: Promise<Result<T, E>>) {
        this._promise = promise;
    }

    // [static methods]
    public static ok<T extends void, E>(): AsyncResult<T, E>;
    public static ok<T, E>(data: T): AsyncResult<T, E>;
    public static ok<T, E>(data?: T): AsyncResult<T, E> {
        return new AsyncResult<T, E>(Promise.resolve(ok(data!)));
    }

    public static err<T, E extends void>(): AsyncResult<T, E>;
    public static err<T, E>(error: E): AsyncResult<T, E>;
    public static err<T, E>(error?: E): AsyncResult<T, E> {
        return new AsyncResult<T, E>(Promise.resolve(err(error!)));
    }

    public static is<T, E>(obj: any): obj is AsyncResult<T, E> {
        return obj instanceof AsyncResult;
    }

    // [PromiseLike]~
    public then<A, B>(
        success: (res: Result<T, E>) => A | Promise<A>,
        failure: (reason: unknown) => B | Promise<B>
    ): Promise<A | B> {
        return this._promise.then(success, failure);
    }

    // [public methods]
    public isOk(): Promise<boolean> {
        return this._promise.then(res => res.isOk());
    }

    public isErr(): Promise<boolean> {
        return this._promise.then(res => res.isOk());
    }

    public unwrap(): Promise<T | never> {
        return this._promise.then(res => res.unwrap());
    }

    public unwrapOr(defaultValue: T): Promise<T> {
        return this._promise.then(res => res.unwrapOr(defaultValue));
    }

    public unwrapErr(): Promise<E> {
        return this._promise.then(res => res.unwrapErr());
    }

    public expect(errorMessage: string): Promise<T | never> {
        return this._promise.then(res => res.expect(errorMessage));
    }

    public match<U>(onOk: (data: T) => U, onError: (error: E) => U): Promise<U> {
        return this._promise.then((res) => res.match(onOk, onError));
    }

    public map<U>(predicate: (data: T) => U | Promise<U>): AsyncResult<U, E> {
        const next = this._promise.then(async (res) => {
            if (res.isErr()) {
                return err<U, E>(res.error);
            }
            const oldData = res.data;
            const newData = await predicate(oldData);
            return ok<U, E>(newData);
        });

        return new AsyncResult(next);
    }

    public mapErr<E1>(predicate: (error: E) => E1 | Promise<E1>): AsyncResult<T, E1> {
        const next = this._promise.then(async (res) => {
            if (res.isOk()) {
                return ok<T, E1>(res.data);
            }
            const oldError = res.error;
            const newError = await predicate(oldError);
            return err<T, E1>(newError);
        });

        return new AsyncResult(next);
    }

    public andThen<T1, E1>(onOk: (data: T) => Result<T1, E1> | AsyncResult<T1, E1> | Promise<T1>): AsyncResult<T1, E | E1> {
        const next = this._promise.then(async (res) => {
            if (res.isErr()) {
                return err<T1, E>(res.error);
            }

            try {
                const newRes = await onOk(res.data);
                if (Result.is(newRes)) {
                    return newRes;
                } else {
                    return ok<T1, E1>(newRes);
                }
            } catch (promiseError) {
                return err<T1, any>(<any>promiseError);
            }
        });

        return new AsyncResult<T1, E | E1>(next);
    }

    public orElse<E1>(onError: (error: E) => Result<T, E1> | AsyncResult<T, E1> | Promise<T>): AsyncResult<T, E1> {
        const next = this._promise.then(async (res) => {
            if (res.isOk()) {
                return ok<T, E1>(res.data);
            }

            try {
                const newRes = await onError(res.error);
                if (Result.is(newRes)) {
                    return newRes;
                } else {
                    return ok<T, E1>(newRes);
                }
            } catch (promiseError) {
                return err<T, E1>(<E1>promiseError);
            }
        });

        return new AsyncResult(next);
    }

    public async toPromise(): Promise<T> {
        const result = await this._promise;
        return result.unwrap();
    }
}
