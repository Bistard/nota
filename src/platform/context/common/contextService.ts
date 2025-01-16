import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { panic } from "src/base/common/utilities/panic";
import { NonUndefined } from "src/base/common/utilities/type";
import { Context, IContext, IReadonlyContext } from "src/platform/context/common/context";
import { ContextKey, IContextKey } from "src/platform/context/common/contextKey";
import { ContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { IService, createService } from "src/platform/instantiation/common/decorator";

export const IContextService = createService<IContextService>('context-service');

/**
 * An interface only for {@link ContextService}.
 */
export interface IContextService extends IDisposable, IService {

    /**
     * Fires when any contexts has changed.
     */
    readonly onDidContextChange: Register<IContextChangeEvent>;

    /**
     * @description Creates a new {@link IContextKey} that binds to the context.
     * You may update the context value (it is also the only way) through the 
     * created {@link IContextKey}.
     * @param key The key value in the {@link IContext}.
     * @param defaultValue The default value to be set in the {@link IContext}
     * when the {@link IContextKey} is created.
     * @param description The description of the created context key if provided.
     * @returns A new {@link IContextKey}.
     */
    createContextKey<T extends NonUndefined>(key: string, defaultValue: T | undefined, description?: string): IContextKey<T>;

    /**
     * @description Peek the context value in the {@link IContext} by the given
     * key name.
     * @param key The key name in string form.
     * @returns Returns the context value or undefined if does not exist.
     */
    getContextValue<T>(key: string): T | undefined;

    /**
     * @description Given a context key expression ({@link ContextKeyExpr}), 
     * check if the expression evaluates to true to the current {@link IContext}.
     * @param expression The given context key expression.
     * @returns A boolean indicates the evaluation result.
     */
    contextMatchExpr(expression: ContextKeyExpr | null): boolean;

    /**
     * @description Returns the readonly {@link IContext}.
     */
    getContext(): IReadonlyContext;

    /**
     * @description Returns all the created {@link IContextKey}.
     */
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

    declare _serviceMarker: undefined;

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
            panic('ContextService is already disposed.');
        }
    }
}