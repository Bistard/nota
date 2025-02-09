import type { IO } from "src/base/common/utilities/functional";
import { LinkedList, ListNode } from "src/base/common/structures/linkedList";
import { Disposable, DisposableBucket, IDisposable, LooseDisposableBucket, toDisposable, untrackDisposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { panic } from "src/base/common/utilities/panic";

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

// region - types

/** 
 * @readonly A listener is a callback function that once the callback is invoked,
 * the required event type will be returned as a parameter.
 */
export type Listener<E> = (e: E) => any;
export type AsyncListener<E> = (e: E) => Promise<any>;

/**
 * Retrieve the event type T from the {@link Register}.
 */
export type GetEventType<R> = R extends Register<infer T> ? T : never;

/**
 * @readonly A register is essentially a function that registers a listener to 
 * the event type T.
 * @param listener The `listener` to be registered.
 * @param thisObject The object to be used as the `this` object when executing
 *                   the listener.
 */
export type Register<T> = {
	(listener: Listener<T>, thisObject?: any): IDisposable;
};

export type AsyncRegister<T> = {
    (listener: AsyncListener<T>, thisObject?: any): IDisposable;
};

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
        public readonly thisObject: any,
        private readonly _options?: IEmitterOptions,
    ) {}

    public fire(e: T): void {
        try {
            this._options?.onListenerRun?.();
            this.callback.call(this.thisObject, e);
            this._options?.onListenerDidRun?.();
        } catch (err) {
            const onErr = this._options?.onListenerError ?? ErrorHandler.onUnexpectedError;
            onErr(err);
        }
    }
}

/**
 * Construction interface for {@link Emitter}.
 */
export interface IEmitterOptions {

    // [listener - add]

    readonly onFirstListenerAdd?: IO<void>;
    readonly onFirstListenerDidAdd?: IO<void>;
    readonly onListenerWillAdd?: IO<void>;
    readonly onListenerDidAdd?: IO<void>;

    // [listener - remove]

    readonly onLastListenerDidRemove?: IO<void>;
    readonly onListenerWillRemove?: IO<void>;
    readonly onListenerDidRemove?: IO<void>;

    // [listener - others]

    readonly onListenerRun?: IO<void>;
    readonly onListenerDidRun?: IO<void>; // this will not be executed if error encountered

    /** Invoked when a listener throws an error. Defaults to {@link onUnexpectedError}. */
    readonly onListenerError?: (error: any) => void;

    // [emitter]

    readonly onFire?: IO<void>;
    readonly onDidFire?: IO<void>;
}

// region - AbstractEmitter

/**
 * @description This abstract class serves as a flexible foundation for creating 
 * various kinds of event emitters.
 * 
 * 1. **Why abstract the methods?**
 *  - One derived emitter might store its listeners in a linked list, another 
 *    in a set, and yet another in a tree-based structure—each approach would 
 *    have its own way to insert, remove, and iterate listeners.
 *  - By defining these methods as abstract, we can ensure that derived 
 *    classes provide **their own handling**.
 * 
 * 2. **What are those template types?**
 *  - `TEvent`: The type of the event that will be fired (e.g., a string, object, etc.).
 *  - `TRegister`: The specific function signature for registering a listener.
 *  - `TListener`: (internal usage) The type of an actual listener.
 *  - `TListenerContainer`: (internal usage) The data structure that holds the listeners (e.g., array, map, linked list).
 *  - `TListenerNode`: (internal usage) A helper type representing the individual node or element within `TListenerContainer`. 
 */
abstract class AbstractEmitter<
    TEvent,
    TRegister extends (...args: any[]) => IDisposable, 
    TListener, 
    TListenerContainer extends { size(): number, empty(): boolean, }, 
    TListenerNode,
