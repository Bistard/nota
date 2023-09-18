import { Dictionary } from "src/base/common/utilities/type";

export interface IReadonlyContext {
    getValue<T>(key: string): T | undefined;
}

/**
 * A context stores all the current context values and always binds to a context
 * service.
 */
export interface IContext extends IReadonlyContext {
    setValue<T>(key: string, value: T): boolean;
    deleteValue(key: string): boolean;
}

export class Context implements IContext {

    // [field]

    private readonly _context: Dictionary<string, any>;

    // [constructor]

    constructor() {
        this._context = Object.create(null);
    }

    // [public methods]

    public getValue<T>(key: string): T | undefined {
        return this._context[key];
    }

    public setValue<T>(key: string, value: T): boolean {
        if (this._context[key] !== value) {
            this._context[key] = value;
            return true;
        }
        return false;
    }

    public deleteValue(key: string): boolean {
        if (key in this._context) {
            delete this._context[key];
            return true;
        }
        return false;
    }
}