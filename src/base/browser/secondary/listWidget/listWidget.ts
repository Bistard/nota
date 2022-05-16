import { IListViewRenderer, PipelineRenderer } from "src/base/browser/secondary/listView/listRenderer";
import { IListViewOpts, IViewItem, IViewItemChangeEvent, ListError, ListView } from "src/base/browser/secondary/listView/listView";
import { IListTraitEvent, ListTrait, ListTraitRenderer } from "src/base/browser/secondary/listWidget/listTrait";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { addDisposableListener, EventType } from "src/base/common/dom";
import { Event, Register, SignalEmitter } from "src/base/common/event";
import { IScrollEvent } from "src/base/common/scrollable";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { ListWidgetDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";

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

export interface IListDragEvent<T> {
    /** The original brower event {@link DragEvent}. */
    browserEvent: DragEvent;

    /** The index of the drag / dragover / drop item. */
    index: number;
    
    /** The drag / dragover / drop item. */
    item: T;
}

/**
 * The consturtor options for {@link ListWidget}.
 */
export interface IListWidgetOpts<T> extends IListViewOpts<T> {
    // TODO
}

// TODO: method comments
/**
 * The interface for {@link ListWidget}.
 */
export interface IListWidget<T> extends IDisposable {
    
    // [events / getter]
    
    DOMElement: HTMLElement;
    length: number;
    onDidScroll: Register<IScrollEvent>;
    onDidChangeFocus: Register<boolean>;
    onDidChangeItemFocus: Register<IListTraitEvent>;
    onDidChangeItemSelection: Register<IListTraitEvent>;
    onClick: Register<IListMouseEvent<T>>;
    onDoubleclick: Register<IListMouseEvent<T>>;
    onMouseover: Register<IListMouseEvent<T>>;
    onMouseout: Register<IListMouseEvent<T>>;
    onMousedown: Register<IListMouseEvent<T>>;
    onMouseup: Register<IListMouseEvent<T>>;
    onMousemove: Register<IListMouseEvent<T>>;

    // [methods]

    rerender(): void;

    splice(index: number, deleteCount: number, items: T[]): T[];

    // [item traits support]

    toggleFocus(index: number): void;

    toggleSelection(index: number): void;

    /**
     * @description Returns all the selected items.
     */
    getSelections(): T[];

    /**
     * @description Returns the focused item.
     */
    getFocus(): T;
}

/**
 * @class A {@link ListWidget} is built on top of {@link ListView}, with extra 
 * features.
 * 
 * Extra Functionalities:
 *  - focus support
 *  - selection support
 *  - drag and drop support
 */
export class ListWidget<T> implements IListWidget<T> {

    // [fields]

    private disposables: DisposableManager;
    private view: ListView<T>;

    private selected: ListTrait;
    private focused: ListTrait;

    // [constructor]

    constructor(
        container: HTMLElement,
        renderers: IListViewRenderer<any, any>[],
        itemProvider: IListItemProvider<T>, 
        opts: IListWidgetOpts<T>
    ) {
        this.disposables = new DisposableManager();

        // initializes all the item traits
        this.selected = new ListTrait('selected');
        this.focused = new ListTrait('focused');

        // integrates all the renderers
        const baseRenderers = [new ListTraitRenderer(this.selected), new ListTraitRenderer(this.focused)];
        renderers = renderers.map(renderer => new PipelineRenderer(renderer.type, [...baseRenderers, renderer]));
        
        // dnd support
        if (opts.dragAndDropProvider) {
            opts.dragAndDropProvider = new ListWidgetDragAndDropProvider<T>(this, opts.dragAndDropProvider);
        }

        // construct list view
        this.view = new ListView(container, renderers, itemProvider, opts);

        if (opts.dragAndDropProvider) {
            this.__enableDragAndDropSupport();
        }

        this.disposables.register(this.view);
    }

    // [getter / setter]

    get DOMElement(): HTMLElement { return this.view.DOMElement; }
    get length(): number { return this.view.length; }

    get onDidScroll(): Register<IScrollEvent> { return this.view.onDidScroll; }
    get onDidChangeFocus(): Register<boolean> { return this.disposables.register(new SignalEmitter<boolean, boolean>([Event.map(this.view.onDidFocus, () => true), Event.map(this.view.onDidBlur, () => false)], (e: boolean) => e)).registerListener; }
    get onDidChangeItemFocus(): Register<IListTraitEvent> { return this.focused.onDidChange; }
    get onDidChangeItemSelection(): Register<IListTraitEvent> { return this.selected.onDidChange; }

    get onClick(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onClick, (e: MouseEvent) => this.__toListMouseEvent(e)); }    
    get onDoubleclick(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onDoubleclick, (e: MouseEvent) => this.__toListMouseEvent(e));  }    
    get onMouseover(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMouseover, (e: MouseEvent) => this.__toListMouseEvent(e)); }    
    get onMouseout(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMouseout, (e: MouseEvent) => this.__toListMouseEvent(e)); }    
    get onMousedown(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMousedown, (e: MouseEvent) => this.__toListMouseEvent(e)); }    
    get onMouseup(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMouseup, (e: MouseEvent) => this.__toListMouseEvent(e)); }    
    get onMousemove(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMousemove, (e: MouseEvent) => this.__toListMouseEvent(e)); }
    
    // [methods]

    public dispose(): void {
        this.disposables.dispose();
    }

    public rerender(): void {
        this.view.rerender();
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

    public toggleFocus(index: number): void {
        const element = this.view.getElement(index);
        
        // unfocused the current item
        if (this.focused.size() === 1) {
            const currIndex = this.focused.items()[0]!;

            if (currIndex === index) return;

            const currElement = this.view.getElement(currIndex);
            this.focused.unset(currIndex, currElement, false); // prevent fire twice
        }
        // focus the new item
        this.focused.set(index, element);
    }

    public toggleSelection(index: number): void {
        const element = this.view.getElement(index);

        if (this.selected.has(index) === true) {
            this.selected.unset(index, element, false); // prevent fire twice
            return;
        }

        this.selected.set(index, element);
    }

    public getFocus(): T {
        const index = this.focused.items()[0]!;
        return this.view.getItem(index);
    }

    public getSelections(): T[] {
        const indices = this.selected.items();
        return indices.map(i => this.view.getItem(i));
    }

    // [private helper methods]

    /**
     * @description A simple helper to test index validity in {@link ListView}.
     * @param index The given index of the item.
     */
    // TODO: unused for now
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

    /**
     * @description Enables the drag and drop (dnd) support in {@link ListView}.
     */
    private __enableDragAndDropSupport(): void {

        // only adding 4 listeners to the whole view, 
        this.disposables.register(addDisposableListener(this.view.DOMElement, EventType.dragover, e => this.__onDragOver(this.__toListDragEvent(e))));
        this.disposables.register(addDisposableListener(this.view.DOMElement, EventType.drop, e => this.__onDrop(this.__toListDragEvent(e))));
        this.disposables.register(addDisposableListener(this.view.DOMElement, EventType.dragleave, e => this.__onDragleave(this.__toListDragEvent(e))));
        this.disposables.register(addDisposableListener(this.view.DOMElement, EventType.dragend, e => this.__onDragend(this.__toListDragEvent(e))));

        // dragstart listener
        this.view.onInsertItemInDOM((viewItem: IViewItemChangeEvent<T>) => this.__initItemWithDragStart(viewItem.item, viewItem.index));
        this.view.onRemoveItemInDOM((viewItem: IViewItemChangeEvent<T>) => {
            viewItem.item.dragStart?.dispose();
        });

    }

    /**
     * @description Transforms a {@link DragEvent} into {@link IListDragEvent}.
     * @param event The provided original drag event.
     * @returns The transformed event.
     */
    private __toListDragEvent(event: DragEvent): IListDragEvent<T> {
        const index = this.view.renderIndexAt(event.clientY);
        const item = this.view.getItem(index);
        return {
            browserEvent: event,
            index: index, 
            item: item
        }
    }

    /**
     * @description Initializes the dragstart event listener of the given list 
     * item.
     * @param item The given item.
     * @param index The index of the item in the list view.
     */
    private __initItemWithDragStart(item: IViewItem<T>, index: number): void {
        
        // avoid weird stuff happens
        if (item.dragStart) {
            item.dragStart.dispose();
        }

        // get the drag data
        const dnd = this.view.getDnd();
        const userData = dnd.getDragData(item.data);

        // make the HTMLElement actually draggable
        item.row!.dom.draggable = !!userData;

        // add event listener
        if (userData) {
            item.dragStart = addDisposableListener(item.row!.dom, EventType.dragstart, (e: DragEvent) => this.__onDragStart(item.data, e));
        }
    }

    /**
     * @description Invokes when the user starts to drag.
     * @param data The corresponding data of the dragging item.
     * @param event The {@link DragEvent}.
     */
    private __onDragStart(data: T, event: DragEvent): void {
        
        if (event.dataTransfer === null) {
            return;
        }

        // TODO...

        const dnd = this.view.getDnd();
        if (dnd.onDragStart) {
            dnd.onDragStart();
        }
    }

    /**
     * @description When dnd support is on, invokes when dragging something over
     * the whole {@link IListWidget}.
     * @param event The dragging event.
     */
    private __onDragOver(event: IListDragEvent<T>): void {
        
        // // https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome
        event.browserEvent.preventDefault();

        console.log(event.index);

    }

    /**
     * @description When dnd support is on, invokes when drops something over
     * the whole {@link IListWidget}.
     * @param event The dragging event.
     */
    private __onDrop(event: IListDragEvent<T>): void {
        // console.log('drop, ', event.index);
    }

    /**
     * @description When dnd support is on, invokes when dragging something leave
     * the whole {@link IListWidget}.
     * @param event The dragging event.
     */
    private __onDragleave(event: IListDragEvent<T>): void {
        // console.log('dragleave, ', event.index);
    }

    /**
     * @description When dnd support is on, invokes when the dragging ends inside 
     * the whole {@link IListWidget}.
     * @param event The dragging event.
     */
    private __onDragend(event: IListDragEvent<T>): void {
        // console.log('dragend, ', event.index);
    }

}
