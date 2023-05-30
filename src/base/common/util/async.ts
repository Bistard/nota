import { Disposable, IDisposable } from "src/base/common/dispose";
import { CancellationError } from "src/base/common/error";
import { Emitter, Register } from "src/base/common/event";
import { noop } from "src/base/common/performance";
import { CancellationToken, ICancellable } from "src/base/common/util/cacellation";
import { isNullable, isNumber } from "src/base/common/util/type";

/**
 * {@link CancellablePromise}
 * {@link Blocker}
 * {@link EventBlocker}
 * {@link PromiseTimeout}
 * {@link AsyncRunner}
 * {@link AsyncQueue}
 * {@link Scheduler}
 * {@link UnbufferedScheduler}
 * {@link Throttler}
 * {@link Debouncer}
 * {@link ThrottleDebouncer}
 */

export interface ITask<T> {
	(...args: any[]): T; // any functions that returns `T`
}

export type IAsyncTask<T> = ITask<Promise<T>>;

/**
 * @description Delays for given milliseconds. It will immediately create a 
 * async task that runs in the javascript task queue by using setTimeout.
 * @param ms Milliseconds.
 * @param callback Callback function after the waiting ends.
 */
export async function delayFor(ms: number, callback?: ITask<void>): Promise<void> {
    return new Promise(
		(resolve, reject) => setTimeout(() => {
			if (callback) {
				try {
					callback();
				} catch (error) {
					reject();
				}
			}
			resolve();
		}, ms)
	);
}

/**
 * @class A class that simulates the native behaviours of {@link Promise} but 
 * with an addtional {@link CancellationToken}. You may decide the control flow
 * by the token. If the token is cancelled, the corresponding cancellable 
 * promise will reject with an {@link CancellationError}.
 */
export class CancellablePromise<T> implements Promise<T>, ICancellable {

	// [field]

	private readonly _token: CancellationToken;
	private readonly _promise: Promise<T>;

	// [constructor]

	constructor(callback: (token: CancellationToken) => Promise<T>, token?: CancellationToken) {
	
		this._token = token ?? new CancellationToken();
		const thenable = callback(this._token);

		this._promise = new Promise((resolve, reject) => {
			
			const tokenListener = this._token.onDidCancel(() => {
				tokenListener.dispose();
				this._token.dispose();
				reject(new CancellationError());
			});
			
			const onResolve = (value: T) => {
				tokenListener.dispose();
				this._token.dispose();
				resolve(value);
			};

			const onReject = (error: any) => {
				tokenListener.dispose();
				this._token.dispose();
				reject(error);
			};

			// catch the callback if the token is already cancelled
			thenable
			.then((value) => {
				if (this._token.isCancelled()) {
					onReject(new CancellationError());
				} else {
					onResolve(value);
				}
			})
			.catch((err) => onReject(err));
		});
	}

	// [public methods]

	public then<TResult1 = T, TResult2 = never>(resolve? :(value: T) => TResult1 | PromiseLike<TResult1>, reject?: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2> {
		return this._promise.then(resolve, reject);
	}

	public catch<TResult = never>(reject?: (reason: any) => TResult | PromiseLike<TResult>): Promise<T | TResult> {
		return this._promise.catch(reject);
	}

	public finally(onfinally?: () => void): Promise<T> {
		return this._promise.finally(onfinally);
	}

	public cancel(): void {
		this._token.cancel();
	}

	get [Symbol.toStringTag]() {
		return 'Promise';
	}
}

/**
 * @description Returns a {@link Promise} that resolves on the given ms, it can 
 * be cancelled by the given token. Returns a {@link CancellablePromise} if
 * no token is given which the client may cancel manually.
 * @param ms timeout in milliseconds.
 * @param token The cancellation token binds to the promise if provided.
 */
export function cancellableTimeout(ms: number): CancellablePromise<void>;
export function cancellableTimeout(ms: number, token: CancellationToken): Promise<void>;
export function cancellableTimeout(ms: number, token?: CancellationToken): CancellablePromise<void> | Promise<void> {
	if (!token) {
		return new CancellablePromise((token) => cancellableTimeout(ms, token));
	}
	
	return new Promise((resolve, reject) => {

		const handle = setTimeout(() => {
			tokenListener.dispose();
			resolve();
		}, ms);

		const tokenListener = token.onDidCancel(() => {
			clearTimeout(handle);
			tokenListener.dispose();
			reject(new CancellationError());
		});
	});
}

/**
 * @description Helper functions for retrying a given task for given retry rounds.
 * @param task Task function.
 * @param delay Delay ms between each retry.
 * @param round Retry rounds.
 * @throws An exception will be thrown after all the retry rounds are finished 
 * if one of the round throws an error (if multiple fails, the last error will 
 * be thrown).
 */
export async function retry<T>(task: IAsyncTask<T>, delay: number, round: number = 1): Promise<T> {
	let lastError: Error | unknown;

	for (let i = 0; i < round; i++) {
        try {
            // try to finish the task.
			return await task();
		}
        catch (error) {
            // if not, we delay for a while and will retry the task.
			lastError = error;
			await delayFor(delay);
		}
	}

	throw lastError;
}

/**
 * @class Acts like a promise by calling {@link Blocker.waiting()} to wait a 
 * data with type T. The only difference is client may signals the blocker to 
 * resolve or reject manually.
 */
export class Blocker<T> {

