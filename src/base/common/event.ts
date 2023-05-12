import { LinkedList } from "src/base/common/util/linkedList";
import { Disposable, DisposableManager, disposeAll, IDisposable, toDisposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { ITask } from "src/base/common/util/async";

/*******************************************************************************
 * This file contains a series event emitters and related tools for communications 
 * between different code sections. 
 *  - {@link Emitter}
 *  - {@link PauseableEmitter}
 *  - {@link DelayableEmitter}
 *  - {@link SignalEmitter}
 *  - {@link AsyncEmitter}
 *  - {@link RelayEmitter}
 *  - {@link NodeEventEmitter}
 * 
 *  - {@link Event}
 ******************************************************************************/

/** 
 * @readonly A listener is a callback function that once the callback is invoked,
 * the required event type will be returned as a parameter.
 */
export type Listener<E> = (e: E) => any;

export type AsyncListener<E> = (e: E) => Promise<any>;

/**
 * @readonly A register is essentially a function that registers a listener to 
 * the event type T.
 * @param listener The `listener` to be registered.
 * @param disposables The `disposables` is used to store all the `listener`s as 
 * disposables after registrations.
 * @param thisObject The object to be used as the `this` object.
 */
export interface Register<T> {
	(listener: Listener<T>, disposables?: IDisposable[], thisObject?: any): IDisposable;
}

export interface AsyncRegister<T> {
    (listener: AsyncListener<T>, disposables?: IDisposable[], thisObject?: any): IDisposable;
}

export interface IEmitter<T> {
    /**
     * @description For the purpose of registering new listener.
     * 
     * @warn If the emitter is already disposed, an error will throw.
     * @returns A register (a function) that requires a listener (callback) to 
     * be registered.
     */
    registerListener: Register<T>;
    
    /**
     * @description Fires the event T and notifies all the registered listeners.
     * @param event The event T to be notified to all listeners.
     * 
     * @throws The unexpected error caught by fire() will be caught by {@link ErrorHandler}.
     */
    fire(event: T): void;

    /**
     * @description Determines if the emitter has any active listeners.
     */
    hasListeners(): boolean;
    
    /**
     * @description Disposes the whole event emitter. All the registered 
     * listeners will be cleaned. 
     * 
     * @warn Registering a listener after dispose() is invoked will throw an 
     * error.
     */
    dispose(): void;

    /**
     * @description If the emitter is disposed.
     */
    isDisposed(): boolean;
}

/**
 * @internal A storage wrapper used in {@link Emitter}.
 */
class __Listener<T> {

    constructor(
        public readonly callback: Listener<T>, 
        public readonly thisObject?: any
    ) {}

    public fire(e: T): void {
        this.callback.call(this.thisObject, e);
    }
}

class __AsyncListener<T> {

    constructor(
        public readonly callback: AsyncListener<T>,
        public readonly thisObject?: any
    ) {}

    public async fire(e: T): Promise<void> {
        this.callback.call(this.thisObject, e);
    }
}

/**
 * Construction interface for {@link Emitter}.
 */
export interface IEmitterOptions {

    /** Invokes before the first listener is about to be added. */
    readonly onFirstListenerAdd?: ITask<any>;

    /** Invokes after the first listener is added. */
    readonly onFirstListenerDidAdd?: ITask<any>;

    /** Invokes after the last listener is removed. */
    readonly onLastListenerRemoved?: ITask<any>;
}

/**
 * @class An event emitter binds to a specific event T. All the listeners who is 
 * listening to the event T will be notified once the event occurs.
 * 
 * To listen to this event T, use this.registerListener(listener) where `listener` 
 * is essentially a callback function.
 * 
 * To trigger the event occurs and notifies all the listeners, use this.fire(event) 
 * where `event` has the type T.
 * 
 * @throws The unexpected caught by fire() error will be caught by {@link ErrorHandler}.
 */
export class Emitter<T> implements IDisposable, IEmitter<T> {
    
    // [field]

    private _disposed: boolean = false;

    /** stores all the listeners to this event. */
    protected _listeners: LinkedList<__Listener<T>> = new LinkedList();

    /** sing function closures here. */
    private _register?: Register<T>;

    /** stores all the options. */
    private _opts?: IEmitterOptions;

    // constructor

    constructor(opts?: IEmitterOptions) {
        this._opts = opts;
    }

    // [method]
	
    get registerListener(): Register<T> {
        
        // cannot register to a disposed emitter
        if (this._disposed) {
            throw new Error('emitter is already disposed, cannot register a new listener.');
        }

        if (this._register === undefined) {
			this._register = (listener: Listener<T>, disposables?: IDisposable[], thisObject?: any) => {
				
                // before first add callback
                if (this._opts?.onFirstListenerAdd && this._listeners.empty()) {
                    this._opts.onFirstListenerAdd();
                }

                // register the listener (callback)
                const listenerWrapper = new __Listener(listener, thisObject);
				const node = this._listeners.push_back(listenerWrapper);
                let listenerRemoved = false;

                if (this._opts?.onFirstListenerDidAdd && this._listeners.size() === 1) {
                    this._opts.onFirstListenerDidAdd();
                }

                // returns a disposable in order to decide when to stop listening (unregister)
				const unRegister = toDisposable(() => {
					if (!this._disposed && !listenerRemoved) {
						this._listeners.remove(node);
                
                        // last remove callback
                        if (this._opts?.onLastListenerRemoved && this._listeners.empty()) {
                            this._opts.onLastListenerRemoved();
                        }

                        listenerRemoved = true;
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

    public fire(event: T): void {
        for (const listener of this._listeners) {
            try {
                listener.fire(event);
            } catch (error) {
                ErrorHandler.onUnexpectedError(error);
            }
        }
	}

    public dispose(): void {
		if (!this._disposed) {
			this._disposed = true;
			this._listeners.clear();
		}
	}

    public hasListeners(): boolean {
        return this._listeners.size() > 0;
    }

    public isDisposed(): boolean {
        return this._disposed;
    }
}

/**
 * @class An {@link Emitter} that is pauseable and resumable. Note that 
 * when the emitter is paused, the event will not be saved.
 * 
 * @note Default is NOT paused.
 */
export class PauseableEmitter<T> extends Emitter<T> {

    private _paused: boolean;

    constructor(activate: boolean = true) {
        super();
        this._paused = !activate;
    }

    public pause(): void {
        this._paused = true;
    }

    public resume(): void {
        this._paused = false;
    }

    public override fire(event: T): void {
        if (this._paused) {
            return;
        }
        
        super.fire(event);
    }

}

/**
 * @class An {@link Emitter} that works the same as {@link PauseableEmitter},
 * except that when the emitter is paused, the fired event will be saved. When
 * the emitter is resumed, the saved events will be re-fired.
 * 
 * The provided `reduce` function gives the chance to combine all the saved 
 * events into one single event and be fired when the emitter is resumed.
 */
export class DelayableEmitter<T> extends Emitter<T> {

    private _delayed: boolean = false;
    private _delayedEvents: LinkedList<T> = new LinkedList();
    private _reduceFn?: ((data: T[]) => T);

    constructor(reduce?: ((data: T[]) => T)) {
        super();
        this._reduceFn = reduce;
    }

    public pause(): void {
        this._delayed = true;
    }

    public resume(): void {
        this._delayed = false;
        if (this._delayedEvents.empty()) {
            return;
        }

        // fires the saved events
        if (this._reduceFn) {
            super.fire(this._reduceFn(Array.from(this._delayedEvents)));
            this._delayedEvents.clear();
        } else {
            while (this._delayed === false && this._delayedEvents.size() > 0) {
                super.fire(this._delayedEvents.front()!.data);
                this._delayedEvents.pop_front();
            }
        }
    }

    public override fire(event: T): void {
        if (this._delayed) {
            this._delayedEvents.push_back(event);
            return;
        }
        super.fire(event);
    }

    public override dispose(): void {
        super.dispose();
        this._delayedEvents.clear();
    }

}

/**
 * @class A {@link SignalEmitter} consumes a series of {@link Register} and
 * fires a new type of event under a provided logic processing.
 * 
 * The {@link SignalEmitter} consumes a series of event with type T, and fires 
 * the event with type E.
 */
export class SignalEmitter<T, E> extends Emitter<E> { 

    private disposables = new DisposableManager();
    private logicHandler: (event: T) => E;

    constructor(events: Register<T>[], logicHandler: (event: T) => E) {
        super();
        this.logicHandler = logicHandler;

        for (const register of events) {
            this.add(register);
        }
    }

    public add(register: Register<T>, logicHandler: (event: T) => E = this.logicHandler): IDisposable {
        return this.disposables.register(
            register((event: T) => {
                this.fire(logicHandler(event));
            })
        );
    }

    public override dispose(): void {
        super.dispose();
        this.disposables.dispose();
    }
}

/**
 * @class Same as {@link Emitter<T>} with extra method `fireAsync()`.
 * 
 * @throws The unexpected error caught by fire() will be caught by {@link ErrorHandler}.
 */
export class AsyncEmitter<T> extends Emitter<T> {

    constructor() {
        super();
    }

    public async fireAsync(event: T): Promise<void> {
        
        for (const listener of this._listeners as LinkedList<__AsyncListener<T>>) {
            try {
                await listener.fire(event);
            } catch (error) {
                ErrorHandler.onUnexpectedError(error);
                continue;
            }
        }
    }

}

/**
 * @class A {@link RelayEmitter} works like a event pipe and the input may be 
 * changed at any time.
 * 
 * @example When the listeners: A, B and C were listening to this relay emitter 
 * and the input event T1 is from the emitter E1. Later on, the input event may 
 * be switched to the input event T2 from the emitter E2 and all the listeners 
 * now are listening to emitter E2.
 */
export class RelayEmitter<T> implements IDisposable {
    
    // [field]

    /** The input emitter */
    private _inputRegister: Register<T> = Event.NONE;
    /** The disposable when the relay emitter listening to the input. */
    private _inputUnregister: IDisposable = Disposable.NONE;

    /** Representing if any listeners are listening to this relay emitter. */
    private _listening: boolean = false;

    /** The relay (pipeline) emitter */
    private readonly _relay = new Emitter<T>({
        onFirstListenerAdd: () => {
            this._inputUnregister = this._inputRegister(e => this._relay.fire(e));
            this._listening = true;
        },
        onLastListenerRemoved: () => {
            this._inputUnregister.dispose();
            this._listening = false;
        }
    });

    // [event]

    public readonly registerListener = this._relay.registerListener;

    // [constructor]

    constructor() {}

    // [method]

    public setInput(newInputRegister: Register<T>): void {
        this._inputRegister = newInputRegister;

        /**
         * Since there still have listeners listen to the old ones, we dispose 
         * the old ones and switch to the new one.
         */
        if (this._listening) {
            this._inputUnregister.dispose();
            this._inputUnregister = newInputRegister(e => this._relay.fire(e));
        }
    }

    public dispose(): void {
        this._inputUnregister.dispose();
        this._relay.dispose();
    }

}

export interface INodeEventEmitter {
    on(eventName: string | symbol, listener: Function): any;
    removeListener(eventName: string | symbol, listener: Function): any;
}

/**
 * @class A wrapper of {@link NodeJS.EventEmitter} that listens to the provided
 * channel and wraps the receiving data with the provided data wrapper.
 * 
 * @note This class is not disposable. Once all the listeners are disposed the
 * corresponding {@link NodeJS.EventEmitter} channel listener will be auto 
 * removed. There is nothing to be disposed of that is under this class control.
 * 
 * @type T: Converting the receiving data to the generic type T.
 */
export class NodeEventEmitter<T> implements IDisposable {

    private _emitter: Emitter<T>;

    constructor(
        nodeEmitter: INodeEventEmitter, 
        channel: string, 
        dataWrapper: (...args: any[]) => T = (data) => data,
    ) {
        const onData = (...args: any[]) => this._emitter.fire(dataWrapper(...args));
        const onFirstAdd = () => nodeEmitter.on(channel, onData);
		const onLastRemove = () => nodeEmitter.removeListener(channel, onData);
        this._emitter = new Emitter({ 
            onFirstListenerAdd: onFirstAdd, 
            onLastListenerRemoved: onLastRemove });
    }

    get registerListener(): Register<T> {
        return this._emitter.registerListener;
    }

    public dispose(): void {
        this._emitter.dispose();
    }
}

export const enum Priority {
    Low,
    Normal,
    High
}

/**
 * @description A series helper functions that relates to {@link Emitter} and 
 * {@link Register}.
 */
export namespace Event {

    export const NONE: Register<any> = () => Disposable.NONE;

    /**
     * @description Creates a new event register by mapping the original event 
     * type T to the new event type E given the mapping function.
     * @param register The original event register.
     * @param to The mapping function.
     * @returns The new event register.
     */
    export function map<T, E>(register: Register<T>, to: (e: T) => E): Register<E> {
        const newRegister = (listener: Listener<E>, disposibles?: IDisposable[], thisArgs: any = null): IDisposable => {
            return register((e) => listener(to(e)), disposibles, thisArgs);
        };
        return newRegister;
    }

    /**
     * @description Creates a new event register by updating the original event 
     * given the update function.
     * @param register The original event register.
     * @param each The update function.
     * @returns The new event register.
     */
    export function each<T>(register: Register<T>, each: (e: T) => T): Register<T> {
        const newRegister = (listener: Listener<T>, disposibles?: IDisposable[], thisArgs: any = null): IDisposable => {
            return register((e) => listener(each(e)), disposibles, thisArgs);
        };
        return newRegister;
    }

    /**
     * @description Given a series of event registers, creates and returns a new
     * event register that fires whenever any of the provided events fires.
     * @param registers The provided a series of event registers.
     * @returns The new event register.
     */
    export function any<T>(registers: Register<T>[]): Register<T> {
        const newRegister = (listener: Listener<T>, disposables?: IDisposable[], thisArgs: any = null) => {
            const allDiposables = registers.map(register => register(listener, disposables, thisArgs));
            const parentDisposable = toDisposable(() => disposeAll(allDiposables));
            return parentDisposable;            
        };
        return newRegister;
    }

    /**
     * @description Filters the fired events from the provided event register by
     * the given filter function.
     * @param register The provided event register.
     * @param fn The filter function.
     */
    export function filter<T>(register: Register<T>, fn: (e: T) => boolean): Register<T> {
        const newRegister = (listener: Listener<T>, disposables?: IDisposable[], thisArgs: any = null) => {
            return register(e => {
                if (fn(e)) {
                    listener.call(thisArgs, e);
                }
            }, disposables, thisArgs);
        };
        return newRegister;
    }

    /**
     * @description Given a {@link Register} and returns a new created event 
     * register that only fire once.
     * @param register The given register.
     * @returns A new event register that only fire once.
     */
    export function once<T>(register: Register<T>): Register<T> {
        return (listener: Listener<T>, disposables?: IDisposable[], thisObject: any = null) => {
            let fired = false;
            const oldListener = register((event) => {
                if (fired) {
                    return;
                }

                fired = true;
                return listener.call(thisObject, event);

            }, disposables, thisObject);

            if (fired) {
                oldListener.dispose();
            }

            return oldListener;
        };
    }

    /**
     * @description Convert the given event register into a promise which will
     * resolve once the event fires.
     * @param register The provided event register.
     * @returns A promise to be resolved to get the fired event data.
     */
    export function toPromise<T>(register: Register<T>): Promise<T> {
		return new Promise(resolve => once(register)(resolve));
	}
}