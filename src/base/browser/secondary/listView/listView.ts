import { IListViewRow, ListViewCache } from "src/base/browser/secondary/listView/listCache";
import { IListViewRenderer } from "src/base/browser/secondary/listView/listRenderer";
import { ScrollableWidget } from "src/base/browser/secondary/scrollableWidget/scrollableWidget";
import { ScrollbarType } from "src/base/browser/secondary/scrollableWidget/scrollableWidgetOptions";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { DomSize, EventType } from "src/base/common/dom";
import { DomEmitter, Emitter, Register } from "src/base/common/event";
import { ILabellable } from "src/base/common/label";
import { IRange, ISpliceable, Range, RangeTable } from "src/base/common/range";
import { IScrollEvent, Scrollable } from "src/base/common/scrollable";
import { IMeasureable } from "src/base/common/size";

/**
 * The consturtor options for {@link ListView}.
 */
export interface IListViewOpts {
    
    readonly transformOptimization?: boolean;
    readonly mouseWheelScrollSensitivity?: number;
	readonly fastScrollSensitivity?: number;
    readonly reverseMouseWheelDirection?: boolean;
    readonly scrollbarSize?: number

}

/**
 * The type of items are stored in {@link ListView}. 
 * Using a number is faster than a string.
 */
export type ViewItemType = number;

/**
 * The inner data structure wraps each item in {@link ListView}.
 */
export interface IViewItem<T> {
    readonly id: number;
    readonly data: T;
    size: number;
    row: IListViewRow | null; // null means this item is currently not rendered.
    draggable?: IDisposable;
}

export interface IViewItemChangeEvent<T> {
    item: IViewItem<T>;
    index: number;
}

let ListViewItemUUID: number = 0;

/**
 * The interface for {@link ListView}.
 */
export interface IListView<T> extends IDisposable {

    // [events / getter]

    onDidChangeContent: Register<void>;
    onInsertItemInDOM: Register<IViewItemChangeEvent<T>>;
    onUpdateItemInDOM: Register<IViewItemChangeEvent<T>>;
    onRemoveItemInDOM: Register<IViewItemChangeEvent<T>>;

    onDidScroll: Register<IScrollEvent>;
    onDidFocus: Register<void>;
    onDidBlur: Register<void>;

    onClick: Register<MouseEvent>;
    onDoubleclick: Register<MouseEvent>;
    onMouseover: Register<MouseEvent>;
    onMouseout: Register<MouseEvent>;
    onMousedown: Register<MouseEvent>;
    onMouseup: Register<MouseEvent>;
    onMousemove: Register<MouseEvent>;

    length: number;
    DOMelement: HTMLElement;

    // [methods]

    /**
     * @description Renders all the items in the DOM tree.
     * 
     * @param prevRenderRange The render range in the previous render frame.
     * @param renderTop The top of scrolling area.
     * @param renderHeight The height of viewport.
     */
    render(prevRenderRange: IRange, renderTop: number, renderHeight: number): void;

    /**
     * @description Deletes an amount of elements in the list view at the given 
     * index, if necessary, inserts the provided items after the given index.
     * 
     * @param index The given index.
     * @param deleteCount The amount of items to be deleted.
     * @param items The items to be inserted.
     */
    splice(index: number, deleteCount: number, items: T[]): T[];

    /**
     * @description Updates the position (top) and attributes of an item in the 
     * DOM tree by the index.
     * 
     * @param index The index of the item.
     */
    updateItemInDOM(index: number): void;

    /**
     * @description Inserts an item in the DOM tree by the index. If 
     * `insertBefore` provided, we insert the new HTMLElement before it.
     * 
     * @param index The index of the item.
     * @param insertBefore The HTMLElement to be insert before.
     * @param row Provided row.
     */
    insertItemInDOM(index: number, insertBefore: HTMLElement | null, row?: IListViewRow): void;

    /**
     * @description Removes an item from the DOM tree by the index.
     * @param index The index of the item.
     */
    removeItemInDOM(index: number): void;

    // [Scroll Related Methods]

    /**
     * @description Sets the viewport size of the list view.
     * @param size The size of viewport.
     */
    setViewportSize(size: number): void;

    /**
     * @description Sets the scrollable position (top) of the list view.
     * @param position 
     */
    setScrollPosition(position: number): void;

    /**
     * @description Returns the viewport size of the list view.
     */
    getViewportSize(): number;

