import { Pair, Triple } from "src/base/common/util/type";

export interface ITask<T> {
	(): T; // any functions that returns `T`
}

/**
 * @description Delays for given milliseconds.
 * @param ms Milliseconds.
 */
export async function delayFor(ms: number): Promise<void> {
    return new Promise( resolve => setTimeout(resolve, ms) );
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
export function asyncFinish<T>(): Triple<Promise<T>, (arg: T) => void, (reason?: any) => void> {
	let resolve!: (arg: T) => void;
	let reject!: (reason?: any) => void;
	const promise = new Promise<T>((resolve, reject) => {
		resolve = resolve;
		reject = reject;
	});
	return [promise, resolve, reject];
}