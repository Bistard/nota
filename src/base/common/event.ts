import { LinkedList } from "./linkedList";
import { Disposable, DisposableManager, IDisposable, toDisposable } from "./dispose";
import { listeners } from "process";

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

export interface Event<T> {
	(listener: (e: T) => any, disposables?: IDisposable[]): IDisposable;
}

export type Listener<T> = [(e: T) => void, any] | ((e: T) => void);


export class Emitter<T> {
    private _disposed: boolean = false;
    private _event?: Event<T>
	protected _listeners?: LinkedList<Listener<T>>;

    get event(): Event<T> {
        if (!this._event) {
			this._event = (listener: (e: T) => any, disposables?: IDisposable[]) => {
				if (!this._listeners) {
					this._listeners = new LinkedList();
				}

				const remove = this._listeners.push(listener);


				const result = toDisposable(() => {
					if (!this._disposed) {
						remove();
					}
				});

				if (Array.isArray(disposables)) {
					disposables.push(result);
				}
				

				return result;
			};
		}
		return this._event;
    }

    fire(event: T): void {
		if (this._listeners) {
			// put all [listener,event]-pairs into delivery queue
			// then emit all event. an inner/nested event might be
			// the driver of this
            for (let listener of this._listeners) {
				try {
					if (typeof listener === 'function') {
						listener.call(undefined, event);
					} else {
						listener[0].call(listener[1], event);
					}
				} catch (e) {
					console.error(e);
				}
			}
		}
	}

    dispose() {
		if (!this._disposed) {
			this._disposed = true;
			this._listeners?.clear();
		}
	}
}


export const EVENT_EMITTER = new EventEmitter();
