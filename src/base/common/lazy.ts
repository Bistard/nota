import { isDisposable } from "src/base/common/dispose";

/**
 * An interface defining a lazy-loadable object with disposable capabilities.
 * @template T The lazy-loaded type.
 * @template TArgs The arguments type to initialize the lazy-loaded object.
 */
export interface ILazy<T, TArgs extends any[]> {
    
    /**
     * @description Returns the lazy-loaded object, initializing it if not 
     * already done.
     * @param args The arguments required for object initialization.
     * @returns The lazy-loaded object.
     */
    value(...args: TArgs): T;

    /**
     * @description Dispose the value (only if it is loaded) if the value is 
     * disposable. 
     * @note It is ok to re-obtain the value after dispose.
     */
    dispose(): void;
}

/**
 * @class This class allows for the deferred initialization of an object until 
 * its first use.
 * @note The class support object and array. It means when 'dispose' is invoked,
 *       the class loses the actual reference.
 */
export class Lazy<T, TArgs extends any[] = []> implements ILazy<T, TArgs> {

    // [fields]

    private _lazyValue: T | null;
    private _obtainValue: (...args: TArgs) => T;

    // [constructor]

    constructor(
        obtainValue: (...args: TArgs) => T,
    ) {
        this._lazyValue = null;
        this._obtainValue = obtainValue;
    }

    // [public methods]

    public value(...args: TArgs): T {
        if (this._lazyValue === null) {
            this._lazyValue = this._obtainValue(...args);
        }
        return this._lazyValue;
    }

    public dispose(): void {
        if (this._lazyValue === null) {
            return;
        }

        if (isDisposable(this._lazyValue)) {
            this._lazyValue.dispose();
        }

        this._lazyValue = null;
    }
}