	private _resolve!: (arg: T) => void;
	private _reject!: (reason?: any) => void;
	private _promise: Promise<T>;

	constructor() {
		this._promise = new Promise<T>((resolve, reject) => {
			this._resolve = resolve;
			this._reject = reject;
		});
	}

	public async waiting(): Promise<T> {
		return this._promise;
	}

	public resolve(data: T): void {
		this._resolve(data);
	}

	public reject(reason?: any): void {
		this._reject(reason);
	}
}

export type IAsyncPromiseTask<T> = {
	task: ITask<Promise<T>>;
	resolve: (arg: T) => void;
	reject: (reason?: any) => void;
};

/**
 * @class A {@link EventBlocker} registers the provided event register for one 
 * time only and convert it into a promise so that it can be listened in an 
 * asynchronous way instead of direct listening to the event.
 * 
 * You may pass a timeout to reject the promise if the event never fired after 
 * the timeout.
 */
export class EventBlocker<T> {

	private readonly _blocker = new Blocker<T>();
	private _listener: IDisposable;
	private _fired = false;
	private _timeout?: NodeJS.Timeout;
	
	constructor(register: Register<T>, timeout?: number) {
		// one time only listener
		this._listener = register((event) => {
			this._fired = true;
			this._listener.dispose();

			if (this._timeout) {
				clearTimeout(this._timeout);
				this._timeout = undefined;
			}

			this._blocker.resolve(event);
		});

		if (isNumber(timeout)) {
			this._timeout = setTimeout(() => {
				if (!this._fired) {
					this._blocker.reject(new Error());
				}
			}, timeout);
		}
	}

	public async waiting(): Promise<T> {
		return this._blocker.waiting();
	}

	public dispose(): void {
		if (!this._fired) {
			this._listener.dispose();
		}
	}
}

/**
 * @class A `PromiseTimeout` creates a new promise and resolves a boolean to 
 * determine whether the given promise is resolved before the given timeout.
 * 
 * @note An alternative choice is `Promise.race`.
 * @note The new promise will reject if the given promise is rejected before the
 * timeout.
 */
export class PromiseTimeout {
	
	private _blocker = new Blocker<boolean>();
	private _timeout = false;

	constructor(promise: Promise<any>, timeout: number) {
		const token = setTimeout(() => {
			this._timeout = true;
			this._blocker.resolve(false);
		}, timeout);
		
		promise
		.then(() => {
			if (!this._timeout) {
				clearTimeout(token);
				this._blocker.resolve(true);
			}
		})
		.catch(err => {
			if (!this._timeout) {
				clearTimeout(token);
				this._blocker.reject(err);
			}
		});
	}

	public waiting(): Promise<boolean> {
		return this._blocker.waiting();
	}
}

/**
 * An interface for {@link AsyncRunner}.
 */
export interface IAsyncRunner<T> extends Disposable {
	
	/**
	 * The total number of promises that are either being waiting or executing.
	 */
	readonly size: number;

	/**
	 * Fires once the all the executing promises are done and no waiting promises.
	 */
	readonly onDidFlush: Register<void>;

	/**
	 * @description Queueing a function that returns a promise into the executor.
	 * @param task The task that returns a promise.
	 * @returns Returns a promise that will resolve the promise of the return 
	 * value of the {@link ITask}.
	 */
	queue(task: ITask<Promise<T>>): Promise<T>;

	/**
	 * @description Pauses the executor (the running promises will not be paused).
	 */
	pause(): void;

	/**
	 * @description Resumes the flow of executing.
	 */
	resume(): void;

