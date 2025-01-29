import { Time } from "src/base/common/date";
import { Disposable, isDisposable, LooseDisposableBucket } from "src/base/common/dispose";

/**
 * An interface defining a lazy-loadable object with disposable capabilities.
 * @template T The lazy-loaded type.
 * @template TArgs The arguments type to initialize the lazy-loaded object.
 */
export interface ILazy<T, TArgs extends any[]> extends LooseDisposableBucket {
    
    /**
     * Determine if the object is already loaded. Access this property will not
     * load the object.
     */
    readonly isLoaded: boolean;

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
 * 
 * @note When a 'timeout' is provided. The internal object will be released once
 *       reaches the time. The timeout will be refreshed by every access.
 * @note The class support object and array. It means when 'dispose' is invoked,
 *       the class loses the actual reference.
 * @note The class may be re-valued or re-disposed.
 */
export class Lazy<T, TArgs extends any[] = []> extends LooseDisposableBucket implements ILazy<T, TArgs> {

    // [fields]

    private _lazyValue: T | null;
    private _obtainValue: (...args: TArgs) => T;
    
    private readonly _timeout?: Time;
    private _delay?: any;

    // [constructor]

    constructor(
        obtainValue: (...args: TArgs) => T,
        timeout?: Time,
    ) {
        super();
        this._lazyValue = null;
        this._obtainValue = obtainValue;
        
        this._timeout = timeout;
        this._delay = undefined;
    }

    // [public methods]

    get isLoaded(): boolean {
        return this._lazyValue !== null;
    }

    public value(...args: TArgs): T {
        if (this._delay) {
            this.__resetTimeout();
        }
        
        if (this._lazyValue === null) {
            this._lazyValue = this._obtainValue(...args);
            this.__resetTimeout();
            
            // bind lifecycle if needed
            if (isDisposable(this._lazyValue)) {
                this.register(this._lazyValue);
            }
        }
        return this._lazyValue;
    }

    public override dispose(): void {
        if (isDisposable(this._lazyValue)) {
            this.release(this._lazyValue);
        }
        this._lazyValue = null;
    }

    // [private helper methods]

    private __resetTimeout(timeout = this._timeout): any {
        if (this._delay) {
            clearTimeout(this._delay);
            this._delay = undefined;
        }

        if (!timeout) {
            return;
        }
        
        this._delay = setTimeout(() => {
            this.dispose();
        }, timeout.toMs().time);
    }
}