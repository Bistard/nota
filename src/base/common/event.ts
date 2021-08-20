
export interface IEventEmitter {
    /**
     * @description register an event.
     * 
     * to avoid losing 'this' scope, please pass the callback using an arrow 
     * wrapper function such as: '_eventEmitter.register(id, (...params) => callback(params));'
     */
     register(id: string, callback: (...params: any[]) => void): boolean;
    
    /**
     * @description emits an event
     */
     emit(id: string, ...params: any[]): boolean;
}

export class EventEmitter implements IEventEmitter {

    private _events: { [key: string]: { (): void }[] };

    constructor() {
        this._events = {};
    }
    
    public register(id: string, callback: (...params: any[]) => void): boolean {
        if (this._events[id]) {
            this._events[id]!.push(callback);
        } else {
            this._events[id] = [callback];
        }
        return true;
    }

    public emit(id: string, ...params: any[]): boolean {
        if (this._events[id]) {
            this._events[id]?.forEach(callback => {
                callback.apply(null, params as []);
            });
            return true;
        }
        return false;
    }

}