	/**
	 * @description Returns a promise that will resolve once the next queued 
	 * task is completed.
	 */
	waitNext(): Promise<void>;
}

/**
 * @class A helper tool that guarantees no more than N promises are running at 
 * the same time.
 * T: type of return value of each task.
 */
export class AsyncRunner<T> extends Disposable implements IAsyncRunner<T> {

	// [field]

	private _size: number;
	private _runningPromisesCount: number;
	private _paused: boolean;

	private readonly _limitCount: number;
	private readonly _waitingPromises: IAsyncPromiseTask<T>[];

	private readonly _onDidFlush = this.__register(new Emitter<void>());
	public readonly onDidFlush = this._onDidFlush.registerListener;

	// [constructor]

	constructor(limit: number) {
		super();

		this._size = 0;
		this._runningPromisesCount = 0;
		this._paused = false;
		this._limitCount = limit;
		this._waitingPromises = [];
	}

	// [public methods]

	get size(): number {
		return this._size;
	}

	public queue(task: ITask<Promise<T>>): Promise<T> {
		this._size++;
		return new Promise((resolve, reject) => {
			this._waitingPromises.push({ task, resolve, reject });
			this.__consume();
		});
	}

	public pause(): void {
		this._paused = true;
	}

	public resume(): void {
		if (this._paused === false) {
			return;
		}
		
		this._paused = false;
		this.__consume();
	}

	public waitNext(): Promise<void> {
		return (new EventBlocker(this.onDidFlush)).waiting();
	}

	public override dispose(): void {
		super.dispose();
		this._waitingPromises.length = 0;
	}

	// [private helper methods]

	private __consume(): void {
		if (this._paused) {
			return;
		}

		while (this._waitingPromises.length > 0 && this._runningPromisesCount < this._limitCount) {
			const task = this._waitingPromises.shift()!;
			this._runningPromisesCount++;
			const taskPromise = task.task();
			
			taskPromise.then(task.resolve, task.reject);
			taskPromise.then(() => this.__consumed(), () => this.__consumed());
		}
	}

	private __consumed(): void {
		this._size--;
		this._runningPromisesCount--;

		if (this._waitingPromises.length > 0) {
			this.__consume();
		} 
		
		else if (this._size === 0) {
			this._onDidFlush.fire();
		}
	}
}

/**
 * @class An async queue helper that guarantees only 1 promise are running at 
 * the same time.
 * T: type of return value of each task.
 */
export class AsyncQueue<T> extends AsyncRunner<T> {
	constructor() {
		super(1);
	}
}

/**
 * An interface only for {@link Scheduler}.
 */
export interface IScheduler<T> extends IDisposable {

	/**
	 * @description Schedules the callback with the given delay and fires an 
	 * event to the callback, the event will be stored as a buffer inside the
	 * scheduler.
	 * @param event Pass the event as the parameter to the callback.
	 * @param clearBuffer If to clear the buffered event.
	 * @param delay Defaults to the delay option passed into the constructor.
	 */
	schedule(event: T, clearBuffer?: boolean, delay?: number): void;

	/**
	 * @description Executes the callack with the existed event buffer if any.
	 */
	execute(): void;

	/**
	 * @description Determines if there is a scheduled execution.
	 */
	isScheduled(): boolean;

	/**
	 * @description Cancels the current scheduled execution if has any and 
	 * returns a boolean specifies whether the cancelation successed.
	 * @param clearBuffer If to cancel the previous event buffer.
	 */
	cancel(clearBuffer?: boolean): boolean;
}

/**
 * @class A `Scheduler` can schedule a new execution with the provided events on 
 * the given callback with a delay time when invoking {@link Scheduler.schedule}. 
 * The new schedule will cancel the previous schedule, the canceld event will be 
 * stored for the next scheduling.
 */
export class Scheduler<T> implements IScheduler<T> {

	private _eventBuffer: T[] = [];
	private _fn: (event: T[]) => void;
	private _delay: number;
	private _token?: NodeJS.Timeout;

	constructor(delay: number, fn: (event: T[]) => void) {
		this._fn = fn;
		this._delay = delay;
	}

	public schedule(event: T | T[], clearBuffer: boolean = false, delay: number = this._delay): void {
		this.cancel(clearBuffer);
		
		if (!Array.isArray(event)) {
			event = [event];
		}
		this._eventBuffer.push(...event);

		this._token = setTimeout(() => {
			const buffer = this._eventBuffer;
			this._eventBuffer = [];
			this._fn(buffer);
		}, delay);
	}

	public execute(): void {
		this.cancel(false);
		const buffer = this._eventBuffer;
		this._eventBuffer = [];
		this._fn(buffer);
	}

