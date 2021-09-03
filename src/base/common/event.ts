
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

export const EVENT_EMITTER = new EventEmitter();
