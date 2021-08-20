
export interface IEventEmitter {
    /**
     * @description register an event
     */
     register(id: string, callback: (...params: []) => void): boolean;
    
    /**
     * @description emits an event
     */
     emit(id: string, ...params: []): boolean;
}

export class EventEmitter implements IEventEmitter {

    private _events: { [key: string]: { (): void }[] };

    constructor() {
        this._events = {};
    }
    
    public register(id: string, callback: (...params: []) => void): boolean {
        if (this._events[id]) {
            this._events[id]!.push(callback);
        } else {
            this._events[id] = [callback];
        }
        return true;
    }

    public emit(id: string, ...params: []): boolean {
        if (this._events[id]) {
            this._events[id]?.forEach(callback => {
                callback.apply(params);
            });
            return true;
        }
        return false;
    }

}