> extends Disposable {

    // [field]

    protected readonly _listeners: TListenerContainer;
    protected _register?: TRegister;
    protected _opts?: IEmitterOptions;

    // [constructor]

    constructor(options?: IEmitterOptions) {
        super();
        this._opts = options;
        this._listeners = this.__initStructure();
    }

    // [abstract]

    protected abstract __fire(listeners: TListenerContainer, event: TEvent): void;
    protected abstract __constructListener(...args: Parameters<TRegister>): TListener;
    
    protected abstract __initStructure(): TListenerContainer;
    protected abstract __clearStructure(listeners: TListenerContainer): void;
    protected abstract __addIntoStructure(listeners: TListenerContainer, listener: TListener): TListenerNode;
    protected abstract __delFromStructure(listeners: TListenerContainer, node: TListenerNode): void;

    // [public]

    get registerListener(): TRegister {
        if (this.isDisposed()) {
            panic('emitter is already disposed, cannot register a new listener.');
        }

        this._register ??= <any>((...args: Parameters<TRegister>) => {
            
            // before first add callback
            if (this._opts?.onFirstListenerAdd && this._listeners.empty()) {
                this._opts.onFirstListenerAdd();
            }

            // register the listener (callback)
            const listener = this.__constructListener(...args);
            
            this._opts?.onListenerWillAdd?.();
            const node = this.__addIntoStructure(this._listeners, listener);
            this._opts?.onListenerDidAdd?.();
            
            // after first add callback
            if (this._opts?.onFirstListenerDidAdd && this._listeners.size() === 1) {
                this._opts.onFirstListenerDidAdd();
            }

            let listenerRemoved = false;
            let listenerRemoving = false;

            // returns a disposable in order to decide when to stop listening (unregister)
            const unRegister = toDisposable(() => {
                if (!this.isDisposed() && !listenerRemoved && !listenerRemoving) {
                    listenerRemoving = true;

                    this._opts?.onListenerWillRemove?.();
                    this.__delFromStructure(this._listeners, node);
                    this._opts?.onListenerDidRemove?.();
            
                    // last remove callback
                    if (this._opts?.onLastListenerDidRemove && this._listeners.empty()) {
                        this._opts.onLastListenerDidRemove();
                    }

                    listenerRemoving = false;
                    listenerRemoved = true;
                }
            });

            return unRegister;
        });

        return this._register!;
    }

    // [public methods]

    public hasListeners(): boolean {
        return this._listeners.size() > 0;
    }

    public fire(event: TEvent): void {
        if (this._listeners.empty()) {
            return;
        }
        this._opts?.onFire?.();
        this.__fire(this._listeners, event);
        this._opts?.onDidFire?.();
	}

    public override dispose(): void {
        super.dispose();
        this.__clearStructure(this._listeners);
        this._opts?.onLastListenerDidRemove?.();
	}
}

// region - Emitter

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
 * @throws The unexpected caught by `fire()` error will be caught by {@link ErrorHandler.onUnexpectedError}.
 */
export class Emitter<T> extends AbstractEmitter<T, Register<T>, __Listener<T>, LinkedList<__Listener<T>>, ListNode<__Listener<T>>> implements IEmitter<T> {
    
    // [method]

    protected override __fire(listeners: LinkedList<__Listener<T>>, event: T): void {
        for (const listener of listeners) {
            try {
                listener.fire(event);
            } catch (error) {
                ErrorHandler.onUnexpectedError(error);
            }
        }
    }

    protected override __constructListener(listener: Listener<T>, thisObject?: any): __Listener<T> {
        return new __Listener(listener, thisObject, this._opts);
    }
    protected override __initStructure(): LinkedList<__Listener<T>> {
        return new LinkedList();
    }
    protected override __clearStructure(listeners: LinkedList<__Listener<T>>): void {
        listeners.clear();
    }
    protected override __addIntoStructure(listeners: LinkedList<__Listener<T>>, listener: __Listener<T>): ListNode<__Listener<T>> {
        return listeners.push_back(listener);
    }
    protected override __delFromStructure(listeners: LinkedList<__Listener<T>>, node: ListNode<__Listener<T>>): void {
        listeners.remove(node);
    }
}

// region - PauseableEmitter

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

// region - DelayableEmitter

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

        // fire only once if reduce fn is provided
        if (this._reduceFn) {
            super.fire(this._reduceFn(Array.from(this._delayedEvents)));
            this._delayedEvents.clear();
            return;
        } 
         
        // fire one by one
        while (this._delayed === false && this._delayedEvents.size() > 0) {
            super.fire(this._delayedEvents.front()!.data);
            this._delayedEvents.pop_front();
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

// region - SignalEmitter

/**
 * @class A {@link SignalEmitter} consumes a series of {@link Register} and
 * fires a new type of event under a provided logic processing.
 * 
 * The {@link SignalEmitter} consumes a series of event with type T, and fires 
 * the event with type E.
 */
export class SignalEmitter<T, E> extends Emitter<E> {

    private logicHandler: (event: T) => E;

    constructor(events: Register<T>[], logicHandler: (event: T) => E) {
        super();
        this.logicHandler = logicHandler;

        for (const register of events) {
            this.add(register);
        }
    }

    public add(register: Register<T>, logicHandler: (event: T) => E = this.logicHandler): IDisposable {
        return this.__register(
            register((event: T) => {
                this.fire(logicHandler(event));
            })
        );
    }
}

// region - AsyncEmitter

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
        for (const listener of this._listeners) {
            try {
                await listener.callback.call(listener.thisObject, event);
            } catch (error) {
                ErrorHandler.onUnexpectedError(error);
                continue;
            }
        }
    }

    override get registerListener(): AsyncRegister<T> {
        return super.registerListener;
    }
}

// region - RelayEmitter

/**
 * @class A {@link RelayEmitter} works like a event pipe and the input may be 
 * changed at any time.
 * 
 * @example When the listeners: A, B and C were listening to this relay emitter 
 * and the input event T1 is from the emitter E1. Later on, the input event may 
 * be switched to the input event T2 from the emitter E2 and all the listeners 
 * now are listening to emitter E2.
 */
export class RelayEmitter<T> extends Disposable {
    
    // [field]

