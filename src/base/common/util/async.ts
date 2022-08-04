import { IDisposable } from "src/base/common/dispose";
import { Triple } from "src/base/common/util/type";

export interface ITask<T> {
	(): T; // any functions that returns `T`
}

export type IAsyncTask<T> = Triple<Promise<T>, (arg: T) => void, (reason?: any) => void>;

/**
 * @description Delays for given milliseconds.
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
 * @description Creates a simple {@link Promise} and returns its resolve or 
 * reject functions for manually resolving or rejecting.
 * @returns First returned value is the new created promise, the second returned
 * value is the isolated resolve function, the third returned value is the 
 * isolated reject function.
 */
export function asyncTask<T>(): IAsyncTask<T> {
	let resolved!: (arg: T) => void;
	let rejected!: (reason?: any) => void;
	const promise = new Promise<T>((resolve, reject) => {
		resolved = resolve;
		rejected = reject;
	});
	return [promise, resolved, rejected];
}

export type IAsyncPromiseTask<T> = {
	task: ITask<Promise<T>>;
	resolve: (arg: T) => void;
	reject: (reason?: any) => void;
};

/**
 * An interface for {@link AsyncParallelExecutor}.
 */
export interface IAsyncParallelExecutor<T> extends IDisposable {
	
	/**
	 * The total number of promises that are either being waiting or executing.
	 */
	readonly size: number;

	/**
	 * @description Queueing a function that returns a promise into the executor.
	 * Returns a promise that will resolve the // TODO
	 * @param task 
	 * @returns 
	 */
	push(task: ITask<Promise<T>>): Promise<T>;

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
 */
export class AsyncParallelExecutor<T> implements IAsyncParallelExecutor<T> {

	// [field]

	private _size: number;
	private _runningPromisesCount: number;
	private _paused: boolean;

	private readonly _limitCount: number;
	private readonly _waitingPromises: IAsyncPromiseTask<T>[];

	// [constructor]

	constructor(limit: number) {
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

	public push(task: ITask<Promise<T>>): Promise<T> {
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

	public dispose(): void {
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
	}
}

/**
 * @class An async queue helper that guarantees only 1 promise are running at 
 * the same time.
 */
export class AsyncQueue<T> extends AsyncParallelExecutor<T> {
	constructor() {
		super(1);
	}
}