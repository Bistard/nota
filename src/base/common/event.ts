import { IDisposable, toDisposable } from "./dispose";
import { List } from "src/base/common/list";
import { addDisposableListener, EventType } from "src/base/common/dom";

/** @deprecated Use Emitter instead */
export interface IEventEmitter {
    /**
     * @description register an event.
     * 
     * to avoid losing 'this' scope, please pass the callback using an arrow 
     * wrapper function such as: '_eventEmitter.register(id, (...params) => callback(params));'
     */
    register(id: string, callback: (...params: any[]) => any): boolean;
    
    /**
     * @description emits an event, returns an array of return values for each registered callbacks.
     */
    emit(id: string, ...params: any[]): any[] | any;
}

/** @deprecated Use Emitter instead */
export class EventEmitter implements IEventEmitter {

    private _events: { 
        [key: string]: { (): any }[]
    };

    constructor() {
        this._events = {};
    }
    
    public register(id: string, callback: (...params: any[]) => any): boolean {
        if (this._events[id]) {
            this._events[id]!.push(callback);
        } else {
            this._events[id] = [callback];
        }
        return true;
    }

    public emit(id: string, ...params: any[]): any[] | any {
        const returnValues: any[] = [];
        if (this._events[id]) {
            this._events[id]!.forEach(callback => {
                const res = callback.apply(null, params as []);
                if (res) {
                    returnValues.push(res);
                }
            });
        }
        if (returnValues.length === 1) {
            return returnValues[0];
        }
        return returnValues;
    }
}

/** @deprecated Use Emitter instead */
export const EVENT_EMITTER = new EventEmitter();

/** THE ABOVE CODE ARE ALL @deprecated, will be removed later. */

/** 
 * @readonly A listener is a callback function that once the callback is invoked,
 * the required event type will be returned as a parameter.
 */
export type Listener<E> = (e: E) => any;

/**
 * @readonly A register is essentially a function that registers a listener to 
 * the event type T.
 * 
 * @param listener The `listener` to be registered.
 * @param disposables The `disposables` is used to store all the `listener`s as 
 * disposables after registrations.
 */
export interface Register<T> {
	(listener: Listener<T>, disposables?: IDisposable[]): IDisposable;
}

/**
 * @readonly An event emitter binds to a specific event T. All the listeners who 
 * is listening to the event T will be notified once the event occurs.
 * 
 * To listen to this event T, use this.register(listener) where `listener` is a
 * callback function.
 * 
 * To trigger the event occurs and notifies all the listeners, use this.fire(event) 
 * where `event` is the type T.
 */
export class Emitter<T> implements IDisposable {
    
    private _disposed: boolean = false;
    private _listeners: List<Listener<T>> = new List();

    /** @readonly Using function closures here. */
    private _register?: Register<T>;
	
    /**
     * @description For the purpose of registering new listener.
     * 
     * @warn If the emitter is already disposed, an error will throw.
     * @returns A register (a function) that requires a listener (callback) to 
     * be registered.
     */
    get registerListener(): Register<T> {
        
        // cannot register to a disposed emitter
        if (this._disposed) {
            throw new Error('emitter is already disposed, cannot register a new listener');
        }

        if (this._register === undefined) {
			this._register = (listener: Listener<T>, disposables?: IDisposable[]) => {
				
                // register the listener (callback)
				const node = this._listeners.push_back(listener);
                let removed = false;

                // returns a disposable inorder to control when to stop listening
				const unRegister = toDisposable(() => {
					if (!this._disposed && removed === false) {
						this._listeners.remove(node);
                        removed = true;
					}
				});

				if (disposables) {
					disposables.push(unRegister);
				}

				return unRegister;
			};
		}
        
		return this._register;
    }

    /**
     * @description Fires the event T and notifies all the registered listeners.
     * 
     * @note fire() guarantees all the registered listeners (callback) will be 
     * invoked / notified. Any errors will be stored and returned as an array.
     * 
     * @param event The event T to be notified to all listeners.
     * @returns An array of errors.
     */
    public fire(event: T): any[] {
		
        const errors: any[] = [];

        for (const listener of this._listeners) {
            try {
                listener(event);
            } catch (e) {
                errors.push(e);
            }
        }

        return errors;
	}

    /**
     * @description Disposes the whole event emitter. All the registered 
     * listeners will be cleaned. 
     * 
     * @warn Registering a listener after dispose() is invoked will throw an 
     * error.
     */
    public dispose(): void {
		if (!this._disposed) {
			this._disposed = true;
			this._listeners.clear();
		}
	}
}

/**
 * @class A Simple class for register callback on a given HTMLElement using an
 * {@link Emitter} instead of using raw *addEventListener()* method.
 */
export class DomEmitter<E> {

    private emitter: Emitter<E>;
    private listener: IDisposable;

    get registerListener(): Register<E> {
        return this.emitter.registerListener;
    }

    constructor(element: HTMLElement, type: EventType) {
        this.emitter = new Emitter();
        this.listener = addDisposableListener(element, type, (e: Event) => this.emitter.fire(e as any));
    }

    public dispose(): void {
        this.emitter.dispose();
        this.listener.dispose();
    }

}

/**
 * @description A series helper functions that relates to {@link Emitter} and 
 * {@link Register}.
 */
export namespace Event {

    /**
     * @description Creates a new event register by mapping the original event 
     * type T to the new event type E given the mapping function.
     * @param register The original event register.
     * @param to The mapping function.
     * @returns The new event register.
     */
    export function map<T, E>(register: Register<T>, to: (e: T) => E): Register<E> {
        const newRegister = (listener: Listener<E>, disposibles?: IDisposable[]): IDisposable => {
            return register((e) => listener(to(e)), disposibles);
        };

        return newRegister;
    }

}