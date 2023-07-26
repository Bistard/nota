import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Emitter, Event } from "src/base/common/event";
import { PriorityQueue } from "src/base/common/util/array";
import { isString } from "src/base/common/util/type";

const trueGlobalAsync = {
	setTimeout: globalThis.setTimeout.bind(globalThis),
	clearTimeout: globalThis.clearTimeout.bind(globalThis),
	setInterval: globalThis.setInterval.bind(globalThis),
	clearInterval: globalThis.clearInterval.bind(globalThis),
	setImmediate: globalThis.setImmediate?.bind(globalThis),
	clearImmediate: globalThis.clearImmediate?.bind(globalThis),
	requestAnimationFrame: globalThis.requestAnimationFrame?.bind(globalThis),
	cancelAnimationFrame: globalThis.cancelAnimationFrame?.bind(globalThis),
	Date: globalThis.Date,
};

/**
 * @description Enable or disable fake timers for function execution. This 
 * function replaces the global timing functions (setTimeout, setInterval, etc.)
 * with fake versions that simulate time elapsing. This is particularly useful 
 * in testing environments where you need precise control over the timing of 
 * functions.
 *
 * @param fn The function that will be executed with the fake timers.
 * @param {boolean} [enable=true] A boolean value indicating whether to enable fake timers. By default, this is true.
 * @returns A promise that resolves when the function has finished executing.
 *
 * @throws {Error} If a string is used as a handler in the setTimeout or 
 * setInterval function. Only function handlers are supported.
 *
 * @example
 * await FakeAsync.run(async () => {
 *    const startTime = Date.now();
 *    setTimeout(() => {
 *        console.log(`Elapsed time: ${Date.now() - startTime}`);
 *    }, 5000);
 * });
 * // the message "Elapsed time: 5000" will be logged immediately, even though 
 * // the timeout was set to 5000 milliseconds. This is because we faked the 
 * // asynchronous process.
 */
export namespace FakeAsync {

    export async function run(fn: () => Promise<any>, options?: IFakeSyncOptions): Promise<void> {
    
        const enable = options?.enable ?? true;
        if (!enable) {
            return fn();
        }
    
        /**
         * Replacing with customized `setTimeout`, `setInterval` and `Date`.
         */
        FakeGlobalAsync.enableFakeAsync();
    
        /**
         * Start listening to any incoming timed-microtasks from the customized 
         * functions. The {@link FakeAsyncExecutor} will execute all the microtasks
         * in the same order but will simulate time-elapsing.
         */
        const fakeExecutor = new FakeAsyncExecutor();
        FakeGlobalAsync.onTask(task => {
            const internalTask = fakeExecutor.schedule(task);
            task.setID(internalTask.id);
            
            const disposable = FakeGlobalAsync.onTaskDisposed(id => {
                if (id === internalTask.id) {
                    fakeExecutor.unschedule(internalTask);
                    disposable.dispose();
                }
            });
        });
    
        try {
            /**
             * There might be timed-microtasks fired during the execution.
             */
            await fn();
        } 
        catch (err) {
            onAnyError(err);
        }
        finally {
            
            /**
             * Make sure all the settled timed-microtasks are fully executed.
             */
            try {
                await fakeExecutor.cleanup();
            } 
            catch (err) {
                onAnyError(err);
            }
            finally {
                fakeExecutor.dispose();
                
                /**
                 * Turn off when all the timed-microtasks are fully executed.
                 */
                FakeGlobalAsync.disableFakeAsync();
            }
        }

        function onAnyError(err: any): void {
            if (options?.onError === true) {
                console.log(err);
            } 
            else if (options?.onError) {
                options.onError(err);
            }
        }
    }
}

export interface IFakeSyncOptions {
    readonly enable?: boolean;
    readonly onError?: boolean | ((err: any) => void);
}

interface ITask {
	readonly time: number;
    readonly source: { 
        toString(): string; 
        readonly stackTrace: string | undefined;
    };
	run(): void;

    // @internal (for potential dispose usage, it is a hacky way i know)
    setID(id: number): void;
}

namespace FakeGlobalAsync {

    // [fields]

    let _now: number = 0;
    export function now(): number { return _now; }
    export function updateNow(time: number): void { _now = time; }

    // [event]

    const _onTask = new Emitter<ITask>();
    export const onTask = _onTask.registerListener;

    const _onTaskDisposed = new Emitter<number>();
    export const onTaskDisposed = _onTaskDisposed.registerListener;

    // [public methods]

    /**
     * @description Replaces the global `setTimeout`, `clearTimeout`, 
     * `setInterval`, `clearInterval` functions and `Date` object with custom 
     * implementations.
     * 
     * This function is typically used in testing environments to control and 
     * manipulate time-related operations. This makes it possible to test 
     * asynchronous code in a synchronous manner by allowing control over when 
     * time advances.
     * 
     * The replaced functions are:
     * - `setTimeout` with {@link __customizedSetTimeout}
     * - `clearTimeout` with {@link __customizedClearTimeout}
     * - `setInterval` with {@link __customizedSetInterval}
     * - `clearInterval` with {@link __customizedClearInterval}
     * - `Date` object is replaced by invoking {@link __setCustomizedDate}.
     */
    export function enableFakeAsync(): void {
        
        // replace with customized timeout
        {
            globalThis.setTimeout = <any>__customizedSetTimeout;
            globalThis.clearTimeout = <any>__customizedClearTimeout;
        }

        // replace with customized interval
        {
            globalThis.setInterval = <any>__customizedSetInterval;
            globalThis.clearInterval = <any>__customizedClearInterval;
        }

        // replace with customized `Date`
        __setCustomizedDate();
    }