    /**
     * @description Returns the scrollable position (top) of the list view.
     */
    getScrollPosition(): number;

    // [Item Related Methods]

    /**
     * @description Returns the item at given index.
     * @param index The index of the item.
     */
    getItem(index: number): T;

    /**
     * @description Returns the HTMLElement of the item at given index, null if
     * the item is not rendered yet.
     * @param index The index of the item.
     */
    getElement(index: number): HTMLElement | null;
    
    /**
     * @description Returns the height of the item in DOM.
     * @param index The index of the item.
     */
    getItemHeight(index: number): number;

    /**
     * @description Returns the DOM's position of the item with the given index
     * relatives to the viewport. If the item is not *entirely* visible in the 
     * viewport, -1 will be returned.
     * @param index The index of the item.
     */
    getItemRenderTop(index: number): number;

    /**
     * @description Returns the item's DOM position (top) given the index 
     * relatives to the scrollable size.
     * @param index The index of the item.
     */
    positionAt(index: number): number;

    /**
     * @description Returns the item's index given the DOM position.
     * @param position The DOM's position (top) relatives to the scrollable size.
     */
    indexAt(position: number): number;

    /**
     * @description Returns the item's index given the visible DOM position.
     * @param visiblePosition The DOM's position (top) relatives to the viewport.
     */
    renderIndexAt(visiblePosition: number): number;

    /**
	 * @description Returns the index of the item which has an index after the 
     * item with the given position.
	 * @param position The DOM's position (top) relatives to the scrollable size.
	 */
    indexAfter(position: number): number;

    /**
     * @description Returns the index of the item which has an index after the
     * item with the given visible DOM position.
     * @param visiblePosition The DOM's position (top) relatives to the viewport.
     */
    renderIndexAfter(visiblePosition: number): number;
}

/**
 * @class A virtual vertical scrolling engine that only renders the items within
 * its viewport. It can hold a large amount of items and still has a great 
 * performance. Built on top of {@link ScrollableWidget}.
 * 
 * Provided renderers are responsible for rendering each item with corresponding 
 * type (each item is {@link ILabellable}).
 * 
 * The performance mainly affects by how the renderers work.
 * 
 * Functionalities:
 *  - Vertical scrolling
 *  - performant template-based rendering
 *  - mouse support
 */
export class ListView<T extends IMeasureable & ILabellable<ViewItemType>> implements IDisposable, ISpliceable<T>, IListView<T> {

    // [fields]

    private disposables: DisposableManager = new DisposableManager();

    private element: HTMLElement;
    private listContainer: HTMLElement;

    private scrollable: Scrollable;
    private scrollableWidget: ScrollableWidget;

    private rangeTable: RangeTable;

    private renderers: Map<ViewItemType, IListViewRenderer>;
    
    private items: IViewItem<T>[];
    private cache: ListViewCache;

    private prevRenderTop: number;
    private prevRenderHeight: number;

    private _splicing: boolean;

    // [events]

    private _onDidChangeContent: Emitter<void> = this.disposables.register(new Emitter<void>());
    public onDidChangeContent: Register<void> = this._onDidChangeContent.registerListener;

    private _onInsertItemInDOM: Emitter<IViewItemChangeEvent<T>> = this.disposables.register(new Emitter<IViewItemChangeEvent<T>>());
    public onInsertItemInDOM: Register<IViewItemChangeEvent<T>> = this._onInsertItemInDOM.registerListener;

    private _onUpdateItemInDOM: Emitter<IViewItemChangeEvent<T>> = this.disposables.register(new Emitter<IViewItemChangeEvent<T>>());
    public onUpdateItemInDOM: Register<IViewItemChangeEvent<T>> = this._onUpdateItemInDOM.registerListener;

    private _onRemoveItemInDOM: Emitter<IViewItemChangeEvent<T>> = this.disposables.register(new Emitter<IViewItemChangeEvent<T>>());
    public onRemoveItemInDOM: Register<IViewItemChangeEvent<T>> = this._onRemoveItemInDOM.registerListener;

    // updateItemInDOM

    // [getter / setter]

    get onDidScroll(): Register<IScrollEvent> { return this.scrollableWidget.onDidScroll; }
    get onDidFocus(): Register<void> { return this.disposables.register(new DomEmitter<void>(this.listContainer, EventType.focus)).registerListener; }
    get onDidBlur(): Register<void> { return this.disposables.register(new DomEmitter<void>(this.listContainer, EventType.blur)).registerListener; }
    
