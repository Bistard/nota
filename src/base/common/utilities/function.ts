import { panic } from "src/base/common/utilities/panic";
import { Callable } from "src/base/common/utilities/type";

/**
 * @description Wraps the 'fn' to ensure it can only be executed once. 
 * @panic
 */
export function executeOnce<T extends Callable<any[], any>>(fn: T): T {
    let executed = false;
    return <any>(function (this: any, ...args: any[]) {
        if (executed) {
            panic(`The function '${fn.name}' can only be executed once.`);
        }
        executed = true;
        return fn.apply(this, args);
    });
}

/**
 * @class Manages conditional execution of callback functions. Execution through 
 * `execute()` is only allowed after a `reactivate()` call, ensuring a 
 * controlled, one-time execution for each activation cycle.
 * 
 * @note By default, it is deactivated.
 * 
 * @example
 * const reactivator = new Reactivator(() => console.log('Default action'));
 * reactivator.execute(); // No action, since `reactivate` hasn't been invoked.
 * reactivator.reactivate(); // Sets the reactivator for a single execution.
 * reactivator.execute(); // Executes the default action.
 * reactivator.execute(() => console.log('Custom action')); // No action, `reactivate` needed again.
 */
export class Reactivator {

    private _isActivated: boolean;
    private _defaultFn?: () => void;

    constructor(defaultCallback?: () => void) {
        this._isActivated = false;
        this._defaultFn = defaultCallback;
    }

    public reactivate(): void {
        this._isActivated = true;
    }

    public deactivate(): void {
        this._isActivated = false;
    }

    public execute(fn?: () => void): void {
        if (!this._isActivated) {
            return;
        }

        const executable = fn ?? this._defaultFn;
        executable?.();

        this._isActivated = false;
    }
}
