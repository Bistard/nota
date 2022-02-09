import { IListViewRenderer } from "src/base/browser/secondary/listView/listRenderer";
import { IListViewOpts, ListError, ListView, ViewItemType } from "src/base/browser/secondary/listView/listView";
import { DisposableManager, disposeAll, IDisposable } from "src/base/common/dispose";
import { Emitter, Event, Register } from "src/base/common/event";
import { ILabellable } from "src/base/common/label";
import { IScrollEvent } from "src/base/common/scrollable";
import { IMeasureable } from "src/base/common/size";

/**
 * A standard mouse event interface used in {@link ListWidget}.
 */
export interface IListMouseEvent<T> {
    /** The original brower event {@link MouseEvent}. */
    browserEvent: MouseEvent,

    /** The index of the clicked item. */
    index: number,

    /** The clicked item. */
    item: T,

    /** The position (top) relatives to the viewport. */
    top: number;
}

/**
 * The consturtor options for {@link ListWidget}.
 */
export interface IListWidgetOpts extends IListViewOpts {

}

/**
 * The interface for {@link ListWidget}.
 */
export interface IListWidget<T> extends IDisposable {
    
    // [events / getter]
    
    onDidScroll: Register<IScrollEvent>;
    onClick: Register<IListMouseEvent<T>>;
    onDoubleclick: Register<IListMouseEvent<T>>;
    onMouseover: Register<IListMouseEvent<T>>;
    onMouseout: Register<IListMouseEvent<T>>;
    onMousedown: Register<IListMouseEvent<T>>;
    onMouseup: Register<IListMouseEvent<T>>;
    onMousemove: Register<IListMouseEvent<T>>;

    length: number;

    // [methods]

    splice(index: number, deleteCount: number, items: T[]): T[];

    // [item traits support]

    setFocus(index: number): void;
    unsetFocus(index: number): void;
    setSelection(index: number): void;
    unsetSelection(index: number): void;
}

/**
 * @class A {@link ListWidget} is built on top of {@link ListView}, with extra 
 * features.
 * 
 * Extra Functionalities:
 *  - item traits support (selection / focusing)
 *  - drag and drop support
 */
export class ListWidget<T extends IMeasureable & ILabellable<ViewItemType>> implements IListWidget<T> {

    // [fields]

    private disposables: DisposableManager;
    private view: ListView<T>;

    private selected: ListTrait;
    private focused: ListTrait;

    // [constructor]

    constructor(
        container: HTMLElement,
        renderers: IListViewRenderer[],
        opts: IListWidgetOpts
    ) {
        this.disposables = new DisposableManager();
        
        this.view = new ListView(container, renderers, opts);

        this.selected = new ListTrait('selected');
        this.focused = new ListTrait('focused');

        this.disposables.register(this.view);
    }

    // [getter / setter]

    get length(): number { return this.view.length; }

    get onDidScroll(): Register<IScrollEvent> { return this.view.onDidScroll; }
    
    // TODO: event should be custom `IListMouseEvent`

    get onClick(): Register<IListMouseEvent<T>> { 
        return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onClick, (e: MouseEvent) => this.__toListMouseEvent(e));
    }
    get onDoubleclick(): Register<IListMouseEvent<T>> { 
        return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onDoubleclick, (e: MouseEvent) => this.__toListMouseEvent(e)); 
    }
    get onMouseover(): Register<IListMouseEvent<T>> { 
        return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMouseover, (e: MouseEvent) => this.__toListMouseEvent(e)); 
    }
    get onMouseout(): Register<IListMouseEvent<T>> { 
        return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMouseout, (e: MouseEvent) => this.__toListMouseEvent(e));
    }
    get onMousedown(): Register<IListMouseEvent<T>> { 
        return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMousedown, (e: MouseEvent) => this.__toListMouseEvent(e));
    }
    get onMouseup(): Register<IListMouseEvent<T>> { 
        return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMouseup, (e: MouseEvent) => this.__toListMouseEvent(e));
    }
    get onMousemove(): Register<IListMouseEvent<T>> { 
        return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMousemove, (e: MouseEvent) => this.__toListMouseEvent(e));
    }

    // [methods]

    public dispose(): void {
        this.disposables.dispose();
    }

    public splice(index: number, deleteCount: number, items: T[] = []): T[] {
        if (index < 0 || index > this.view.length) {
            throw new ListError(`splice invalid start index: ${index}`);
        }

        if (deleteCount < 0) {
            throw new ListError(`splice invalid deleteCount: ${deleteCount}`);
        }

        if (deleteCount === 0 && items.length === 0) {
            return [];
        }

        return this.view.splice(index, deleteCount, items);
    }

    // [item traits support]

    public setFocus(index: number): void {
        this.__indexValidity(index);

        const element = this.view.getElement(index);
        if (element) {
            this.focused.set(index, element);
        }
    }

    public unsetFocus(index: number): void {
        this.__indexValidity(index);

        const element = this.view.getElement(index);
        if (element) {
            this.focused.unset(index, element);
        }
    }

    public setSelection(index: number): void {
        this.__indexValidity(index);

        const element = this.view.getElement(index);
        if (element) {
            this.selected.set(index, element);
        }
    }

    public unsetSelection(index: number): void {
        this.__indexValidity(index);

        const element = this.view.getElement(index);
        if (element) {
            this.selected.unset(index, element);
        }
    }

    // [private helper methods]

    /**
     * @description A simple helper to test index validity in {@link ListView}.
     * @param index The given index of the item.
     */
    private __indexValidity(index: number): void {
        if (index < 0 || index >= this.view.length) {
            throw new ListError(`invalid index: ${index}`);
        }
    }

    /**
     * @description A mapper function to convert the brower event to our 
     * standard list mouse event.
     * @param e The original mouse event.
     * @returns A new standard {@link IListMouseEvent}.
     */
    private __toListMouseEvent(e: MouseEvent): IListMouseEvent<T> {
        const index = this.view.renderIndexAt(e.clientY);
        const item = this.view.getItem(index);
        const viewportTop = this.view.getItemRenderTop(index);
        return {
            browserEvent: e,
            index: index,
            item: item,
            top: viewportTop
        };
    }

}

/**
 * @class A {@link ListTrait} implements a set of methods for toggling one type 
 * of the characteristic of items in {@link ListWidget}, such as item selection 
 * and focusing.
 */
export class ListTrait implements IDisposable {

    /**
     * A trait is a string that represents an CSS class.
     */
    public trait: string;

    private _onDidChange: Emitter<void> = new Emitter<void>();
    public onDidChange: Register<void> = this._onDidChange.registerListener;

    private indices: Set<number>;

    constructor(trait: string) {
        this.trait = trait;
        this.indices = new Set();
    }

    /**
     * @description Sets the item with the current trait.
     * @param index The index of the item.
     * @param item The HTMLElement to be rendered.
     */
    public set(index: number, item: HTMLElement): void {
        if (this.indices.has(index)) {
            return;
        }

        this.indices.add(index);
        item.classList.toggle(this.trait, true);

        this._onDidChange.fire();
    }

    /**
     * @description Unsets the item with the current trait.
     * @param index The index of the item.
     * @param item The HTMLElement to be unrendered.
     */
    public unset(index: number, item: HTMLElement): void {
        if (this.indices.has(index) === false) {
            return;
        }

        this.indices.delete(index);
        item.classList.toggle(this.trait, false);
        this._onDidChange.fire();
    }

    public dispose(): void {
        disposeAll([this._onDidChange]);
    }

}
