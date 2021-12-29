import { IDisposable, toDisposable } from "./dispose";
import { List } from "src/base/common/list";

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

/** @description A listener is a function that has a parameter of that specific event type T. */
export type Listener<T> = (e: T) => any;

/**
 * // TODO
 */
export interface Event<T> {
	(listener: Listener<T>, disposables?: IDisposable[]): IDisposable;
}

/**
 * // TODO
 */
export class Emitter<T> implements IDisposable {
    
    private _disposed: boolean = false;
    private _event?: Event<T>;
	protected _listeners?: List<Listener<T>>;

    /**
     * @description // TODO
     */
    get event(): Event<T> {
        if (this._disposed) {
            throw new Error('emitter is already disposed, cannot register a new listener');
        }

        if (!this._event) {
			this._event = (listener: Listener<T>, disposables?: IDisposable[]) => {
				if (!this._listeners) {
					this._listeners = new List<Listener<T>>();
				}

				const node = this._listeners.push_back(listener);
                let removed = false;

				const result = toDisposable(() => {
					if (!this._disposed && removed === false) {
						this._listeners?.remove(node);
                        removed = true;
					}
				});

				if (disposables) {
					disposables.push(result);
				}

				return result;
			};
		}
		return this._event;
    }

    /**
     * @description // TODO
     * @param event 
     * @returns 
     */
    public fire(event: T): any[] {
		const errors: any[] = [];

        if (this._listeners) {

            for (const listener of this._listeners) {
				try {
                    listener(event);
				} catch (e) {
					errors.push(e);
				}
			}

		}

        return errors;
	}

    /**
     * // TODO
     */
    public dispose() {
		if (!this._disposed) {
			this._disposed = true;
			this._listeners?.clear();
		}
	}
}

/** @deprecated Use Emitter instead */
export const EVENT_EMITTER = new EventEmitter();
