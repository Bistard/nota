import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Result, err, ok } from "src/base/common/result";
import { mixin } from "src/base/common/utilities/object";
import { errorToMessage, IpcErrorTag, panic } from "src/base/common/utilities/panic";
import { isObject, isPromise, isString } from "src/base/common/utilities/type";

type IErrorCallback = (error: any) => void;
type IErrorListener = IErrorCallback;

/**
 * @internal
 * @class An unexposed singleton that manages all the unexpected errors that are
 * caught by the {@link ErrorHandler.onUnexpectedError}.
 * 
 * {@link _ErrorRegistrant} cannot be accessed directly. All the functionalities 
 * can be found in a wrapper namespace {@link ErrorHandler}.
 * 
 * @default unexpectedErrorExternalCallback behavior is calling `console.error(err)`
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
            panic(`on unexpected external error: ${errorToMessage(error)}`);
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
 * @note Since handler ideally should handling unexpected errors, thus those 
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
     * @description Register a listener on unexpected errors (will not receive 
     * external error fired by {@link ErrorHandler.onUnexpectedExternalError}).
     * @returns Returns a {@link IDisposable} for deregistration.
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

/**
 * @description Since `Error` instance has some weird behavior and cannot be 
 * transferred through IPC properly. Using this function to convert an `Error` to 
 * a plain object that simulates the original `Error`.
 * 
 * @param error The original Error
 * @returns A plain object that simulates the original `Error`. The object will
 *          be tagged by {@link IpcErrorTag}.
 */
