import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { isNullable, isNumber, isString, Mutable } from "src/base/common/util/type";

export interface IAction extends IDisposable {
    /** 
     * The ID of the action.
     */
    readonly id: string;
    
    /**
     * The tips fo the action (description).
     */
    readonly tip?: string;

    /**
     * If the action is enabled.
     */
    enabled: boolean;
    
    /**
     * Try to run the action if enabled.
     * @param args The arguments passed for the action.
     */
    run(args?: any): unknown;
}

export interface IActionOptions {
    readonly id: string;
    readonly enabled: boolean;
    readonly tip?: string;
    readonly callback: Function;
}

/**
 * @class An {@link Action} is more lightweight, flexible than a {@link Command}.
 * Essentially acts like a wrapper over a callback.
 */
export class Action implements IAction {

    // [fields]

    public readonly id: string;
    public readonly tip?: string;
    public enabled: boolean;
    
    private readonly _callback: Function;
    
    // [constructor]

    constructor(opts: IActionOptions) {
        this.id = opts.id;
        this.enabled = opts.enabled;
        this._callback = opts.callback;
    }

    // [public methods]

    public run(...args: any): void {
        if (this.enabled) {
            this._callback(...args);
        }
    }

    public dispose(): void {
        // noop
    }
}

export interface IActionRunEvent {
    readonly action: IAction;
    readonly error?: Error;
}

/**
 * An interface only for {@link ActionList}.
 */
export interface IActionList<IItem extends IActionListItem> extends IDisposable {
    onDidInsert: Register<IItem[]>;
    onBeforeRun: Register<IActionRunEvent>;
    onDidRun: Register<IActionRunEvent>;

    run(index: number): void;
    run(id: string): void;
    run(action: IAction): void;

    get(index: number): IAction | undefined;
    get(id: string): IAction | undefined;
    
    has(id: string): boolean;
    has(action: IAction): boolean;
    
    insert(action: IAction[], index?: number): void;
    insert(action: IAction, index?: number): void;
    
    delete(index: number): boolean;
    delete(id: string): boolean;
    delete(action: IAction): boolean;

    size(): number;
    empty(): boolean;
}

/**
 * Interface for {@link ActionListItem}.
 */
export interface IActionListItem extends IDisposable {
    readonly action: IAction;
    run(context: unknown): void;
}

/**
 * @class A wrapper that wraps over a {@link IAction} so that it can be stored
 * inside a {@link ActionList}. 
 * @note The item owns the {@link IAction} (shares the lifecycle).
 */
export class ActionListItem extends Disposable implements IActionListItem {

    // [fields]

    public readonly action: IAction;

    // [constructor]

    constructor(action: IAction) {
        super();
        this.action = this.__register(action);
    }

    // [public methods]

    public run(context: unknown): void {
        this.action.run(context);
    }
}

export interface IContextProvider {
    /**
     * Retrieve the latest context.
     */
    (): unknown;
}

/**
 * Construction options for {@link ActionList}.
 */
export interface IActionListOptions {
    
    /**
     * A callback that always return the latest context of the current 
     * {@link ActionList}. It will be the global context with respects to all 
     * the stored {@link IActionListItem}s.
     */
    readonly contextProvider: IContextProvider;
}

/**
 * @class An abstraction container that contains a list of {@link IAction}s 
 * using wrapper {@link IItem}.
 * 
 * @note The client may run the given {@link IAction} by given certain context.
 * @note The {@link IItem} shares the same lifetime as the action list.
 */
export abstract class ActionList<IItem extends IActionListItem> extends Disposable implements IActionList<IItem> {

    // [fields]

    protected readonly _items: IItem[];
    protected readonly _contextProvider: () => unknown;

    // [event]

    private readonly _onDidInsert = this.__register(new Emitter<IItem[]>());
    public readonly onDidInsert = this._onDidInsert.registerListener;

    private readonly _onBeforeRun = this.__register(new Emitter<IActionRunEvent>());
    public readonly onBeforeRun = this._onBeforeRun.registerListener;

    private readonly _onDidRun = this.__register(new Emitter<IActionRunEvent>());
    public readonly onDidRun = this._onDidRun.registerListener;
    
    // [constructor]

    constructor(opts: IActionListOptions) {
        super();
        this._items = [];
        this._contextProvider = opts.contextProvider;
        // note: do not access the context at the construction stage
    }

    // [public methods]

    public run(index: number): void;
    public run(action: IAction): void;
    public run(id: string): void;
    public run(arg: IAction | number | string): void {
        const ctx = this._contextProvider();
        
        let action: IAction | undefined;

        if (isNumber(arg)) {
            action = this._items[arg]?.action;
        }
        
        else {
            const id = isString(arg) ? arg : arg.id;
            action = this.get(id);
        }

        if (!action) {
            return;
        }

        (async () => {
            this._onBeforeRun.fire({ action: action });
            
            let err: Error | undefined;
            try {
                await action.run(ctx);
            } catch (err: any) {
                err = err;
            }

            this._onDidRun.fire({ action: action, error: err });
        })();
    }

    public get(index: number): IAction | undefined;
    public get(id: string): IAction | undefined;
    public get(arg: number | string): IAction | undefined {
        if (isNumber(arg)) {
            return this._items[arg]?.action;
        }
        for (const curr of this._items) {
            if (curr.action.id === arg) {
                return curr.action;
            }
        }
        return undefined;
    }
    
    public has(id: string): boolean;
    public has(action: IAction): boolean;
    public has(arg: IAction | string): boolean {
        const id = isString(arg) ? arg : arg.id;
        for (const curr of this._items) {
            if (curr.action.id === id) {
                return true;
            }
        }
        return false;
    }

    public insert(arg: IAction, index?: number): void;
    public insert(arg: IAction[], index?: number): void;
    public insert(arg: IAction | IAction[], index?: number): void {
        const actions = Array.isArray(arg) ? [...arg] : [arg];
        const items: IItem[] = [];

        for (const action of actions) {
            const item = this.createItemImpl(action);
            items.push(item);
        
            if (isNullable(index)) {
                this._items.push(item);
                continue;
            }

            this._items.splice(index, 0, item);
            index++;
        }

        /**
         * Tells the client we just created the item and let them do 
         * whatever they need to do.
         */
        this._onDidInsert.fire(items);
    }

    public delete(index: number): boolean;
    public delete(id: string): boolean;
    public delete(action: IAction): boolean;
    public delete(arg: IAction | number | string): boolean {
        if (isNumber(arg)) {
            const deleted = this._items.splice(arg, 1);
            return !!deleted.length;
        }

        const id = isString(arg) ? arg : arg.id;
        for (let i = 0; i < this._items.length; i++) {
            const item = this._items[i]!;
            if (item.action.id === id) {
                this._items.splice(i, 1);
                return true;
            }
        }
        
        return false;
    }

    public size(): number {
        return this._items.length;
    }

    public empty(): boolean {
        return !this._items.length;
    }

    public override dispose(): void {
        super.dispose();
        this._items.forEach(item => item.dispose());
        (<Mutable<IItem[]>>this._items) = [];
    }

    // [protected override method]

    /**
     * @description Depends on the given {@link IAction}, the inheritance 
     * decides how to construct {@link IItem}.
     * 
     * @note Should be implemented by the inheritance.
     * @note The newly created item running environment will be automatically 
     * bind to the current context.
     * @param action The given action.
     * @returns A newly created item.
     */
    protected abstract createItemImpl(action: IAction): IItem;
}