    /** The input emitter */
    private _inputRegister: Register<T> = Event.NONE;
    /** The disposable when the relay emitter listening to the input. */
    private readonly _inputUnregister = this.__register(new LooseDisposableBucket());

    /** Representing if any listeners are listening to this relay emitter. */
    private _listening: boolean = false;

    /** The relay (pipeline) emitter */
    private readonly _relay = this.__register(new Emitter<T>({
        onFirstListenerAdd: () => {
            this._inputUnregister.register(this._inputRegister(e => this._relay.fire(e)));
            this._listening = true;
        },
        onLastListenerDidRemove: () => {
            this._inputUnregister.dispose();
            this._listening = false;
        }
    }));

    // [event]

    public readonly registerListener = this._relay.registerListener;

    // [constructor]

    constructor() {
        super();
    }

    // [method]

    public setInput(newInputRegister: Register<T>): void {
        this._inputRegister = newInputRegister;

        /**
         * Since there still have listeners listen to the old ones, we dispose 
         * the old ones and switch to the new one.
         */
        if (this._listening) {
            this._inputUnregister.dispose();
            this._inputUnregister.register(newInputRegister(e => this._relay.fire(e)));
        }
    }
}

// region - NodeEventEmitter

export interface INodeEventEmitter {
    on(eventName: string | symbol, listener: IO<void>): any;
    removeListener(eventName: string | symbol, listener: IO<void>): any;
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
export class NodeEventEmitter<T> extends Disposable {

    private _emitter: Emitter<T>;

    constructor(
        nodeEmitter: INodeEventEmitter, 
        channel: string, 
        dataWrapper: (...args: any[]) => T = (data) => data,
    ) {
        super();
        const onData = (...args: any[]) => this._emitter.fire(dataWrapper(...args));
        const onFirstAdd = () => nodeEmitter.on(channel, onData);
		const onLastRemove = () => nodeEmitter.removeListener(channel, onData);
        this._emitter = this.__register(new Emitter({ 
            onFirstListenerAdd: onFirstAdd, 
            onLastListenerDidRemove: onLastRemove 
        }));
    }

    get registerListener(): Register<T> {
        return this._emitter.registerListener;
    }
}

export const enum Priority {
    Low,
    Normal,
    High
}

// region - 'Event' Namespace

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
        const newRegister = (listener: Listener<E>, thisArgs: any = null): IDisposable => {
            return register((e) => listener(to(e)), thisArgs);
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
        const newRegister = (listener: Listener<T>, thisArgs: any = null): IDisposable => {
            return register((e) => listener(each(e)), thisArgs);
        };
        return newRegister;
    }

    /**
     * @description Given a series of event registers, creates and returns a new
     * event register that fires whenever any of the provided events fires.
     * @param registers The provided a series of event registers.
     * @returns The new event register.
     * 
     * @note Supports heterogeneous `Register<T>` types, combining them into a 
     * single register with a union of their event types.
     */
    export function any<R extends Register<any>[]>(registers: [...R]): Register<GetEventType<R[number]>> {
        const newRegister = (listener: Listener<GetEventType<R[number]>>, thisArgs: any = null) => {
            const parent = new DisposableBucket();
            registers.map(register => {
                const disposable = register(listener, thisArgs);
                parent.register(disposable);
                return disposable;
            });
            return parent;            
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
        const newRegister = (listener: Listener<T>, thisArgs: any = null) => {
            return register(e => {
                if (fn(e)) {
                    listener.call(thisArgs, e);
                }
            }, thisArgs);
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
        return (listener: Listener<T>, thisObject: any = null) => {
            let fired = false;
            const oldListener = register((event) => {
                if (fired) {
                    return;
                }

                fired = true;
                return listener.call(thisObject, event);

            }, thisObject);

            if (fired) {
                oldListener.dispose();
            }

            return oldListener;
        };
    }

    /**
     * @description A SAFE version of {@link Event.once()}, where the returned
     * unregistration {@link IDisposable} is safe to be GCed withour properly 
     * disposed.
     */
    export function onceSafe<T>(register: Register<T>): Register<T> {
        return (listener: Listener<T>, thisObject: any = null) => {
            return untrackDisposable(
                Event.once(register)(listener, thisObject)
            );
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

    /**
     * @description Executes the listener immediately with an optional initial 
     * event value, and subsequently whenever the event fires. 
     * @param register The event register.
     * @param listener The function to execute immediately and whenever an event 
     *                 is emitted.
     * @param initial An initial event value to pass to the listener 
     *                immediately.
     * @returns An IDisposable that can be used to stop listening to the event 
     *          emissions.
     */
    export function runAndListen<T>(register: Register<T>, listener: (e?: T) => void): IDisposable;
    export function runAndListen<T>(register: Register<T>, listener: (e: T) => void, initial: T): IDisposable;
    export function runAndListen<T>(register: Register<T>, listener: (e?: T) => void, initial?: T): IDisposable {
        listener(initial);
        return register(e => listener(e));
    }
}