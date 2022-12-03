import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { NonUndefined } from "src/base/common/util/type";
import { Context, IContext, IReadonlyContext } from "src/code/platform/context/common/context";
import { ContextKey, IContextKey } from "src/code/platform/context/common/contextKey";
import { ContextKeyExpr } from "src/code/platform/context/common/contextKeyExpr";
import { createService } from "src/code/platform/instantiation/common/decorator";

export const IContextService = createService<IContextService>('context-service');

export interface IContextService extends IDisposable {
    
    readonly onDidContextChange: Register<IContextChangeEvent>;

    createContextKey<T extends NonUndefined>(key: string, defaultValue: T | undefined, description?: string): IContextKey<T>;

    getContextValue<T>(key: string): T | undefined;

    contextMatchExpr(expression: ContextKeyExpr | null): boolean;

    getContext(): IReadonlyContext;

    getAllContextKeys(): readonly IContextKey<any>[];
}

export interface IContextServiceFriendship extends IContextService {
    setContext<T>(key: string, value: T): void;
    deleteContext(key: string): void;
}

export interface IContextChangeEvent {
    readonly changedKeys: string[];
}

export class ContextService extends Disposable implements IContextServiceFriendship {

    // [field]

    private readonly _context: IContext;
    private readonly _contextKeys: IContextKey<any>[];

    // [event]

    private readonly _onDidContextChange = this.__register(new Emitter<IContextChangeEvent>());
    public readonly onDidContextChange = this._onDidContextChange.registerListener;

    // [constructor]

    constructor() {
        super();
        this._context = new Context();
        this._contextKeys = [];
    }

    // [public methods]

    public createContextKey<T extends NonUndefined>(key: string, defaultValue: T | undefined, description?: string): IContextKey<T> {
        this.__assertDisposed();
        const contextKey = new ContextKey<T>(this, key, defaultValue, description);
        this._contextKeys.push(contextKey);
        return contextKey;
    }

    public getContextValue<T>(key: string): T | undefined {
        this.__assertDisposed();
        return this._context.getValue(key);
    }

    public contextMatchExpr(expression: ContextKeyExpr | null): boolean {
        this.__assertDisposed();
        if (!expression) {
            return true;
        }
        return expression.evaluate(this._context);
    }

    public deleteContext(key: string): void {
        this.__assertDisposed();
        if (this._context.deleteValue(key)) {
            this._onDidContextChange.fire({ changedKeys: [key] });
        }
    }

    public setContext<T>(key: string, value: T): void {
        this.__assertDisposed();
        if (this._context.setValue(key, value)) {
            this._onDidContextChange.fire({ changedKeys: [key] });
        }
    }

    public getContext(): IReadonlyContext {
        this.__assertDisposed();
        return this._context;
    }

    public getAllContextKeys(): readonly IContextKey<any>[] {
        return this._contextKeys;
    }

    // [private helper methods]
    
    private __assertDisposed(): void {
        if (this.isDisposed()) {
            throw new Error('ContextService is already disposed.');
        }
    }
}