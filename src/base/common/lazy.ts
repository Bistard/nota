import { IDisposable } from "src/base/common/dispose";

/**
 * An interface defining a lazy-loadable object with disposable capabilities.
 * @template T The lazy-loaded object type, extending from a disposable interface.
 * @template TArgs The types of arguments required to initialize the lazy-loaded object.
 */
export interface ILazy<T extends Partial<IDisposable>, TArgs extends any[]> {
    
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
     */
    dispose(): void;
}

export class Lazy<T extends Partial<IDisposable>, TArgs extends any[] = []> implements ILazy<T, TArgs> {

    // [fields]

    private _lazyValue?: T;
    private _obtainValue: (...args: TArgs) => T;

    // [constructor]

    constructor(
        obtainValue: (...args: TArgs) => T,
    ) {
        this._lazyValue = undefined;
        this._obtainValue = obtainValue;
    }

    // [public methods]

    public value(...args: TArgs): T {
        if (!this._lazyValue) {
            this._lazyValue = this._obtainValue(...args);
        }
        return this._lazyValue;
    }

    public dispose(): void {
        this._lazyValue?.dispose?.();
    }
}