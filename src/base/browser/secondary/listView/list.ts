import { IListView, IViewItemChangeEvent } from "src/base/browser/secondary/listView/listView";
import { IListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { Register } from "src/base/common/event";
import { IRange } from "src/base/common/structures/range";

/**
 * Common interfaces shares between {@link IListView} and {@link IListWidget}.
 */
export interface IList<T> {
    
    /** 
     * The container of the whole view. 
     */
    readonly DOMElement: HTMLElement;

    /**
     * The container of the list. Its direct children will be all the rows of
     * the list.
     */
    readonly listElement: HTMLElement;

    /** 
     * The actual content size in pixels. 
     */
    readonly contentSize: number;

    // [events]

    /** Fires when an DOM element is inserted into the DOM tree. */
    get onInsertItemInDOM(): Register<IViewItemChangeEvent<T>>;

    /** Fires when an DOM element is updated the DOM tree. */
    get onUpdateItemInDOM(): Register<IViewItemChangeEvent<T>>;

    /** Fires when an DOM element is removed from DOM tree. */
    get onRemoveItemInDOM(): Register<IViewItemChangeEvent<T>>;

    // [public methods]

    /**
     * @description Given the height, re-layouts the height of the whole view.
     * @param height The given height.
     * 
     * @note If no values are provided, it will sets to the height of the 
     * corresponding DOM element of the view.
     */
    layout(height?: number): void;

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

    /**
     * @description Returns a range represents the visible items of the list view.
     */
    getVisibleRange(): IRange;

    // [Item Related Methods]

    /** 
     * @description The number of items in the view (including unrendered ones).
     */
    getItemCount(): number;

    /**
     * @description Returns the item at given index.
     * @param index The index of the item.
     */
    getItem(index: number): T;

    /**
     * @description Returns the rendering index of the item with the given item.
     * @param item The actual item.
     */
    getItemIndex(item: T): number;

    /**
     * @description Returns the rendering index of the item with the given actual
     * index. If not found, -1 will be returned.
     * @param actualIndex The actual index of the item in the list view.
     */
    getRenderIndex(actualIndex: number): number;

    /**
     * @description Returns the HTMLElement of the item at given index, null if
     * the item is not rendered yet.
     * @param index The index of the item.
     */
    getHTMLElement(index: number): HTMLElement | null;

    /**
     * @description Determines if the item with the given index is visible 
     * (rendered).
     * @param index The index of the item.
     */
    isItemVisible(index: number): boolean;
}