	public cancel(clearBuffer?: boolean): boolean {
		if (clearBuffer) {
			this._eventBuffer = [];
		}

		if (!isNullable(this._token)) {
			clearTimeout(this._token);
			this._token = undefined;
			return true;
		}
		return false;
	}

	public isScheduled(): boolean {
		return !(this._token === undefined);
	}

	public dispose(): void {
		this.cancel(true);
		this._fn = noop;
	}
}

/**
 * An interface only for {@link UnbufferedScheduler}.
 */
export interface IUnbufferedScheduler<T> extends IDisposable {
	
	/**
	 * @description Schedules the callback with the given delay and fires an 
	 * event to the callback, if a new scheduling happens before the previous
	 * scheduling, the previous scheduled event will be forget.
	 * @param event Pass the event as the parameter to the callback.
	 * @param delay Defaults to the delay option passed into the constructor.
	 */
	schedule(event: T, delay?: number): void;

	/**
	 * @description Determines if there is a scheduled execution.
	 */
	isScheduled(): boolean;

	/**
	 * @description Cancels the current scheduled execution if has any and 
	 * returns a boolean specifies whether the cancelation successed.
	 */
	cancel(): boolean;
}

/**
 * @class The only difference compares to {@link Scheduler} is that, it does not
 * store the previous scheduled events into buffer. Only one event will be 
 * scheduled at a time.
 */
export class UnbufferedScheduler<T> implements IUnbufferedScheduler<T> {

	// [fields]

	private _callback: (event: T) => void;
	private readonly  _delay: number;
	private _token?: NodeJS.Timeout;

	// [constructor]

	constructor(delay: number, fn: (event: T) => void) {
		this._callback = fn;
		this._delay = delay;
	}

	// [public methods]

	public schedule(event: T, delay: number | undefined = this._delay): void {
		this.cancel();
		this._token = setTimeout(() => {
			this._callback(event);
		}, delay);
	}

	public isScheduled(): boolean {
		return !(this._token === undefined);
	}

	public cancel(): boolean {
		if (!isNullable(this._token)) {
			clearTimeout(this._token);
			this._token = undefined;
			return true;
		}
		return false;
	}

	public dispose(): void {
		this.cancel();
		this._callback = noop;
	}
}

/**
 * An interface only for {@link Throttler}.
 */
export interface IThrottler {
	/**
	 * @description Queues a task either runs immediately or, runs after the 
	 * current task finished if there is no new tasks is queued after.
	 * @param task A task returns a promise.
	 * @returns A promise settled once a task is executed.
	 */
	queue<T>(task: IAsyncTask<T>): Promise<T>;
}

/**
 * @class A throttler runs the first task immediately. All the new tasks queued 
 * after added the first task and before it finishes only the last queued task 
 * will be invoked once the first task has done.
 * 
 * It is designed for limiting actions over a set amount of time. It may prevent
 * performance goes down during a busy period.
 */
export class Throttler implements IThrottler {
	
	private _runningPromise?: Promise<any>;
	private _waitingPromise?: Promise<any>;
	private _latestTask?: IAsyncTask<any>;
	
	constructor() { /** noop */ }

	public queue<T>(newTask: IAsyncTask<T>): Promise<T> {
		
		// No running tasks, this is the first one.
		if (!this._runningPromise) {
			this._runningPromise = newTask().finally(() => this._runningPromise = undefined);
			return this._runningPromise;
		}

		// A task is running, we overwrite the prev task.
		this._latestTask = newTask;

		/**
		 * If there is no waiting task, Create a waiting task that will run 
		 * after the current task.
		 */
		if (!this._waitingPromise) {
			this._waitingPromise = (async () => {
				await this._runningPromise;
				this._waitingPromise = undefined;

				const promise = this.queue(this._latestTask!);
				this._latestTask = undefined;
				
				return promise;
			})();
		}

		return this._waitingPromise;
	}
}

interface __Scheduler extends IDisposable {
	onSchedule(): boolean;
}

/** 
 * Can be passed into the {@link Debouncer.queue} to schedule using a microtask.
 */
export const MicrotaskDelay = Symbol('MicrotaskDelay');
export type DelayType = number | typeof	MicrotaskDelay;

/**
 * An interface only for {@link Debouncer}.
 */
export interface IDebouncer<T> extends IDisposable {
	
