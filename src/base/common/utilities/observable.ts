import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Arrays } from "src/base/common/utilities/array";

/**
 * An interface only for {@link Observable}.
 */
export interface IObservable<T extends object> {

    /**
     * @description Returns the proxy object that can be observed.
     * @note Changes on the original object WILL NOT trigger the changes.
     */
    getProxy(): T;

    /**
     * @description Registers an observer callback for a specific property and 
     * operation type.
     * 
     * @template TKey The type of the keys of the properties to observe.
     * @param type The type of operation to observe.
     * @param propKeys The property key or keys to observe.
     * @param onChange The callback to be invoked when a change is detected.
     * @returns An IDisposable object that can be used to unregister the observer.
     */
    on<TKey extends keyof T>(type: ObserveType, propKeys: TKey | TKey[], onChange: IObserver<T[TKey]>): IDisposable;

    /**
     * @description Cleans up the observable by removing all observers. After 
     * calling `dispose`, the observable should no longer notify any observers 
     * of changes.
     */
    dispose(): void;
}

/**
 * Defines the shape of a callback function that observers can use to listen to 
 * changes in an {@link Observable}.
 * @template T The type of the observed value.
 * @note Will be invoked when a change is observed.
 */
export interface IObserver<T> {
    (prevVal: T, newVal: T): void;
}

/**
 * Enumerates the types of operations that can be observed on an {@link Observable} 
 * object.
 */
export const enum ObserveType {
    Set  = 'set',
    Get  = 'get',
    Call = 'call',
}

/**
 * @class Implements an observable object that allows clients to listen to 
 * changes on its direct properties.
 * @template T The type of the underlying object being observed.
 * 
 * @note Changes in the original object WILL NOT trigger the changes.
 */
export class Observable<T extends {}> implements IObservable<T> {

    // [fields]

    private _observers: Map<string, IObserver<any>[]>;
    private readonly _proxy: T;

    // [constructor]

    constructor(obj: T) {
        this._observers = new Map();
        this._proxy = this.__createProxy(obj);
    }

    // [getter]

    public getProxy(): T {
        return this._proxy;
    }

    // [public methods]

    public on<TKey extends keyof T>(type: ObserveType, propKeys: TKey | TKey[], onChange: IObserver<T[TKey]>): IDisposable {
        const keys = Array.isArray(propKeys) ? propKeys : [propKeys];
        const strKeys = keys.map(key => `${String(key)}:${type}`); // composite key

        for (const key of strKeys) {
            let ob = this._observers.get(key);
            if (!ob) {
                ob = [];
                this._observers.set(key, ob);
            }
            ob.push(onChange);
        }
        
        return toDisposable(() => {
            for (const key of strKeys) {
                const ob = this._observers.get(key);
                if (ob) {
                    Arrays.remove(ob!, onChange);
                }
            }
        });
    }

    public dispose(): void {
        this._observers.clear();
    }

    // [private helper methods]

    private __createProxy(target: T): T {
        
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const observable = this;
        
        
        return new Proxy<T>(target, {
            
            set: (obj: T, prop: string | symbol, value: any, receiver): boolean => {
                const prevVal = Reflect.get(obj, prop, receiver);
                const result = Reflect.set(obj, prop, value, receiver);
                
                observable.__notify(ObserveType.Set, prop, prevVal, value);
                return result;
            },
            
            get: (obj: T, prop: string | symbol, receiver: any) => {
                const value = Reflect.get(obj, prop, receiver);
                
                // function proxy
                if (typeof value === 'function') {
                    return function (...args: any[]) {
                        observable.__notify(ObserveType.Call, prop, args, null);
                        return value.apply(observable, args);
                    };
                }

                observable.__notify(ObserveType.Get, prop, value, value);
                return value;
            },
        });
    }

    private __notify<T>(type: ObserveType, propKey: string | symbol, prevVal: T, newVal: T): void {
        const compositeKey = `${String(propKey)}:${type}`;
        
        for (const [registeredKey, observers] of this._observers.entries()) {
            if (compositeKey !== registeredKey) {
                continue;
            }

            for (const observer of observers) {
                observer(prevVal, newVal);
            }
        }
    }
}
