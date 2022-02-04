import { IListViewRow, ListViewCache } from "src/base/browser/secondary/listView/listCache";
import { IListViewRenderer, ListViewRendererType } from "src/base/browser/secondary/listView/listRenderer";
import { ScrollableWidget } from "src/base/browser/secondary/scrollableWidget/scrollableWidget";
import { ScrollbarType } from "src/base/browser/secondary/scrollableWidget/scrollableWidgetOptions";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { DOMSize } from "src/base/common/dom";
import { Emitter, Register } from "src/base/common/event";
import { IRange, ISpliceable, Range, RangeTable } from "src/base/common/range";
import { IScrollEvent, Scrollable } from "src/base/common/scrollable";
import { IMeasureable } from "src/base/common/size";

export interface IListViewOpts {
    
    readonly transformOptimization?: boolean;
    readonly mouseWheelScrollSensitivity?: number;
	readonly fastScrollSensitivity?: number;
    readonly reverseMouseWheelDirection?: boolean;
    readonly scrollbarSize?: number

}

export type ViewItemType = number;

export interface IViewItem<T> {
    readonly id: number;
    readonly type: ViewItemType;
    readonly element: T;
    size: number;
    row: IListViewRow | null; // null means this item is currently not rendered.
}

export interface IListView<T> {

    onDidScroll: Register<IScrollEvent>;

    dispose(): void;

    render(prevRenderRange: IRange, renderTop: number, renderHeight: number): void;

}

let ListViewItemUUID: number = 0;

/**
 * @class A virtual vertical scrolling engine that only renders the items within
 * its viewport. It can hold a large amount of items and still has a great 
 * performance.
 * 
 * The performance mainly affects by how the renderers work.
 */
export class ListView<T extends IMeasureable> implements IDisposable, ISpliceable<T> {

    // [fields]

    private disposables: DisposableManager = new DisposableManager();

    private element: HTMLElement;
    private listContainer: HTMLElement;

    private scrollable: Scrollable;
    private scrollableWidget: ScrollableWidget;

    private rangeTable: RangeTable;

    private renderers: Map<ViewItemType, IListViewRenderer>;
    
    private items: IViewItem<T>[];
    private cache: ListViewCache<T>;

    private prevRenderTop: number;
    private prevRenderHeight: number;

    // [events]

    private _onDidChangeContentHeight = this.disposables.register(new Emitter<void>());
    public onDidChangeContentHeight = this._onDidChangeContentHeight.registerListener;

    // [getter / setter]

    get onDidScroll(): Register<IScrollEvent> { return this.scrollableWidget.onDidScroll; }
    
    // [constructor]

    constructor(container: HTMLElement, renderers: IListViewRenderer[], opts: IListViewOpts) {
        this.element = document.createElement('div');
        this.element.className = 'list-view';

        this.items = [];
        this.rangeTable = new RangeTable();
        this.prevRenderTop = 0;
        this.prevRenderHeight = 0;

        this.listContainer = document.createElement('div');
        this.listContainer.className = 'list-view-container';
        if (opts.transformOptimization) {
            // see https://www.afasterweb.com/2017/07/27/optimizing-repaints/
            this.listContainer.style.transform = 'translate3d(0px, 0px, 0px)';
        }
        
        this.scrollable = new Scrollable(
            opts.scrollbarSize ? opts.scrollbarSize : 10,
            DOMSize.getContentHeight(container),
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
            this.__onDidScroll(e);
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

    public getScrollable(): Scrollable { return this.scrollable; }

    public dispose(): void {
        this.disposables.dispose();
    }

    /**
     * @description Renders all the items in the DOM tree.
     * 
     * @param prevRenderRange The render range in the previous render frame.
     * @param renderTop The top of scrolling area.
     * @param renderHeight The height of viewport.
     */
    public render(prevRenderRange: IRange, renderTop: number, renderHeight: number): void {
        const renderRange = this.__getRenderRange(renderTop, renderHeight);

        const insert = Range.relativeComplement(prevRenderRange, renderRange);
        const remove = Range.relativeComplement(renderRange, prevRenderRange);
        const update = Range.intersection(prevRenderRange, renderRange);

        /**
         * try to get the next element in the given range, so we can insert our 
         * new elements before it one by one.
         */
        const insertBefore = this.__getNextElement(insert);

        // update items
        for (let i = update.start; i < update.end; i++) {
            this.updateItemInDOM(i);
        }

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

    /**
     * @description Deletes an amount of elements in the list view at the given 
     * index, if necessary, inserts the provided items after the given index.
     * 
     * @param index The given index.
     * @param deleteCount The amount of items to be deleted.
     * @param items The items to be inserted.
     */
    public splice(index: number, deleteCount: number, items: T[] = []): void {
        
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
                let rowCache = deleteCache.get(item.type);

                if (rowCache === undefined) {
                    rowCache = [];
                    deleteCache.set(item.type,rowCache);
                }

                const renderer = this.renderers.get(item.type);
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
            type: ListViewRendererType.TEST, // TODO: need a way to determine the type of the item
            element: item,
            size: item.size,
            row: null
        }));

        let waitToDelete: IViewItem<T>[]; // TODO: return this later
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
        this.scrollable.setScrollSize(this.rangeTable.size());
        
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
				const rows = deleteCache.get(item.type);
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

        this._onDidChangeContentHeight.fire();
    }
    