    get onClick(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.listContainer, EventType.click)).registerListener; }
    get onDoubleclick(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.listContainer, EventType.doubleclick)).registerListener; }
    get onMouseover(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.listContainer, EventType.mouseover)).registerListener; }
    get onMouseout(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.listContainer, EventType.mouseout)).registerListener; }
    get onMousedown(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.listContainer, EventType.mousedown)).registerListener; }
    get onMouseup(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.listContainer, EventType.mouseup)).registerListener; }
    get onMousemove(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.listContainer, EventType.mousemove)).registerListener; }

    get length(): number { return this.items.length; }
    get DOMelement(): HTMLElement { return this.listContainer; }

    // [constructor]

    constructor(container: HTMLElement, renderers: IListViewRenderer[], opts: IListViewOpts) {
        this.element = document.createElement('div');
        this.element.className = 'list-view';

        this.items = [];
        this.rangeTable = new RangeTable();
        this.prevRenderTop = 0;
        this.prevRenderHeight = 0;
        this._splicing = false;

        this.listContainer = document.createElement('div');
        this.listContainer.className = 'list-view-container';
        if (opts.transformOptimization) {
            // see https://www.afasterweb.com/2017/07/27/optimizing-repaints/
            this.listContainer.style.transform = 'translate3d(0px, 0px, 0px)';
        }
        
        this.scrollable = new Scrollable(
            opts.scrollbarSize ? opts.scrollbarSize : 10,
            DomSize.getContentHeight(container),
            0,
            0
        );

        this.scrollableWidget = new ScrollableWidget(this.scrollable, {
            mouseWheelScrollSensibility: opts.mouseWheelScrollSensitivity,
            mouseWheelFastScrollSensibility: opts.fastScrollSensitivity,
            reverseMouseWheelDirection: opts.reverseMouseWheelDirection,
            scrollbarType: ScrollbarType.vertical,
        });
        this.scrollableWidget.render(this.element);
        this.scrollableWidget.onDidScroll((e: IScrollEvent) => {
            if (this._splicing === false) {
                this.__onDidScroll();
            }
        });

        this.renderers = new Map();
        for (let renderer of renderers) {
            this.renderers.set(renderer.type, renderer);
        }

        this.cache = new ListViewCache(this.renderers);

        this.element.appendChild(this.listContainer);
        container.appendChild(this.element);

        this.disposables.register(this.scrollable);
        this.disposables.register(this.scrollableWidget);
        this.disposables.register(this.cache);
    }

    // [methods]

    public dispose(): void {
        this.disposables.dispose();
    }

    public render(prevRenderRange: IRange, renderTop: number, renderHeight: number): void {
        const renderRange = this.__getRenderRange(renderTop, renderHeight);

        const insert = Range.relativeComplement(prevRenderRange, renderRange);
        const remove = Range.relativeComplement(renderRange, prevRenderRange);
        const update = Range.intersection(prevRenderRange, renderRange);

        // update items
        for (let i = update.start; i < update.end; i++) {
            this.updateItemInDOM(i);
        }
    
        /**
         * try to get the next element in the given range, so we can insert our 
         * new elements before it one by one.
         */
        const insertBefore = this.__getNextElement(insert);

        // insert items
        for (const range of insert) {
            for (let i = range.start; i < range.end; i++) {
                this.insertItemInDOM(i, insertBefore);
            }
        }

        // remove items
        for (const range of remove) {
            for (let i = range.start; i < range.end; i++) {
                this.removeItemInDOM(i);
            }
        }

        this.listContainer.style.top = -renderTop + 'px';
        this.prevRenderTop = renderTop;
        this.prevRenderHeight = renderHeight;
    }

    public splice(index: number, deleteCount: number, items: T[] = []): T[] {
        
        /**
         * @readonly Note that `splice()` will do some specific optimization on
         * DOM elements creation process (using cache). Using a 
         */
        this._splicing = true;

        const prevRenderRange = this.__getRenderRange(this.prevRenderTop, this.prevRenderHeight);
        const deleteRange = Range.intersection(prevRenderRange, { start: index, end: index + deleteCount });

        /**
         * We use a cache to store all the `row`s that are about to be removed.
         * When we do the insertion, we try to reuse these `row`s to improve 
         * efficiency.
         */
        const deleteCache = new Map<ViewItemType, IListViewRow[]>();
        for (let i = deleteRange.start; i < deleteRange.end; i++) {
            const item = this.items[i]!;

            if (item.row) {
                let rowCache = deleteCache.get(item.data.type);

                if (rowCache === undefined) {
                    rowCache = [];
                    deleteCache.set(item.data.type,rowCache);
                }

                const renderer = this.renderers.get(item.data.type);
                if (renderer) {
                    renderer.dispose(item.row.dom);
                }

                rowCache.push(item.row);
                item.row = null;
            }
        }

        // the rest ranges after the delete ranges
        const prevRestRange = { start: index + deleteCount, end: this.items.length };
        // in the rest ranges, find the rendered part
        const prevRestRenderedRange = Range.intersection(prevRestRange, prevRenderRange);
        // in the rest ranges, find the unrendered part
        const prevRestUnrenderedRange = Range.relativeComplement(prevRenderRange, prevRestRange);

        // [delete and insert the items]

        const insert = items.map<IViewItem<T>>(item => ({
            id: ListViewItemUUID++,
            type: item.type,
            data: item,
            size: item.size,
            row: null,
        }));

        let waitToDelete: IViewItem<T>[];
        if (index === 0 && deleteCount >= this.items.length) {
            // special case: deletes all the items
            this.rangeTable = new RangeTable();
            this.rangeTable.splice(0, 0, insert);
            waitToDelete = this.items;
            this.items = insert;
        } else {
            // general case: deletes some items
            this.rangeTable.splice(index, deleteCount, insert);
            waitToDelete = this.items.splice(index, deleteCount, ...insert);
        }
        
        // updates the previous render top and height.
        this.scrollable.setScrollSize(this.rangeTable.size());
        this.prevRenderTop = this.scrollable.getScrollPosition();
        this.prevRenderHeight = this.scrollable.getViewportSize();
        
        const offset = items.length - deleteCount;

        // recalcualte the render range (since we have modifed the range table)
        const renderRange = this.__getRenderRange(this.prevRenderTop, this.prevRenderHeight);
        
        // find the rest items that are still required rendering, we update them in DOM
        const restRenderedRange = Range.shift(prevRestRenderedRange, offset);
        const update = Range.intersection(renderRange, restRenderedRange);
        for (let i = update.start; i < update.end; i++) {
            this.updateItemInDOM(i);
        }

        // find the rest items that does not require rendering anymore, we remove them from DOM
        const remove = Range.relativeComplement(renderRange, restRenderedRange);
        remove.forEach(range => {
            for (let i = range.start; i < range.end; i++) {
                this.removeItemInDOM(i);
            }
        });

        /**
         * find the rest items that was not rendered, inserting new items in DOM 
         * if deleting more items than inserting new items, that is, `offset < 0`.
         * When inserting a new item into the DOM, we try to reuse a row cache 
         * from previous deleted DOM elements.
         */
        const restUnrenderedRange = prevRestUnrenderedRange.map(range => Range.shift(range, offset));
        const elementsRange = { start: index, end: index + items.length };
		const insertRanges = [elementsRange, ...restUnrenderedRange].map(range => Range.intersection(renderRange, range));
		const beforeElement = this.__getNextElement(insertRanges);
        for (const range of insertRanges) {
			for (let i = range.start; i < range.end; i++) {
				const item = this.items[i]!;
				const rows = deleteCache.get(item.data.type);
				const row = rows?.pop();
				this.insertItemInDOM(i, beforeElement, row);
			}
		}

        // now we release all the deleted rows into caches.
		for (const rows of deleteCache.values()) {
			for (const row of rows) {
				this.cache.release(row);
			}
		}

        this._onDidChangeContent.fire();
        this._splicing = false;

        return waitToDelete.map(item => item.data);
    }
    
    public updateItemInDOM(index: number): void {
        const item = this.items[index]!;

        const dom = item.row!.dom;
        dom.style.top = this.positionAt(index) + 'px';
        dom.setAttribute('index', `${index}`);

        this._onUpdateItemInDOM.fire({ item: item, index: index });
    }

    public insertItemInDOM(index: number, insertBefore: HTMLElement | null, row?: IListViewRow): void {
        const item = this.items[index]!;
        
        if (item.row === null) {
            if (row) {
                item.row = row;
            } else {
                item.row = this.cache.get(item.data.type, item.data);
            }
        }

        this.updateItemInDOM(index);

        const renderer = this.renderers.get(item.data.type);
        if (renderer === undefined) {
            throw new Error(`no renderer provided for the given type: ${item.data.type}`);
        }

        renderer.update(item.row!.dom, index, item.data);
        this._onInsertItemInDOM.fire({ item: item, index: index });

        if (insertBefore) {
            this.listContainer.insertBefore(item.row!.dom, insertBefore);
        } else {
            this.listContainer.appendChild(item.row!.dom);
        }
    }

    public removeItemInDOM(index: number): void {
        const item = this.items[index]!;

        if (item.row) {
            const renderer = this.renderers.get(item.data.type);

            if (renderer) {
                renderer.dispose(item.row.dom);
            }
    
            this.cache.release(item.row);
            item.row = null;
        }

        this._onRemoveItemInDOM.fire({ item: item, index: index });
    }

    public setViewportSize(size: number): void {
        this.scrollable.setViewportSize(size);
    }

    public setScrollPosition(position: number): void {
        this.scrollable.setScrollPosition(position);
    }

    public getViewportSize(): number {
        return this.scrollable.getViewportSize();
    }

    public getScrollPosition(): number {
        return this.scrollable.getScrollPosition();
    }

    public getItem(index: number): T {
        if (index < 0 || index >= this.items.length) {
            throw new ListError(`invalid get item index: ${index}`);
        }
        return this.items[index]!.data;
    }

    public getElement(index: number): HTMLElement | null {
        if (index < 0 || index >= this.items.length) {
            throw new ListError(`invalid get item index: ${index}`);
        }
        if (this.items[index]!.row) {
            return this.items[index]!.row!.dom;
        }
        return null;
    }
    
    public getItemHeight(index: number): number {
        const item = this.getItem(index);
        return item.size;
    }

    public getItemRenderTop(index: number): number {
        const itemTop = this.positionAt(index);
        const itemHeight = this.getItemHeight(index);
        
        const scrollTop = this.scrollable.getScrollPosition();
        const viewHeight = this.scrollable.getViewportSize();

        if (itemTop < scrollTop || itemTop + itemHeight > scrollTop + viewHeight) {
            return -1;
        }

        const rest = itemTop - scrollTop;
        return rest;
    }

    public positionAt(index: number): number {
        return this.rangeTable.positionAt(index);
    }

    public indexAt(position: number): number {
        return this.rangeTable.indexAt(position);
    }

    public renderIndexAt(visiblePosition: number): number {
        return this.rangeTable.indexAt(this.prevRenderTop + visiblePosition);
    }

    public indexAfter(position: number): number {
        return this.rangeTable.indexAfter(position);
    }

    public renderIndexAfter(visiblePosition: number): number {
        return this.rangeTable.indexAfter(this.prevRenderTop + visiblePosition);
    }

    // [private helper methods]

    /**
     * @description Try to get the next element in the given range list.
     * @param range The range list.
     * @returns The next element in the range or null if the range already 
     * reaches the end.
     * 
     * @example Suppose the range table has range [0-100], the given range is 
     * [0-50], the 50th HTMLElement will be returned. Null will be returned if 
     * the given range is something like [x-100].
     */
    private __getNextElement(range: IRange[]): HTMLElement | null {
        const lastRange = range[range.length - 1];

        if (lastRange === undefined) {
            return null;
        }

        const nextItem = this.items[lastRange.end];

        if (nextItem === undefined || nextItem.row === null) {
            return null;
        }

        return nextItem.row.dom;
    }

    /**
     * @description Returns a range for rendering.
     * 
     * @note If render top and render height are not provided, returns a render 
     * range under the current scrollable status.
     * 
     * @returns A range for rendering.
     */
    private __getRenderRange(renderTop?: number, renderHeight?: number): IRange {
        const top = renderTop ?? this.scrollable.getScrollPosition();
        const height = renderHeight ?? this.scrollable.getViewportSize();
        return {
            start: this.rangeTable.indexAt(top),
            end: this.rangeTable.indexAfter(top + height - 1)
        };
    }

    /**
     * @description Invokes when scrolling happens, rerenders the whole view.
     */
    private __onDidScroll(): void {
        const prevRenderRange = this.__getRenderRange(this.prevRenderTop, this.prevRenderHeight);
        this.render(prevRenderRange, this.scrollable.getScrollPosition(), this.scrollable.getViewportSize());
    }

}

/**
 * @class Type of {@link Error} used in {@link ListView} and {@link ListWidget}.
 */
export class ListError extends Error {
    constructor(message: string) {
        super('ListError: ' + message);
    }
}