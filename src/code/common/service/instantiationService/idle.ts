import { IDisposable } from "src/base/common/dispose";

export interface IdleDeadline {
	readonly didTimeout: boolean;
	timeRemaining(): number;
}

/**
 * Function for executing the callback when the next time the browser is idle
 */
export let runWhenIdle: (callback: (idle: IdleDeadline) => void, timeout?: number) => IDisposable;

declare function requestIdleCallback(callback: (args: IdleDeadline) => void, options?: { timeout: number }): number;
declare function cancelIdleCallback(handle: number): void;

(function () {
	if (typeof requestIdleCallback !== 'function' || typeof cancelIdleCallback !== 'function') {
		const dummyIdle: IdleDeadline = Object.freeze({
			didTimeout: true,
			timeRemaining() { return 15; }
		});
		runWhenIdle = (runner) => {
			const handle: NodeJS.Timeout = setTimeout(() => runner(dummyIdle));
			let disposed = false;
			return {
				dispose() {
					if (disposed) {
						return;
					}
					disposed = true;
					clearTimeout(handle);
				}
			};
		};
	} else {
		runWhenIdle = (runner, timeout?) => {
			const handle: number = requestIdleCallback(runner, typeof timeout === 'number' ? { timeout } : undefined);
			let disposed = false;
			return {
				dispose() {
					if (disposed) {
						return;
					}
					disposed = true;
					cancelIdleCallback(handle);
				}
			};
		};
	}
})();

/**
 * An implementation of the "idle-until-urgent"-strategy as introduced
 * here: https://philipwalton.com/articles/idle-until-urgent/
 */
export class IdleValue<T> {

    private readonly _executor: () => void;
    private readonly _handle: IDisposable;

    private _runned: boolean = false;
    private _value?: T;
    private _error: any;

    constructor(executor: () => T) {
        this._executor = () => {
            try {
                this._value = executor();
            } catch(err) {
                this._error = err;
            } finally {
                this._runned = true;
            }
        };
        this._handle = runWhenIdle(() => this._executor());
    }

    public getValue(): T {
		if (!this._runned) {
			this._handle.dispose();
			this._executor();
		}
		if (this._error) {
			throw this._error;
		}
		return this._value!;
	}

    public isInitialized(): boolean {
        return this._runned;
    }

}