    /**
     * @description Updates an item in the DOM tree by the index.
     * @param index The index of the item.
     */
    public updateItemInDOM(index: number): void {
        const item = this.items[index]!;

        const dom = item.row!.dom;
        dom.style.top = this.positionAt(index) + 'px';
        dom.setAttribute('index', `${index}`);
    }

    /**
     * @description Inserts an item in the DOM tree by the index. If 
     * `insertBefore` provided, we insert the new HTMLElement before it.
     * 
     * @param index The index of the item.
     * @param insertBefore The HTMLElement to be insert before.
     * @param row Provided row.
     */
    public insertItemInDOM(index: number, insertBefore: HTMLElement | null, row?: IListViewRow): void {
        const item = this.items[index]!;
        
        if (item.row === null) {
            if (row) {
                item.row = row;
            } else {
                item.row = this.cache.get(item.type);
            }
        }

        this.updateItemInDOM(index);

        const renderer = this.renderers.get(item.type);
        if (renderer === undefined) {
            throw new Error(`no renderer provided for the given type: ${item.type}`);
        }

        renderer.render(item.row.dom, item.element);

        if (insertBefore) {
            this.listContainer.insertBefore(item.row.dom, insertBefore);
        } else {
            this.listContainer.appendChild(item.row.dom);
        }
    }

    /**
     * @description Removes an item from the DOM tree by the index.
     * @param index The index of the item.
     */
    public removeItemInDOM(index: number): void {
        const item = this.items[index]!;

        if (item.row) {
            const renderer = this.renderers.get(item.type);

            if (renderer) {
                renderer.dispose(item.row.dom);
            }
    
            this.cache.release(item.row);
            item.row = null;
        }
    }

    // [Item Related Methods]

    /**
     * @description Returns the height of the item in DOM.
     * @param index The index of the item.
     */
    public getItemHeight(index: number): number {
        return this.items[index]!.size;
    }

    /**
     * @description Returns the item's DOM position (top) given the index.
     * @param index The index of the item.
     */
    public positionAt(index: number): number {
        return this.rangeTable.positionAt(index);
    }

    /**
     * @description Returns the item's index given the DOM position.
     * @param position The DOM's position (top).
     */
    public indexAt(position: number): number {
        return this.rangeTable.indexAt(position);
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
     * @param e The event {@link IScrollEvent}.
     */
    private __onDidScroll(e: IScrollEvent): void {
        const prevRenderRange = this.__getRenderRange(this.prevRenderTop, this.prevRenderHeight);
        this.render(prevRenderRange, this.scrollable.getScrollPosition(), this.scrollable.getViewportSize());
    }

}