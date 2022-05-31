import { IListViewRow, ListViewCache } from "src/base/browser/secondary/listView/listCache";
import { IListViewRenderer, ListItemRenderer, PipelineRenderer, RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { ScrollableWidget } from "src/base/browser/secondary/scrollableWidget/scrollableWidget";
import { ScrollbarType } from "src/base/browser/secondary/scrollableWidget/scrollableWidgetOptions";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { DomUtility, EventType } from "src/base/common/dom";
import { DomEmitter, Emitter, Register } from "src/base/common/event";
import { IRange, ISpliceable, Range, RangeTable } from "src/base/common/range";
import { IScrollEvent, Scrollable } from "src/base/common/scrollable";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { memoize } from "src/base/common/memoization";
import { FocusTracker } from "src/base/browser/basic/focusTracker";


/**
 * The consturtor options for {@link ListView}.
 */
export interface IListViewOpts<T> {
    
    /**
     * When constructing the view, decide whether to layout the view immediately.
     * `layout` meanning to update the size of the view and causes rerendering.
     * 
     * Sometimes the provided HTMLElement container is NOT in the DOM tree yet, 
     * so it cannot decide how big the view should be. If this is the case, set
     * this to false or just do not provide, then call `layout()` manually.
     */
    readonly layout?: boolean;

    /**
     * If turns on the transform optimization.
     * @see https://www.afasterweb.com/2017/07/27/optimizing-repaints/
     */
    readonly transformOptimization?: boolean;
    
    /**
     * A multiplier to be used on the `deltaX` and `deltaY` of a mouse 
     * wheel scroll event.
	 * @default 1
     */
    readonly mouseWheelScrollSensitivity?: number;

    /**
     * A multiplier to be used for wheel scroll event when `ALT` 
     * keyword is pressed.
     * @default 5
     */
	readonly fastScrollSensitivity?: number;

    /**
     * If reverse the mouse wheel direction.
     */
    readonly reverseMouseWheelDirection?: boolean;

    /**
     * The width of thee scrollbar.
     * @default 10
     */
    readonly scrollbarSize?: number;
    
}

/**
 * The type of items are stored in {@link IListView}. The item will be rendered
 * by the renderers which has the same type.
 */
export type ListItemType = RendererType;

/**
 * The inner data structure wraps each item in {@link ListView}.
 */
export interface IViewItem<T> {
    readonly id: number;
    readonly data: T;
    readonly type: ListItemType;
    size: number;
    row: IListViewRow | null; // null means this item is currently not rendered.
    dragStart?: IDisposable;
}

export interface IViewItemChangeEvent<T> {
    item: IViewItem<T>; // REVIEW: 考虑这里要不要去掉IViewItem, 只return一些关键信息
    index: number;
}

let ListViewItemUUID: number = 0;

/**
 * The interface for {@link ListView}.
 */
export interface IListView<T> extends IDisposable {

    // [events / getter]

    /** Fires when the splice() is invoked. */
    get onDidSplice(): Register<void>;

    /** Fires when an DOM element is inserted into the DOM tree. */
    get onInsertItemInDOM(): Register<IViewItemChangeEvent<T>>;

    /** Fires when an DOM element is updated the DOM tree. */
    get onUpdateItemInDOM(): Register<IViewItemChangeEvent<T>>;

    /** Fires when an DOM element is removed from DOM tree. */
    get onRemoveItemInDOM(): Register<IViewItemChangeEvent<T>>;

    /** Fires before the {@link IListView} is scrolling. */
    get onWillScroll(): Register<IScrollEvent>;

    /** Fires after the {@link IListView} is scrolling. */
    get onDidScroll(): Register<IScrollEvent>;
    
    /** Fires when the {@link IListView} itself is focused. */
    get onDidFocus(): Register<void>;

    /** Fires when the {@link IListView} itself is blured. */
    get onDidBlur(): Register<void>;

    /** Fires when the item in the {@link IListView} is clicked. */
    get onClick(): Register<MouseEvent>;

    /** Fires when the item in the {@link IListView} is double clicked. */
    get onDoubleclick(): Register<MouseEvent>;

    /** Fires when the item in the {@link IListView} is mouseovered. */
    get onMouseover(): Register<MouseEvent>;
    
    /** Fires when the item in the {@link IListView} is mousedouted. */
    get onMouseout(): Register<MouseEvent>;
    
    /** Fires when the item in the {@link IListView} is mousedowned. */
    get onMousedown(): Register<MouseEvent>;
    
    /** Fires when the item in the {@link IListView} is mouseuped. */
    get onMouseup(): Register<MouseEvent>;
    
    /** Fires when the item in the {@link IListView} is mousemoved. */
    get onMousemove(): Register<MouseEvent>;

    /** 
     * An event sent when the state of contacts with a touch-sensitive surface 
     * changes. This surface can be a touch screen or trackpad.
     */
    get onTouchstart(): Register<TouchEvent>;

    /** Fires when the {@link IListView} is keydowned. */
    get onKeydown(): Register<KeyboardEvent>;

    /** The length (height) of the whole view in pixels. */
    length: number;

    /** The container of the whole view. */
    DOMElement: HTMLElement;

    // [methods]

    /**
     * @description Given the height, re-layouts the height of the whole view.
     * @param height The given height.
     * 
     * @note If no values are provided, it will sets to the height of the 
     * corresponding DOM element of the view.
     */
    layout(height?: number): void;

    /**
     * @description Renders all the items in the DOM tree.
     * @param prevRenderRange The render range in the previous render frame.
     * @param renderTop The top of scrolling area.
     * @param renderHeight The height of viewport.
     */
    render(prevRenderRange: IRange, renderTop: number, renderHeight: number): void;

    /**
     * @description Rerenders the whole view.
     */
    rerender(): void;

    /**
     * @description Deletes an amount of elements in the {@link IListView} at 
     * the given index, if necessary, inserts the provided items after the given 
     * index.
     * @param index The given index.
     * @param deleteCount The amount of items to be deleted.
     * @param items The items to be inserted.
     * 
     * @note render() will be invoked via this method.
     */
    splice(index: number, deleteCount: number, items?: T[]): void;

    /**
     * @description Reveals (does not scroll to) the item in the {@link IListView} 
     * with the given index.
     * @param index The index of the revealing item.
     * @param relativePositionPercentage A percentage indicates the relative 
     * position of the revealed item. Must be in range [0, 1]. If not provided,
     * it will adjust the item to the edge depending on which side from revealing.
     */
    reveal(index: number, relativePositionPercentage?: number): void;

    /**
     * @description Updates the position (top) and attributes of an item in the 
     * DOM tree by the index.
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

    /**
     * @description Sets the current view as focused in DOM tree.
     */
    setDomFocus(): void;

    // [Scroll Related Methods]

    /**
     * @description Sets the viewport size of the list view.
     * @param size The size of viewport.
     */
    setViewportSize(size: number): void;

    /**
     * @description Sets the scrollable position (top) of the list view.
     * @param position The numerated size.
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
     * @description Returns the rendering index of the item with the given actual
     * index. If not found, -1 will be returned.
     * @param actualIndex The actual index of the item in the list view.
     */
    getRenderIndex(actualIndex: number): number;

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
    indexAtVisible(visiblePosition: number): number;

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
    indexAfterVisible(visiblePosition: number): number;

    /**
     * @description Returns the rendering index of the item given the visible 
     * DOM position.
     * @param visiblePosition The DOM's position (top) relatives to the viewport.
     * 
     * @note If the position is invalid, undefined is returned.
     */
    renderIndexAtVisible(visiblePosition: number): number | undefined;

    /**
     * @description Returns the actual index from the event target which may be
     * triggered by clicking or anything other events. The method will try to get
     * the DOM attribute from the target.
     * @param target The {@link EventTarget}.
     * 
     * @throws If the target is not found, undefined is returned.
     */
    indexFromEventTarget(target: EventTarget | null): number | undefined;
}

/**
 * @class A virtual vertical scrolling engine that only renders the items within
 * its viewport. It can hold a large amount of items and still has a great 
 * performance. Built on top of {@link ScrollableWidget}.
 * 
 * Provided renderers are responsible for rendering each item with corresponding 
 * type.
 * 
 * The performance mainly affects by how the renderers work.
 * 
 * Functionalities:
 *  - Vertical scrolling
 *  - performant template-based rendering
 *  - mouse support
 */
export class ListView<T> implements IDisposable, ISpliceable<T>, IListView<T> {

    // [fields]

    private disposables: DisposableManager = new DisposableManager();

    /** The whole element of the view, including the scrollbar and all the items. */
    private element: HTMLElement;
    private focusTracker: FocusTracker;

    /** The element contains all the items. */
    private listContainer: HTMLElement;

    private scrollable: Scrollable;
    private scrollableWidget: ScrollableWidget;

    private rangeTable: RangeTable;

    private renderers: Map<RendererType, IListViewRenderer<T, any>>;
    private itemProvider: IListItemProvider<T>;
    
    private items: IViewItem<T>[];
    private cache: ListViewCache;

    /** The `top` pixels relatives to the scrollable view that was previously rendered. */
    private prevRenderTop: number;
    /** The `height` of the list view that was previously rendered. */
    private prevRenderHeight: number;

    /** If the list view is during the `splice()` operation. */
    private _splicing: boolean;

    // [events]

    private readonly _onDidSplice: Emitter<void> = this.disposables.register(new Emitter<void>());
    public readonly onDidSplice: Register<void> = this._onDidSplice.registerListener;

    private readonly _onInsertItemInDOM: Emitter<IViewItemChangeEvent<T>> = this.disposables.register(new Emitter<IViewItemChangeEvent<T>>());
    public readonly onInsertItemInDOM: Register<IViewItemChangeEvent<T>> = this._onInsertItemInDOM.registerListener;

    private readonly _onUpdateItemInDOM: Emitter<IViewItemChangeEvent<T>> = this.disposables.register(new Emitter<IViewItemChangeEvent<T>>());
    public readonly onUpdateItemInDOM: Register<IViewItemChangeEvent<T>> = this._onUpdateItemInDOM.registerListener;

    private readonly _onRemoveItemInDOM: Emitter<IViewItemChangeEvent<T>> = this.disposables.register(new Emitter<IViewItemChangeEvent<T>>());
    public readonly onRemoveItemInDOM: Register<IViewItemChangeEvent<T>> = this._onRemoveItemInDOM.registerListener;

    // [getter / setter]

    get onWillScroll(): Register<IScrollEvent> { return this.scrollableWidget.onWillScroll; }
    get onDidScroll(): Register<IScrollEvent> { return this.scrollableWidget.onDidScroll; }
    
    get onDidFocus(): Register<void> { return this.focusTracker.onDidFocus; }
    get onDidBlur(): Register<void> { return this.focusTracker.onDidBlur; }
    
    @memoize get onClick(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.element, EventType.click)).registerListener; }
    @memoize get onDoubleclick(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.element, EventType.doubleclick)).registerListener; }
    @memoize get onMouseover(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.element, EventType.mouseover)).registerListener; }
    @memoize get onMouseout(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.element, EventType.mouseout)).registerListener; }
    @memoize get onMousedown(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.element, EventType.mousedown)).registerListener; }
    @memoize get onMouseup(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.element, EventType.mouseup)).registerListener; }
    @memoize get onMousemove(): Register<MouseEvent> { return this.disposables.register(new DomEmitter<MouseEvent>(this.element, EventType.mousemove)).registerListener; }
    @memoize get onTouchstart(): Register<TouchEvent> { return this.disposables.register(new DomEmitter<TouchEvent>(this.element, EventType.touchstart)).registerListener; }

    @memoize get onKeydown(): Register<KeyboardEvent> { return this.disposables.register(new DomEmitter<KeyboardEvent>(this.element, EventType.keydown)).registerListener; }

    get length(): number { return this.items.length; }
    get DOMElement(): HTMLElement { return this.element; }

    // [constructor]

    constructor(
        container: HTMLElement, 
        renderers: IListViewRenderer<any, any>[], 
        itemProvider: IListItemProvider<T>,
        opts: IListViewOpts<T>
    ) {
        this.element = document.createElement('div');
        this.element.className = 'list-view';
        this.focusTracker = new FocusTracker(this.element, true);

        this.items = [];
        this.rangeTable = new RangeTable();
        this.prevRenderTop = 0;
        this.prevRenderHeight = 0;
        this._splicing = false;

        this.listContainer = document.createElement('div');
        this.listContainer.className = 'list-view-container';
        if (opts.transformOptimization) {
            this.listContainer.style.transform = 'translate3d(0px, 0px, 0px)';
        }
        
        this.scrollable = new Scrollable(opts.scrollbarSize ? opts.scrollbarSize : 10, 0, 0, 0);
        
        this.scrollableWidget = new ScrollableWidget(this.scrollable, {
            mouseWheelScrollSensibility: opts.mouseWheelScrollSensitivity,
            mouseWheelFastScrollSensibility: opts.fastScrollSensitivity,
            reverseMouseWheelDirection: opts.reverseMouseWheelDirection,
            scrollbarType: ScrollbarType.vertical,
        });
        this.scrollableWidget.render(this.element);
        this.scrollableWidget.onDidScroll((e: IScrollEvent) => {
            this.__onDidScroll(e.scrollPosition, e.viewportSize);
        });

        // integrates all the renderers
        renderers = renderers.map(renderer => new PipelineRenderer(renderer.type, [new ListItemRenderer(), renderer]));

        this.renderers = new Map();
        for (let renderer of renderers) {
            this.renderers.set(renderer.type, renderer);
        }

        this.itemProvider = itemProvider;

        this.cache = new ListViewCache(this.renderers);

        // DOM rendering

        this.element.appendChild(this.listContainer);
        container.appendChild(this.element);

        // disposable registration

        this.disposables.register(this.scrollable);
        this.disposables.register(this.scrollableWidget);
        this.disposables.register(this.cache);
        this.disposables.register(this.focusTracker);

        // optional rendering
        if (opts.layout) {
            this.layout();
        }
    }

    // [methods]

    public dispose(): void {
        
        // try to dispose all the internal data from each renderer.
        for (const item of this.items) {

            if (item.row) {
                const renderer = this.renderers.get(item.type);
                if (renderer) {
                    if (renderer.disposeData) {
                        renderer.disposeData(item.data, -1, item.row.metadata, undefined);
                    }
                    renderer.dispose(item.row.metadata);
                }
            }

        }

        this.items = [];

        // remove list view from the DOM tree.
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        this.disposables.dispose();
    }

    public layout(height?: number): void {

        height = height ?? DomUtility.getContentHeight(this.element);
        this.scrollable.setViewportSize(height);

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

        this.listContainer.style.top = `${-renderTop}px`;
        this.prevRenderTop = renderTop;
        this.prevRenderHeight = renderHeight;
    }

    public rerender(): void {
        
        /**
         * @note Since each item does not support dynamic height for now, 
         * rerender will do nothing.
         */

        return;
    }

    public splice(index: number, deleteCount: number, items: T[] = []): void {
        
        if (this._splicing) {
            throw new ListError('cannot splice recursively');
        }

        this._splicing = true;

        try {
            this.__splice(index, deleteCount, items);
        } catch (err) {
            throw err;
        } finally {
            this._splicing = false;
        }
    }

    public reveal(index: number, relativePositionPercentage?: number): void {
        if (index < 0 && index >= this.length) {
            return;
        }

        const viewportHeight = this.getViewportSize();

        const itemPosition = this.positionAt(index);
        const itemHeight = this.getItemHeight(index);

        if (relativePositionPercentage !== undefined && 
            (relativePositionPercentage < 0 || relativePositionPercentage > 1)
        ) {
            const visiblePart = itemHeight - viewportHeight;
            const position = visiblePart * relativePositionPercentage + itemPosition;
            this.setScrollPosition(position);
        } 
        
        // adjust the item position depends from the revealing side.
        else {
            const scrollPosition = this.getScrollPosition();
            const scrollBottomPosition = scrollPosition + viewportHeight;
            const itemBottomPosition = itemPosition + itemHeight;
            if (itemPosition === scrollPosition || itemBottomPosition === scrollBottomPosition) {
                // item is at the exact top of the visible part OR the exact bottom of the visible part
            } else if (itemPosition < scrollPosition) {
                // item is `above` the visible part
                this.setScrollPosition(itemPosition);
            } else if (itemBottomPosition > scrollBottomPosition) {
                // item is `below` the visible part
                this.setScrollPosition(itemBottomPosition - viewportHeight);
            }
        }

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
                item.row = this.cache.get(item.type);
            }
        }

        this.updateItemInDOM(index);

        const renderer = this.renderers.get(item.type);
        if (renderer === undefined) {
            throw new Error(`no renderer provided for the given type: ${item.type}`);
        }

        renderer.update(item.data, index, item.row!.metadata, item.size);

        if (insertBefore) {
            this.listContainer.insertBefore(item.row!.dom, insertBefore);
        } else {
            this.listContainer.appendChild(item.row!.dom);
        }

        this._onInsertItemInDOM.fire({ item: item, index: index });
    }

    public removeItemInDOM(index: number): void {
        const item = this.items[index]!;

        if (item.row) {
            const renderer = this.renderers.get(item.type);

            // dispose internal data inside the renderer if needed
            if (renderer && renderer.disposeData) {
                renderer.disposeData(item.data, index, item.row.metadata, item.size);
            }
    
            this.cache.release(item.row);
            item.row = null;
        }

        this._onRemoveItemInDOM.fire({ item: item, index: index });
    }

    public setDomFocus(): void {
        /**
         * A boolean value indicating whether or not the browser should scroll 
         * the document to bring the newly-focused element into view.
         */
        this.element.focus({ preventScroll: true });
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
        return this.itemProvider.getSize(item);
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

    public getRenderIndex(actualIndex: number): number {
        const {start, end} = this.__getRenderRange(this.prevRenderTop, this.prevRenderHeight);
        if (actualIndex >= start && actualIndex < end) {
            return actualIndex - start;
        }
        return -1;
    }

    public positionAt(index: number): number {
        return this.rangeTable.positionAt(index);
    }

    public indexAt(position: number): number {
        return this.rangeTable.indexAt(position);
    }

    public indexAtVisible(visiblePosition: number): number {
        return this.rangeTable.indexAt(this.prevRenderTop + visiblePosition);
    }

    public indexAfter(position: number): number {
        return this.rangeTable.indexAfter(position);
    }

    public indexAfterVisible(visiblePosition: number): number {
        return this.rangeTable.indexAfter(this.prevRenderTop + visiblePosition);
    }

    public renderIndexAtVisible(visiblePosition: number): number | undefined {
        const topIndex = this.rangeTable.indexAt(this.scrollable.getScrollPosition());
        if (topIndex === -1) {
            return undefined;
        }

        const currIndex = this.rangeTable.indexAt(this.scrollable.getScrollPosition() + visiblePosition);
        if (currIndex === -1) {
            return undefined;
        }

        return currIndex - topIndex;
    }

    public indexFromEventTarget(target: EventTarget | null): number | undefined {
        if (target === null) {
            return undefined;
        }

        /**
         * Since the event target which triggered by an event might be the child
         * element of the actual row list, so we will trace back to the parent
         * until we find one.
         */

        let element = target as HTMLElement | null;

        while (element instanceof HTMLElement && // making sure when tracing up
               element !== this.listContainer && // will not be out of range.
               this.element.contains(element)
        ) {
            const stringIndex = element.getAttribute('index');
            if (stringIndex) {
                const index =  Number(stringIndex);
                if (isNaN(index) === false) {
                    return index;
                }
            }

            element = element.parentElement;
        }

        return undefined;
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
     * @param renderTop The top of scrolling area.
     * @param renderHeight The height of viewport.
     */
    private __onDidScroll(renderTop: number, renderHeight: number): void {
        const prevRenderRange = this.__getRenderRange(this.prevRenderTop, this.prevRenderHeight);
        this.render(prevRenderRange, renderTop, renderHeight);
    }

    /**
     * @description The auxiliary method for this.splice(). The actual splicing
     * process via this method.
     */
    private __splice(index: number, deleteCount: number, items: T[] = []): T[] {
        
        const prevRenderRange = this.__getRenderRange(this.prevRenderTop, this.prevRenderHeight);
        
        // find the range that about to be deleted
        const deleteRange = Range.intersection(prevRenderRange, { start: index, end: index + deleteCount });

        /**
         * We use a cache to store all the `row`s that are about to be removed.
         * When we do the insertion, we try to reuse these `row`s to improve 
         * efficiency.
         */
        const deleteCache = new Map<ListItemType, IListViewRow[]>();
        for (let i = deleteRange.start; i < deleteRange.end; i++) {
            const item = this.items[i]!;

            if (item.row) {
                let rowCache = deleteCache.get(item.type);

                if (rowCache === undefined) {
                    rowCache = [];
                    deleteCache.set(item.type, rowCache);
                }

                const renderer = this.renderers.get(item.type);
                if (renderer) {
                    renderer.dispose(item.row!.metadata);
                }

                rowCache.push(item.row);
                item.row = null;
            }
        }

        // the rest range right after the deleted range
        const prevRestRange = { start: index + deleteCount, end: this.items.length };
        // in the rest range, find the rendered part
        const prevRestRenderedRange = Range.intersection(prevRestRange, prevRenderRange);
        // in the rest range, find the unrendered part
        const prevRestUnrenderedRange = Range.relativeComplement(prevRenderRange, prevRestRange);

        // [delete and insert the items]

        // stores all the inserting items.
        const insert = items.map<IViewItem<T>>(item => ({
            id: ListViewItemUUID++, // REVIEW: not used
            type: this.itemProvider.getType(item),
            data: item,
            size: this.itemProvider.getSize(item),
            row: null,
        }));

        // actual deletion

        let waitToDelete: IViewItem<T>[];
        if (index === 0 && deleteCount >= this.items.length) {
            // special case: deletes all the items
            this.rangeTable = new RangeTable();
            this.rangeTable.splice(0, 0, insert);
            waitToDelete = this.items;
            this.items = insert;
        } else {
            // general case: deletes partial items
            this.rangeTable.splice(index, deleteCount, insert);
            waitToDelete = this.items.splice(index, deleteCount, ...insert);
        }
        
        const offset = items.length - deleteCount;
        // recalcualte the render range (since we have modifed the range table)
        const renderRange = this.__getRenderRange(this.prevRenderTop, this.prevRenderHeight);
        // find the rest items that are still required rendering, we update them in DOM
        const restRenderedRange = Range.shift(prevRestRenderedRange, offset);
        const updateRange = Range.intersection(renderRange, restRenderedRange);
        for (let i = updateRange.start; i < updateRange.end; i++) {
            this.updateItemInDOM(i);
        }

        // find the rest items that does not require rendering anymore, we remove them from DOM
        const remove = Range.relativeComplement(renderRange, restRenderedRange);
        for (const range of remove) {
            for (let i = range.start; i < range.end; i++) {
                this.removeItemInDOM(i);
            }
        };

        /**
         * find the rest items that was not rendered, inserting new items in DOM 
         * if deleting more items than inserting new items, that is, `offset < 0`.
         * When inserting a new item into the DOM, we try to reuse a row cache 
         * from the previous deleted DOM elements.
         */
        const restUnrenderedRange = prevRestUnrenderedRange.map(range => Range.shift(range, offset));
        const elementsRange = { start: index, end: index + items.length };
		const insertRanges = [elementsRange, ...restUnrenderedRange].map(range => Range.intersection(renderRange, range));
		const beforeElement = this.__getNextElement(insertRanges);
        
        // insert the item into the DOM if needed.
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

        this.listContainer.style.height = `${this.rangeTable.size()}px`;
        this.scrollable.setScrollSize(this.rangeTable.size());
        
        this._onDidSplice.fire();

        return waitToDelete.map(item => item.data);
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