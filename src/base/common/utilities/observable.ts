import { Callable, Constructor } from "src/base/common/utilities/type";
import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Arrays } from "src/base/common/utilities/array";
import { getCurrTimeStamp } from "src/base/common/date";

/**
 * {@link Observable}
 * {@link observe}
 * {@link observable}
 */

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
     * @param cb The callback to be invoked when a change is detected.
     * @returns An IDisposable object that can be used to unregister the observer.
     */
    on<TType extends ObserveType, TKey extends keyof T>(type: TType, propKeys: TKey | TKey[], cb: ObserverType<TType, T[TKey]>): IDisposable;

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

export type ObserverType<TType extends ObserveType, T> = 
    TType extends ObserveType.Set
        ? (oldValue: T, newValue: T) => void
        : TType extends ObserveType.Get
            ? (value: T) => void
            : TType extends ObserveType.Call
                ? (T extends Callable<any, any> ? Callable<Parameters<T>, void> : never)
                : never;

/**
 * @class Implements an observable object that allows clients to listen to 
 * changes on its direct properties.
 * @template T The type of the underlying object being observed.
 * 
 * @note Changes in the original object WILL NOT trigger the changes.
 */
export class Observable<T extends {}> implements IObservable<T> {

    // [fields]

    private _observers: Map<string, any[]>;
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

    public on<TType extends ObserveType, TKey extends keyof T>(type: TType, propKeys: TKey | TKey[], cb: ObserverType<TType, T[TKey]>): IDisposable {
        const keys = Array.isArray(propKeys) ? propKeys : [propKeys];
        const strKeys = keys.map(key => `${String(key)}:${type}`); // composite key

        for (const key of strKeys) {
            let ob = this._observers.get(key);
            if (!ob) {
                ob = [];
                this._observers.set(key, ob);
            }
            ob.push(cb);
        }
        
        return toDisposable(() => {
            for (const key of strKeys) {
                const ob = this._observers.get(key);
                if (ob) {
                    Arrays.remove(ob!, cb);
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
                        observable.__notify(ObserveType.Call, prop, args);
                        return value.apply(observable, args);
                    };
                }

                observable.__notify(ObserveType.Get, prop, value);
                return value;
            },
        });
    }

    private __notify(type: ObserveType, propKey: string | symbol, ...args: any[]): void {
        const compositeKey = `${String(propKey)}:${type}`;
        
        for (const [registeredKey, observers] of this._observers.entries()) {
            if (compositeKey !== registeredKey) {
                continue;
            }

            for (const observer of observers) {
                observer(...args);
            }
        }
    }
}

const OB_KEY = '$OB$properties';

export function observe(target: any, propertyKey: string): void {
    if (!target[OB_KEY]) {
        target[OB_KEY] = [];
    }
    target[OB_KEY].push(propertyKey);
}

export function observable<T extends Constructor>(ctor: T): T {
    const className = ctor.toString().match(/\w+/g)?.[1] || 'UnknownClass';

    return class extends ctor {
        constructor(...args: any[]) {
            super(...args);

            // proxy
            return new Proxy(this, {
                
                set: (target: this, prop: string | symbol, value: any, receiver: any): boolean => {
                    if (target[OB_KEY]?.includes(prop)) {
                        const oldValue = Reflect.get(target, prop, receiver);
                        ObservableUtils.log(className, prop, oldValue, value);
                    }
                    
                    const result = Reflect.set(target, prop, value, receiver);
                    return result;
                }
            });
        }
    };
}

namespace ObservableUtils {

    export function log(className: string, property: string | symbol, oldValue: any, newValue: any): void {
        
        // [timestamp] className - Property: oldValue => newValue
        let logMessage = `[${getCurrTimeStamp()}] ${className} - ${String(property)}: `;
        logMessage += `${oldValue} => ${newValue}`;
        console.log(logMessage);
    }
}
