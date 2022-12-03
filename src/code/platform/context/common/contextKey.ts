import { NonUndefined } from "src/base/common/util/type";
import { IContextServiceFriendship } from "src/code/platform/context/common/contextService";

/**
 * A context key represents a pair of key and value in a context from the 
 * context-service. You may 'set', 'reset' or 'get' the value of the key in
 * the binding context.
 * 
 * @note The context key should not be created directly. Since it always binds 
 * to a context, the only way to create a context key is through a context 
 * service.
 * @note Once the context key is created, it cannot rebind to another context.
 * @type T - represents the value type. Cannot set `undefined` as the default 
 *       value.
 */
export interface IContextKey<T> {
    readonly key: string;
    set(value: T): void;
    reset(): void;
    get(): T | undefined;
}

export class ContextKey<T extends NonUndefined> implements IContextKey<T> {

    // [field]

    private readonly _key: string;
    private readonly _defaultValue: T | undefined;
    private readonly _service: IContextServiceFriendship;

    // [constructor]

    constructor(key: string, defaultValue: T | undefined, service: IContextServiceFriendship) {
        this._key = key;
        this._defaultValue = defaultValue;
        this._service = service;
        this.reset();
    }

    // [public methods]

    public get key() : string {
        return this._key;
    }
    
    public set(value: T): void {
        this._service.setContext(this._key, value);
    }

    public reset(): void {
        if (this._defaultValue === undefined) {
            this._service.deleteContext(this._key);
        } else {
            this._service.setContext(this._key, this._defaultValue);
        }
    }

    public get(): T | undefined {
        return this._service.getContextValue(this._key);
    }
}