    /**
     * @description Undo the side effect of {@link enableFakeAsync}.
     */
    export function disableFakeAsync(): void {
        Object.assign(globalThis, trueGlobalAsync);
    }

    // [private helper methods]

    const __customizedSetTimeout = (handler: TimerHandler, timeout: number = 0) => {
        if (isString(handler)) {
            throw new Error('String handler args should not be used and are not supported');
        }
        
        let taskID: number;
        _onTask.fire({
            time: _now + timeout,
            run: () => handler(),
            source: {
                toString() { return 'setTimeout'; },
                stackTrace: new Error().stack,
            },
            setID: (id) => { taskID = id; }
        });

        return toDisposable(() => {
            _onTaskDisposed.fire(taskID);
        });
    };

    const __customizedClearTimeout = (timeoutId?: any) => {
        if (typeof timeoutId === 'object' && timeoutId && 'dispose' in timeoutId) {
            timeoutId.dispose(); // this is our customized dispose objet
        } else {
            trueGlobalAsync.clearTimeout(timeoutId);
        }
    };

    const __customizedSetInterval = (handler: TimerHandler, interval: number) => {
        if (isString(handler)) {
            throw new Error('String handler args should not be used and are not supported');
        }

        let iterCount = 0;
        const stackTrace = new Error().stack;
        
        let disposed = false;
        let taskID: number;

        const onSchedule = function () {
            const thisIterCount = iterCount++;
            
            _onTask.fire({
                time: _now + interval,
                run: () => {
                    if (!disposed) {
                        handler();
                        onSchedule();
                    }
                },
                source: {
                    toString() { return `setInterval (iteration ${thisIterCount})`; },
                    stackTrace,
                },
                setID: (id) => { taskID = id; }
            });
        };
        onSchedule();
    
        return toDisposable(() => {
            if (disposed) { 
                return; 
            }
            disposed = true;
            _onTaskDisposed.fire(taskID);
        });
    };

    const __customizedClearInterval = (timeoutId: any) => {
        if (typeof timeoutId === 'object' && timeoutId && 'dispose' in timeoutId) {
            timeoutId.dispose(); // this is our customized dispose objet
        } else {
            trueGlobalAsync.clearInterval(timeoutId);
        }
    };

    const __setCustomizedDate = function (): void {
        const OriginalDate = trueGlobalAsync.Date;
    
        function FakeDateConstructor(this: any, ...args: any): Date | string {
            
            /**
             * The Date constructor called as a function, ref Ecma-262 Edition 5.1, section 15.9.2. 
             * This remains so in the 10th edition of 2019 as well.
             */
            if (!(this instanceof FakeDateConstructor)) {
                return new OriginalDate(_now).toString();
            }
    
            /**
             * if Date is called as a constructor with 'new' keyword.
             */
            if (args.length === 0) {
                return new OriginalDate(_now);
            }

            return new (<any>OriginalDate)(...args);
        }
    
        for (const prop in OriginalDate) {
            if (Object.prototype.hasOwnProperty.call(OriginalDate, prop)) {
                FakeDateConstructor[prop] = OriginalDate[prop];
            }
        }
    
        FakeDateConstructor.now = function now() {
            return _now;
        };

        FakeDateConstructor.toString = function toString() {
            return OriginalDate.toString();
        };

        FakeDateConstructor.prototype = OriginalDate.prototype;
        FakeDateConstructor.parse = OriginalDate.parse;
        FakeDateConstructor.UTC = OriginalDate.UTC;
        FakeDateConstructor.prototype.toUTCString = OriginalDate.prototype.toUTCString;
    
        // replace the real one
        globalThis.Date = <DateConstructor>FakeDateConstructor;
    };
    
}

type ITaskWithID = ITask & { readonly id: number };

class FakeAsyncExecutor implements IDisposable {

    // [fields]

    private readonly _pqueue = new PriorityQueue<ITaskWithID>(this.__compareTasks);
    private _uuid = 0;
    private _executing = false;

    // [event]

    private readonly _onEmptyQueue = new Emitter<void>();

    // [constructor]

    constructor() {}

    // [public methods]

    public schedule(task: ITask): ITaskWithID {
        if (task.time < FakeGlobalAsync.now()) {
			throw new Error(`Scheduled time (${task.time}) must be equal to or greater than the current time (${FakeGlobalAsync.now()}).`);
		}

        const internalTask = {
            ...task,
            id: this._uuid++,
        };
        this._pqueue.enqueue(internalTask);

        this.__trySchedule();
        return internalTask;
    }

    public unschedule(task: ITaskWithID): void {
        this._pqueue.remove(task);
    }

    public cleanup(): Promise<void> {
        return this._executing ? Event.toPromise(this._onEmptyQueue.registerListener) : Promise.resolve();
    }

    public dispose(): void {
        this._onEmptyQueue.dispose();
        this._pqueue.dispose();
    }

    // [private helper methods]

    private __trySchedule(): void {
        if (this._executing) { 
            return; 
        } 
        this._executing = true;
        this.__schedule();
    }

    private __schedule(): void {
        Promise.resolve()
        .then(() => {
            trueGlobalAsync.setTimeout(() => this.__consume());
		});
    }

    private __consume(): void {
        if (this._pqueue.isEmpty()) {
            this._executing = false;
            this._onEmptyQueue.fire();
            return;
        } 

        this.__executeTask();
        this.__consume();
    }

    private __executeTask(): void {
        const task = this._pqueue.dequeue();
		if (!task) {
			return;
		}

        FakeGlobalAsync.updateNow(task.time);
        task.run();
    }

    private __compareTasks(a: ITaskWithID, b: ITaskWithID): number {
        if (a.time !== b.time) {
            return a.time - b.time;
        }

        if (a.id !== b.id) {
            return a.id - b.id;
        }
    
        return 0;
    }
}