	/**
	 * @description Queues a task and reset the timer.
	 * @param newTask The new task to be executed once the timer is up.
	 * @param delay The new delay timer.
	 * @returns A promise that settled either the task is done or the debouncer 
	 * is unscheduled.
	 */
	queue(newTask: ITask<T> | IAsyncTask<T>, delay: DelayType): Promise<T>;

	/**
	 * @description Determines if the debouncer is currently on shceduling.
	 */
	onSchedule(): boolean;

	/**
	 * @description Unschedules the current timer if has one.
	 */
	unschedule(): void;
}

/**
 * @class A debouncer will use a global timer for every queued task. The timer 
 * will be reset once queued a new task. Only the latest queued task will be 
 * executed once the timer is up.
 * 
 * It is designed to ensure that the tasks do not fire so often.
 */
export class Debouncer<T> implements IDebouncer<T> {

	// [field]

	private readonly _defaultDelay: DelayType;
	private _schedule?: __Scheduler;
	private _blocker?: Blocker<T | Promise<T>>;
	private _lastestTask?: ITask<T> | IAsyncTask<T>;

	// [constructor]

	constructor(defaultDelay: DelayType) {
		this._defaultDelay = defaultDelay;
	}

	// [public mehtods]

	public async queue(newTask: ITask<T> | IAsyncTask<T>, delay = this._defaultDelay): Promise<T> {
		
		// update the task to be executed when scheduled
		this._lastestTask = newTask;
		
		// clear the previous schedule if has one
		this.__clearSchedule();

		// we need a blocker so that we can manually resolve
		if (!this._blocker) {
			this._blocker = new Blocker();
		}

		// callback when the schedule has reached
		const onSchedule = () => {
			const result = this._lastestTask ? this._lastestTask() : undefined!;
			this._blocker?.resolve(result);

			this._lastestTask = undefined;
			this._blocker = undefined;
			this._schedule = undefined;
		};

		// refresh the new schedule
		this._schedule = delay === MicrotaskDelay ? this.__scheduleAsMicrotask(onSchedule) : this.__scheduleAsTimeout(delay, onSchedule);

		// tell the client to be wait for
		return this._blocker.waiting();
	}

	public onSchedule(): boolean {
		return !!this._schedule?.onSchedule();
	}

	public unschedule(): void {
		this.__clearSchedule();
		if (this._blocker) {
			this._blocker.reject(new Error());
			this._blocker = undefined;
		}
	}

	public dispose(): void {
		this.unschedule();
	}

	// [private helper methods]

	private __clearSchedule(): void {
		this._schedule?.dispose();
		this._schedule = undefined;
	}

	private __scheduleAsTimeout(timeout: number, fn: () => void): __Scheduler {
		let scheduling = true;
		
		const token = setTimeout(() => {
			scheduling = false;
			fn();
		}, timeout);
	
		return {
			onSchedule: () => scheduling,
			dispose: () => { scheduling = false; clearTimeout(token); },
		};
	}

	private __scheduleAsMicrotask(fn: () => void): __Scheduler {
		let schedulingOrDiposed = true;
		
		queueMicrotask(() => {
			if (schedulingOrDiposed) {
				schedulingOrDiposed = false;
				fn();
			}
		});
	
		return {
			onSchedule: () => schedulingOrDiposed,
			dispose: () => schedulingOrDiposed = false,
		};
	}
}

/**
 * An interface only for {@link ThrottleDebouncer}.
 */
export interface IThrottleDebouncer<T> extends IDisposable {
	queue(task: ITask<Promise<T>>, delay?: DelayType): Promise<T>;
	onSchedule(): boolean;
	unschedule(): void;
	dispose(): void;
}

/**
 * @class A throttleDebouncer combines a {@link Throttler} and a {@link Debouncer}.
 * It ensures two things:
 * 		1. Delays to execute for each queued task.
 * 		2. Prevents parallel consecutive executions of tasks.
 */
export class ThrottleDebouncer<T> implements IThrottleDebouncer<T> {
	
	private readonly debouncer: Debouncer<Promise<T>>;
	private readonly throttler: Throttler;

	constructor(defaultDelay: number) {
		this.debouncer = new Debouncer(defaultDelay);
		this.throttler = new Throttler();
	}

	public queue(task: ITask<Promise<T>>, delay?: DelayType): Promise<T> {
		return this.debouncer.queue(() => this.throttler.queue(task), delay) as unknown as Promise<T>;
	}

	public onSchedule(): boolean {
		return this.debouncer.onSchedule();
	}

	public unschedule(): void {
		this.debouncer.unschedule();
	}

	public dispose(): void {
		this.debouncer.dispose();
	}
}