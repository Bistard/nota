import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";

/**
 * {@link Blocker}
 * {@link AsyncRunner}
 * {@link Throttler}
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
export async function delayFor(ms: number, callback?: Function): Promise<void> {
    return new Promise(resolve => setTimeout(() => {
			if (callback) callback();
			resolve();
		}, ms)
	);
}

/**
 * @description Helper functions for retrying a given task for given retry rounds. 
 * @param task Task function.
 * @param delay Delay ms.
 * @param retries Retry rounds.
 */
export async function retry<T>(task: ITask<Promise<T>>, delay: number, retries: number): Promise<T> {
	let lastError: Error | unknown;

	for (let i = 0; i < retries; i++) {
		
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
 * @description Block the program by calling {@link Blocker.wait()} for waiting
 * a data with type T. You may signal the blocker to tell if we retrieve the 
 * data succeeded or failed.
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
 * An interface only for {@link Throttler}.
 */
export interface IThrottler {
	/**
	 * @description 
	 * @param task 
	 */
	queue<T>(task: ITask<Promise<T>>): Promise<T>;
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
	private _latestTask?: ITask<Promise<any>>;
	
	constructor() { /** noop */ }

	public queue<T>(newTask: ITask<Promise<T>>): Promise<T> {
		
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