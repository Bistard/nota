import { Callable, Constructor, Or, isFunction, isObject } from "src/base/common/utilities/type";
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
     * @param propKey The property key to observe. When '' is given, it will 
     *                 observe on any propKey on the given TType.
     * @param cb The callback to be invoked when a change is detected.
     * @returns An IDisposable object that can be used to unregister the observer.
     */
    on<TType extends ObserveType, TKey extends keyof T | null>(type: TType, propKey: TKey, cb: GetObserver<TType, T, TKey>): IDisposable;

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
export type ObserveType = 'set' | 'get' | 'call';

export type GetObserver<TType extends ObserveType, T extends object, TKey extends keyof T | null> = ObserverType<TType, T[Or<NonNullable<TKey>, keyof T>], TKey>;
export type ObserverType<TType extends ObserveType, T, TKey> = 
    TKey extends null
    ? TType extends 'set'
        ? (propKey: string, oldValue: T, newValue: T) => void
        : TType extends 'get'
            ? (propKey: string, value: T) => void
            : TType extends 'call'
                ? (T extends Callable<any, any> ? Callable<[propKey: string, ret: ReturnType<T>, ...rest: Parameters<T>], void> : never)
                : never
    : TType extends 'set'
        ? (oldValue: T, newValue: T) => void
        : TType extends 'get'
            ? (value: T) => void
            : TType extends 'call'
                ? (T extends Callable<any, any> ? Callable<[ret: ReturnType<T>, ...rest: Parameters<T>], void> : never)
                : never;

/**
 * @class Implements an observable object that allows clients to listen to 
 * changes on an underlying object of its direct properties.
 * 
 * @template T The type of the underlying object being observed.
 * @note Changes in the original object WILL NOT trigger the changes.
 * 
 * @example
 * ```ts
 * interface IUser {
 *   name: string;
 *   age: number;
 * }
 * 
 * const observable = new Observable<IUser>({ name: 'John Doe', age: 30 });
 * const user = observable.getProxy();
 * 
 * observable.on('set', 'name', (oldName, newName) => {
 *   console.log(`User name changed from ${oldName} to ${newName}`);
 * });
 * 
 * // Triggers the callback and logs: "User name changed from John Doe to Jane Doe"
 * user.name = 'Jane Doe';
 * ```
 */
export class Observable<T extends {}> implements IObservable<T> {

    // [fields]

    /**
     * Mapping from: 
     *      compositeKey (e.g. `propName:{@link ObserveType}`, or `foo:call` 
     *                    which means observing on function call on the method 
     *                    named foo)
     * to
     *      callback functions (e.g. {@link ObserverType})
     */
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

    public on<TType extends ObserveType, TKey extends keyof T | null>(type: TType, propKeys: TKey | TKey[] | '', cb: GetObserver<TType, T, TKey>): IDisposable {
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

        return new Proxy<T>(target, {
            
            set: (obj: T, prop: string | symbol, value: any, receiver: any): boolean => {
                const prevVal = Reflect.get(obj, prop, receiver);
                const result = Reflect.set(obj, prop, value, receiver);
                this.__notify('set', prop, prevVal, value);
                return result;
            },
            
            get: (obj: T, prop: string | symbol, receiver: any): any => {
                const value = Reflect.get(obj, prop, receiver);
                
                // function proxy
                if (isFunction(value)) {
                    return (...args: any[]) => {
                        const ret = value.apply(this, args);
                        this.__notify('call', prop, ret, args);
                        return ret;
                    };
                }

                this.__notify('get', prop, value);
                return value;
            },
        });
    }

    private __notify(type: ObserveType, propKey: string | symbol, ...args: any[]): void {
        const compositeKey = `${String(propKey)}:${type}`;
        
        for (const [registeredKey, observers] of this._observers.entries()) {
            
            // universal observer
            if (registeredKey === `:${type}`) {
                for (const observer of observers) {
                    observer(String(propKey), ...args);
                }
                continue;
            }
            
            if (registeredKey !== compositeKey) {
                continue;
            }

            for (const observer of observers) {
                observer(...args);
            }
        }
    }
}