export function toIPCTransferableError(error?: Error): Error | undefined {
    if (!error) {
        return undefined;
    }

    // construct a plain object to represent `Error`
    const newErr = {
        [IpcErrorTag]: null,
        message: error.message ?? 'unknown error message',
        name: error.name ?? 'unknown error',
        stack: error.stack ?? undefined,
    };

    // making sure any extra attributes from the `error` is also included.
    mixin(newErr, error, { overwrite: false });

    return <Error>newErr;
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
 * @description Safely executes a function that may either be synchronous or 
 * asynchronous. 
 * @param fn The function to be executed. It can be a synchronous or 
 *           asynchronous function.
 * @param onThen Optional. The follow-up function to call after fn invokes.
 * @param onError The error handler function to call when an error occurs.
 * @param onFinally Optional. The function to call after everything happens.
 */
export function trySafe<T>(
    fn: () => T | Promise<T>, 
    opts: {
        onThen?: (value: T) => void,
        onError: (err: any) => T, 
        onFinally?: () => void
    }
): T | Promise<T> {
    const { onThen, onError, onFinally } = opts;

    try {
        const result = fn();

        // 'fn' is sync, just return
        if (isPromise(result) === false) {
            try {
                onThen?.(result);
            } finally {
                onFinally?.();
            }
            return result;
        }

        // 'fn' is async, return a Promise
        return result
            .then(ret => {
                onThen?.(ret);
                return ret;
            })
            .catch(err => onError(err))
            .finally(() => onFinally?.());
    } 
    // sync error happens
    catch (err) {
        try {
            return onError(err);
        } finally {
            onFinally?.();
        }
    } 
}

/**
 * @description Simpler version of {@link trySafe}.
 */
export function safe(fn: () => void | Promise<void>): void | Promise<void> {
    return trySafe(
        () => fn(),
        { onError: err => ErrorHandler.onUnexpectedError(err) }
    );
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

    public init(errorMessage: string): Result<void, Error> {
        if (!this._initialized) {
            this._initialized = true;
            return ok(undefined);
        }
        return err(new Error(`${errorMessage}`));
    }
}

export class Stacktrace {

    // [fields]

    private _stack: string[];

    // [constructor]

    constructor() {
        const prevLimit = Error.stackTraceLimit;
        Error.stackTraceLimit = Infinity;
        this._stack = (new Error()).stack?.split('\n').slice(1) ?? [];
        Error.stackTraceLimit = prevLimit;
    }

    // [getter]

    public getRawTrace(): string {
        return this._stack.join('\n');
    }

    public getTrace(): string[] {
        return this._stack;
    }

    // [public methods]

    public map(callbackfn: (value: string, index: number, array: string[]) => string, thisArg?: any): this {
        this._stack = this._stack.map(callbackfn);
        return this;
    }
}

/**
 * A standardized Error for LLM operations, encapsulating both
 * provider-specific errors (e.g. OpenAI) and internal errors.
 */
export class AIError extends Error {
    
    // [fields]

    /** Indicates the name of the LLM model caused the error */
    public readonly modelName: string | null;

    /** Error category for quick classification */
    public readonly errorCategory: 
        | 'API'
        | 'Network'
        | 'Auth'
        | 'Client'
        | 'Internal'
        | 'Unknown';

    /** HTTP status code (if applicable) */
    public readonly status?: number;

    /** HTTP headers from the response (if applicable) */
    public readonly headers?: Record<string, string>;

    /** Original error object (if available) */
    public readonly internal?: unknown;

    /** Provider-specific error code (e.g. 'invalid_api_key') */
    public readonly code?: string;

    /** Request ID from response headers (if available) */
    public readonly requestId?: string;

    // [constructor]

    constructor(modelName: string | null, rawError: unknown) {
        const { message, metadata } = AIError.__parseRawError(rawError);
        super(message);

        this.modelName = modelName;
        this.errorCategory = metadata.category;
        this.internal = metadata.internal;
        
        // API Error metadata
        this.status = metadata.status;
        this.headers = metadata.headers;
        this.code = metadata.code;
        this.requestId = metadata.headers?.['x-request-id'];
    }

    // [static methods]

    private static __parseRawError(raw: unknown): {
        message: string;
        metadata: __ErrorParseMetadata;
    } {
        
        // raw string, simple return
        if (isString(raw)) {
            return { 
                message: raw, 
                metadata: { category: 'Unknown' } 
            };
        }

        // non object, no can do here.
        if (!isObject(raw)) {
            return {
                message: 'Unknown non-object error',
                metadata: { 
                    category: 'Unknown', 
                    internal: raw 
                }
            };
        }

        // default metadata
        const metadata: __ErrorParseMetadata = {
            category: 'Unknown',
            status: undefined,
            headers: undefined,
            code: undefined,
            internal: raw
        };

        // obtain metadata
        const status = Number(raw['status']) ?? undefined;
        const headers = raw['headers'];
        const code = this.__safeGetCode(raw);
        const message = this.__getHumanMessage(raw, status, code);

        // clean up
        metadata.status = status;
        metadata.headers = headers;
        metadata.code = code;
        metadata.category = this.__determineCategory(raw, status, code);

        return { message, metadata };
    }

    private static __determineCategory(
        raw: object,
        status?: number,
        code?: string
    ): AIError['errorCategory'] {
        
        // Network errors (timeout, connection issues)
        if (raw instanceof Error && [
            'ETIMEDOUT', 
            'ECONNREFUSED', 
            'ENOTFOUND'
        ].some(code => code === raw['code'])
        ) {
            return 'Network';
        }

        // API errors classification
        if (status) {
            if (status === 401) return 'Auth';
            if (status === 429) return 'API';
            if (status >= 400 && status < 500) return 'Client';
            if (status >= 500) return 'Internal';
        }

        // OpenAI-style error codes
        if (code) {
            if (code.includes('invalid_api')) return 'Auth';
            if (code.includes('rate_limit')) return 'API';
        }

        return 'Unknown';
    }

    private static __getHumanMessage(
        raw: object,
        status?: number,
        code?: string
    ): string {
        const baseMessage = raw['message'] || 'Unknown error';
        const parts: string[] = [];

        if (status) parts.push(`Status: ${status}`);
        if (code) parts.push(`Code: ${code}`);

        return parts.length > 0 
            ? `${baseMessage} (${parts.join(', ')})` 
            : baseMessage;
    }

    private static __safeGetCode(raw: object): string | undefined {
        const codeSources = [
            (<any>raw).code,
            (<any>raw).error?.code,
            (<any>raw).body?.error?.code
        ];
        return codeSources.find(v => isString(v));
    }
}

type __ErrorParseMetadata = {
    category: AIError['errorCategory'];
    status?: number;
    headers?: Record<string, string>;
    code?: string;
    internal?: unknown;
};