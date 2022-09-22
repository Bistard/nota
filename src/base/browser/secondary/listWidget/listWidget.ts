import { IListViewRenderer, PipelineRenderer } from "src/base/browser/secondary/listView/listRenderer";
import { IListViewOpts, IViewItemChangeEvent, ListError, ListView } from "src/base/browser/secondary/listView/listView";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { DomUtility } from "src/base/browser/basic/dom";
import { Event, Register, SignalEmitter } from "src/base/common/event";
import { IScrollEvent } from "src/base/common/scrollable";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListDragAndDropProvider, ListWidgetDragAndDropController } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { memoize } from "src/base/common/memoization";
import { Arrays } from "src/base/common/util/array";
import { IS_MAC } from "src/base/common/platform";
import { createStandardKeyboardEvent, IStandardKeyboardEvent, KeyCode } from "src/base/common/keyboard";
import { IRange } from "src/base/common/range";
import { isNumber, NulltoUndefined } from "src/base/common/util/type";
import { ListTrait, ListTraitRenderer } from "src/base/browser/secondary/listWidget/listWidgetTrait";

/**
 * The index changed in {@link ListTrait}.
 */
export interface ITraitChangeEvent {

    /** The new indices with the corresponding trait. */
    indice: number[];
}

/**
 * @internal
 * @class An internal class that handles the mouse support of {@link IListWidget}.
 * It handles:
 *  - when to focus DOM
 *  - when to focus item
 *  - when to select item(s)
 * 
 * @readonly EXPORT FOR OTHER MODULES ONLY. DO NOT USE DIRECTLY.
 */
export class ListWidgetMouseController<T> implements IDisposable {

    // [fields]

    private _disposables = new DisposableManager();
    private _view: IListWidget<T>;

    private _multiSelectionSupport: boolean = true;

    // [constructor]

    constructor(
        view: IListWidget<T>,
        opts: IListWidgetOpts<T>
    ) {
        this._view = view;

        this._view.DOMElement.classList.add('mouse-support');

        if (opts.multiSelectionSupport !== undefined) {
            this._multiSelectionSupport = opts.multiSelectionSupport;
        }

        this._disposables.register(view.onMousedown(e => this.__onMouseDown(e)));
        this._disposables.register(view.onClick(e => this.__onMouseClick(e)));
    }

    // [public methods]

    public dispose(): void {
        this._disposables.dispose();
    }

    // [protect methods]

    protected __ifSupported(e: IListMouseEvent<T>): boolean {
        if (DomUtility.isInputElement(e.browserEvent.target as HTMLElement)) {
            return false;
        }
        return true;
    }

    /**
     * @description Handles item focus and selection logic.
     */
    protected __onMouseClick(e: IListMouseEvent<T>): void {

        if (this.__ifSupported(e) === false) {
            return;
        }

        const toFocused = e.actualIndex;
        
        // clicking nowhere, we reset all the traits
        if (toFocused === undefined) {
            this._view.setFocus(null);
            this._view.setAnchor(null);
            this._view.setSelections([]);
            return;
        }

        // check if selecting in range
        if (this.__isSelectingInRangeEvent(e)) {
            this.__multiSelectionInRange(e);
            return;
        } else if (this.__isSelectingInSingleEvent(e)) {
            this._mutliSelectionInSingle(e);
            return;
        }

        // normal click
        this._view.setAnchor(toFocused);
        this._view.setFocus(toFocused);
        if (DomUtility.isMouseRightClick(e.browserEvent) === false) {
            this._view.setSelections([toFocused]);
        }
    }

    /**
     * @description Determines if the event is selecting in range. In other words,
     * pressing SHIFT.
     */
    protected __isSelectingInRangeEvent(e: IListMouseEvent<T>): boolean {
        if (this._multiSelectionSupport === false) {
            return false;
        }
        return e.browserEvent.shiftKey;
    }

    /**
     * @description Determines if the event is selecting in single. In other words,
     * pressing CTRL in Windows or META in Macintosh.
     */
    protected __isSelectingInSingleEvent(e: IListMouseEvent<T>): boolean {
        if (this._multiSelectionSupport === false) {
            return false;
        }
        return IS_MAC ? e.browserEvent.metaKey : e.browserEvent.ctrlKey;
    }

    // [private helper methods]

    /**
     * @description Focuses the event target element.
     */
    private __onMouseDown(e: IListMouseEvent<T>): void {
        // prevent double focus
        if (document.activeElement !== e.browserEvent.target) {
			this._view.setDomFocus();
		}
    }

    /**
     * @description Applies multi-selection when selecting in range.
     */
    private __multiSelectionInRange(e: IListMouseEvent<T>): void {
        const toFocused = e.actualIndex!;
        let anchor = this._view.getAnchor();

        // if no focus yet, we focus on the current.
        if (anchor === null) {
            anchor = this._view.getFocus() ?? toFocused;
            this._view.setAnchor(anchor);
        }

        /**
         * @readonly Below is not really a good implementation (could be optimized), 
         * but works.
         */

        // calculates the selection range
        const toSelectRange = Arrays.range(
            Math.min(toFocused, anchor), 
            Math.max(toFocused, anchor) + 1
        );
        const currSelection = this._view.getSelections().sort((a, b) => a - b);
        const contiguousRange = this.__getNearestContiguousRange(Arrays.unique(Arrays.insert(currSelection, anchor)), anchor);
        if (!contiguousRange.length) {
            return;
        }
        const newSelection = Arrays.union(toSelectRange, 
                                Arrays.union(
                                    Arrays.relativeComplement(currSelection, contiguousRange), 
                                    Arrays.relativeComplement(contiguousRange, currSelection)
                                )
                            );
        
        // update selections and focused
        this._view.setSelections(newSelection);
        this._view.setFocus(toFocused);
    }

    /**
     * @description Applies multi-selection when selecting in single.
     */
    private _mutliSelectionInSingle(e: IListMouseEvent<T>): void {
        const toFocused = e.actualIndex!;

        const currSelection = this._view.getSelections();
        const newSelection = Arrays.remove(currSelection, toFocused);

        this._view.setFocus(toFocused);
        this._view.setAnchor(toFocused);

        if (newSelection.length === currSelection.length) {
            // we are not removing any of the current selections
            this._view.setSelections([...newSelection, toFocused]);
        } else {
            // we removed one of the selections
            this._view.setSelections(newSelection);
        }
    }

    private __getNearestContiguousRange(range: number[], anchor: number): number[] {
        const index = range.indexOf(anchor);
        if (index === -1) {
            return [];
        }

        const result: number[] = [];
        let i = index - 1;
        while (i >= 0 && range[i] === anchor - (index - i)) {
            result.push(range[i--]!);
        }

        result.reverse();
        i = index;
        while (i < range.length && range[i] === anchor + (i - index)) {
            result.push(range[i++]!);
        }

        return result;
    }
}

/**
 * @internal
 * @class An internal class that handles the keyboard support of {@link IListWidget}.
 * It handles:
 *  - enter
 *  - up
 *  - down
 *  - page up
 *  - page down
 *  - escape
 */
class ListWidgetKeyboardController<T> implements IDisposable {

    // [field]

    private _disposables = new DisposableManager();
    private _view: IListWidget<T>;

    // [constructor]

    constructor(
        view: IListWidget<T>
    ) {
        this._view = view;
        this._disposables.register(this.onKeydown(e => this.__onDidKeydown(e)));
    }

    // [private getter]

    @memoize private get onKeydown(): Register<IStandardKeyboardEvent> { return Event.filter(this._view.onKeydown, e => !DomUtility.isInputElement(e.target as HTMLElement)); }

    // [public method]

    public dispose(): void {
        this._disposables.dispose();
    }

    // [private helper methods]

    private __onDidKeydown(e: IStandardKeyboardEvent): void {
        switch (e.key) {
            case KeyCode.Enter:
                this.__onEnter(e);
                break;
            case KeyCode.UpArrow:
                this.__onUpArrow(e);
                break;
            case KeyCode.DownArrow:
                this.__onDownArrow(e);
                break;
            case KeyCode.PageUp:
                this.__onPageupArrow(e);
                break;
            case KeyCode.PageDown:
                this.__onPagedownArrow(e);
                break;
            case KeyCode.Escape:
                this.__onEscape(e);
                break;
            default:
                break;
        }
    }

    private __onEnter(e: IStandardKeyboardEvent): void {
        e.preventDefault();
		e.stopPropagation();
        const focused = this._view.getFocus();
        this._view.setSelections(focused !== null ? [focused] : []);
    }

    private __onUpArrow(e: IStandardKeyboardEvent): void {
        if (this._view.getFocus() !== null) {
            e.preventDefault();
            e.stopPropagation();
            const newFoused = this._view.focusPrev(1, false, undefined);
            if (newFoused !== -1) {
                this._view.setAnchor(newFoused);
                this._view.reveal(newFoused, undefined);
            }
            this._view.setDomFocus();
        }
    }

    private __onDownArrow(e: IStandardKeyboardEvent): void {
        if (this._view.getFocus() !== null) {
            e.preventDefault();
            e.stopPropagation();
            const newFoused = this._view.focusNext(1, false, undefined);
            if (newFoused !== -1) {
                this._view.setAnchor(newFoused);
                this._view.reveal(newFoused, undefined);
            }
            this._view.setDomFocus();
        }
    }

    private __onPageupArrow(e: IStandardKeyboardEvent): void {
        e.preventDefault();
		e.stopPropagation();
        // TODO
        console.warn('does not support pageup in ListWidget yet.');
    }

    private __onPagedownArrow(e: IStandardKeyboardEvent): void {
        e.preventDefault();
		e.stopPropagation();
        // TODO
        console.warn('does not support pagedown in ListWidget yet.');
    }

    private __onEscape(e: IStandardKeyboardEvent): void {
        if (this._view.getSelections().length) {
            e.preventDefault();
		    e.stopPropagation();
            this._view.setSelections([]);
            this._view.setAnchor(null);
			this._view.setDomFocus();
        }
    }
}

/**
 * A standard mouse event interface used in {@link IListWidget}. Clicking nothing 
 * returns undefined.
 */
export interface IListMouseEvent<T> {
    
    /** The original brower event. */
    browserEvent: MouseEvent;

    /** The rendering index of the clicked item. */
    renderIndex: number| undefined;

    /** The actual index of the clicked item. */
    actualIndex: number | undefined;

    /** The clicked item. */
    item: T | undefined;
}

/**
 * A standard touch event interface used in {@link ListWidget}. Touching nothing
 * returns undefined.
 */
export interface IListTouchEvent<T> {
    /** The original brower event. */
    browserEvent: TouchEvent;

    /** The rendering index of the touched item. */
    renderIndex: number| undefined;

    /** The actual index of the touched item. */
    actualIndex: number | undefined;

    /** The touched item. */
    item: T | undefined;
}

export interface IListDragEvent<T> {
    /** The original brower event {@link DragEvent}. */
    browserEvent: DragEvent;

    /** The actual index of the drag / dragover / drop item. */
    actualIndex: number | undefined;
    
    /** The drag / dragover / drop item. */
    item: T | undefined;
}

export interface IListContextmenuEvent<T> {
    /** The original browser UI event. */
    browserEvent: UIEvent;
    
    /** The rendering index of the target item. */
    renderIndex: number| undefined;

    /** The actual index of the target item. */
    actualIndex: number | undefined;

    /** The client data target of the event. */
	item: T | undefined;

    /** The browser position of the contextmenu event. */
	position: { x: number; y: number } | undefined;

    /** The browser target of the contextmenu if any. */
    target: HTMLElement | undefined;
}

/**
 * The consturtor options for {@link ListWidget}.
 */
export interface IListWidgetOpts<T> extends IListViewOpts<T> {
    
    /**
     * A provider that has ability to provide Drag and Drop Support (dnd).
     */
    readonly dragAndDropProvider?: IListDragAndDropProvider<T>;

    /** 
     * If allows mouse support. 
     * @default true
     */
    readonly mouseSupport?: boolean;

    /**
     * If allows mutiple selection support.
     * @default true
     */
    readonly multiSelectionSupport?: boolean;

    /**
     * If allows keyboard support.
     * @default true
     */
    readonly keyboardSupport?: boolean;

}

/**
 * The interface for {@link ListWidget}.
 */
export interface IListWidget<T> extends IDisposable {
    
    // [events / getter]
    
    /** The container of the whole view. */
    readonly DOMElement: HTMLElement;

    /** The actual content size in pixels. */
    readonly contentSize: number;

    /** Fires when the {@link IListWidget} is scrolling. */
    get onDidScroll(): Register<IScrollEvent>;
    
    /** Fires when the {@link IListWidget} itself is blured or focused. */
    get onDidChangeFocus(): Register<boolean>;

    /** Fires when the focused items in the {@link IListWidget} is changed. */
    get onDidChangeItemFocus(): Register<ITraitChangeEvent>;

    /** Fires when the selected items in the {@link IListWidget} is changed. */
    get onDidChangeItemSelection(): Register<ITraitChangeEvent>;

    /** Fires when an DOM element is inserted into the DOM tree. */
    get onInsertItemInDOM(): Register<IViewItemChangeEvent<T>>;

    /** Fires when an DOM element is updated the DOM tree. */
    get onUpdateItemInDOM(): Register<IViewItemChangeEvent<T>>;

    /** Fires when an DOM element is removed from DOM tree. */
    get onRemoveItemInDOM(): Register<IViewItemChangeEvent<T>>;

    /** Fires when the item in the {@link IListWidget} is clicked. */
    get onClick(): Register<IListMouseEvent<T>>;
    
    /** Fires when the item in the {@link IListWidget} is double clicked. */
    get onDoubleclick(): Register<IListMouseEvent<T>>;

    /** Fires when the item in the {@link IListWidget} is mouseovered. */
    get onMouseover(): Register<IListMouseEvent<T>>;

    /** Fires when the item in the {@link IListWidget} is mousedouted. */
    get onMouseout(): Register<IListMouseEvent<T>>;
    
    /** Fires when the item in the {@link IListWidget} is mousedowned. */
    get onMousedown(): Register<IListMouseEvent<T>>;
    
    /** Fires when the item in the {@link IListWidget} is mouseuped. */
    get onMouseup(): Register<IListMouseEvent<T>>;

    /** Fires when the item in the {@link IListWidget} is mousemoved. */
    get onMousemove(): Register<IListMouseEvent<T>>;

    /** 
     * An event sent when the state of contacts with a touch-sensitive surface 
     * changes. This surface can be a touch screen or trackpad.
     */
    get onTouchstart(): Register<IListTouchEvent<T>>;

    /** Fires when the {@link IListWidget} is keydown. */
    get onKeydown(): Register<IStandardKeyboardEvent>;

    /** Fires when the {@link IListWidget} is keyup. */
    get onKeyup(): Register<IStandardKeyboardEvent>;

    /** Fires when the {@link IListWidget} is keypress. */
    get onKeypress(): Register<IStandardKeyboardEvent>;

    /** 
     * Fires when the user attempts to open a context menu {@link IListWidget}. 
     * This event is typically triggered by:
     *      - clicking the right mouse button
     *      - pressing the context menu key
     *      - Shift F10
     */
    get onContextmenu(): Register<IListContextmenuEvent<T>>;

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
     * @description Rerenders the whole view.
     */
    rerender(): void;

    /**
     * @description Deletes an amount of elements in the {@link IListWidget} at 
     * the given index, if necessary, inserts the provided items after the given 
     * index.
     * @param index The given index.
     * @param deleteCount The amount of items to be deleted.
     * @param items The items to be inserted.
     */
    splice(index: number, deleteCount: number, items: T[]): void;

    /**
     * @description Reveals (does not scroll to) the item in the {@link IListWidget} 
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

    /**
     * @description Returns the item at given index.
     * @param index The index of the item.
     */
    getItem(index: number): T;

    // [item traits support]

    /**
     * @description Sets the item with the given index as the anchor.
     * @param index The provided index. If not provided, remove the current one.
     */
    setAnchor(index: number | null): void;

    /**
     * @description Sets the item with the given index as focused.
     * @param index The provided index. If not provided, remove the current one.
     */
    setFocus(index: number | null): void;

    /**
     * @description Sets the item with the given index as selected.
     * @param index The provided index. If empty provided, removes all the selections.
     */
    setSelections(index: number[]): void;

    /**
     * @description Returns all the indice of the selected items.
     */
    getSelections(): number[];

    /**
     * @description Returns the index of the anchor.
     * @note Anchor is where the user's selection start.
     */
    getAnchor(): number | null;

    /**
     * @description Returns the index of the focused item.
     * @note Focus is where the user's selection end.
     */
    getFocus(): number | null;

    /**
     * @description Returns all the selected items.
     */
    getSelectedItems(): T[];

    /**
     * @description Returns the anchor item.
     */
    getAnchorItem(): T | null;

    /**
     * @description Returns the focused item.
     */
    getFocusedItem(): T | null;

    /**
     * @description Respect to the current focused item, try to focus the first 
     * item forward by a given step `next` that matches the filter function.
     * @param next The step number. @default 1
     * @param fullLoop Do a full search on all the items. @default false
     * @param match The match function. If not provided, the next sibling will 
     * be matched.
     * @returns The index of the newly focused item. -1 if not found.
     */
    focusNext(next: number, fullLoop: boolean, match?: (item: T) => boolean): number;

    /**
     * @description Respect to the current focused item, try to focus the first 
     * item backward by a given step `prev` that matches the filter function.
     * @param prev The step number. @default 1
     * @param fullLoop Do a full search on all the items. @default false
     * @param match The match function. If not provided, the next sibling will 
     * be matched.
     * @returns The index of the newly focused item. -1 if not found.
     */
    focusPrev(prev: number, fullLoop: boolean, match?: (item: T) => boolean): number;

    /** 
     * @description The number of items in the view (including unrendered ones).
     */
    getItemCount(): number;
}

/**
 * @class A {@link ListWidget} is built on top of {@link ListView}, with extra 
 * features.
 * 
 * The widget presets a list of behaviours on mouse / keyboard support. Such as
 * pressing SHIFT will able to mutl-select in range, pressing escape key will
 * lose the current focus item and so on...
 * 
 * Extra Functionalities:
 *  - mouse support (focus / selection)
 *  - keyboard support (enter / up / down / pageup / pagedown / escape)
 *  - drag and drop support
 */
export class ListWidget<T> implements IListWidget<T> {

    // [fields]

    private disposables: DisposableManager;
    private view: ListView<T>;

    /** User's selection. */
    private selected: ListTrait;
    /** Where the user's selection start. */
    private anchor: ListTrait;
    /** Where the user's selection end. */
    private focused: ListTrait;

    // [constructor]

    constructor(
        container: HTMLElement,
        renderers: IListViewRenderer<any, any>[],
        itemProvider: IListItemProvider<T>, 
        opts: IListWidgetOpts<T> = {}
    ) {
        this.disposables = new DisposableManager();

        // initializes all the item traits
        this.selected = new ListTrait('selected');
        this.anchor = new ListTrait('anchor');
        this.focused = new ListTrait('focused');

        // integrates all the renderers
        const baseRenderers = [new ListTraitRenderer(this.selected), new ListTraitRenderer(this.focused)];
        renderers = renderers.map(renderer => new PipelineRenderer(renderer.type, [...baseRenderers, renderer]));
        
        // construct list view
        this.view = new ListView(container, renderers, itemProvider, opts);

        this.selected.getHTMLElement = item => this.view.getElement(item);
        this.anchor.getHTMLElement = item => this.view.getElement(item);
        this.focused.getHTMLElement = item => this.view.getElement(item);

        // mouse support integration (defaults on)
        if (opts.mouseSupport || opts.mouseSupport === undefined) {
            const mouseController = this.__createListWidgetMouseController(opts);
            this.disposables.register(mouseController);
        }
        
        // keyboard support integration
        if (opts.keyboardSupport || opts.mouseSupport === undefined) {
            const keyboardController = new ListWidgetKeyboardController(this);
            this.disposables.register(keyboardController);
        }
        
        // drag and drop integration
        if (opts.dragAndDropProvider) {
            const dndController = new ListWidgetDragAndDropController(this, opts.dragAndDropProvider, e => this.__toListDragEvent(e));
            this.disposables.register(dndController);
        }

        this.disposables.register(this.view);
        this.disposables.register(this.selected);
        this.disposables.register(this.focused);
    }

    // [getter / setter]

    get DOMElement(): HTMLElement { return this.view.DOMElement; }
    get contentSize(): number { return this.view.contentSize; }
    
    get onDidScroll(): Register<IScrollEvent> { return this.view.onDidScroll; }
    get onDidChangeItemFocus(): Register<ITraitChangeEvent> { return this.focused.onDidChange; }
    get onDidChangeItemSelection(): Register<ITraitChangeEvent> { return this.selected.onDidChange; }
    get onInsertItemInDOM(): Register<IViewItemChangeEvent<T>> { return this.view.onInsertItemInDOM; }
    get onUpdateItemInDOM(): Register<IViewItemChangeEvent<T>> { return this.view.onUpdateItemInDOM; }
    get onRemoveItemInDOM(): Register<IViewItemChangeEvent<T>> { return this.view.onRemoveItemInDOM; }
    @memoize get onDidChangeFocus(): Register<boolean> { return this.disposables.register(new SignalEmitter<boolean, boolean>([Event.map(this.view.onDidFocus, () => true), Event.map(this.view.onDidBlur, () => false)], (e: boolean) => e)).registerListener; }
    
    @memoize get onClick(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onClick, e => this.__toListMouseEvent(e)); }
    @memoize get onDoubleclick(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onDoubleclick, e => this.__toListMouseEvent(e));  }
    @memoize get onMouseover(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMouseover, e => this.__toListMouseEvent(e)); }
    @memoize get onMouseout(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMouseout, e => this.__toListMouseEvent(e)); }
    @memoize get onMousedown(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMousedown, e => this.__toListMouseEvent(e)); }
    @memoize get onMouseup(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMouseup, e => this.__toListMouseEvent(e)); }
    @memoize get onMousemove(): Register<IListMouseEvent<T>> { return Event.map<MouseEvent, IListMouseEvent<T>>(this.view.onMousemove, e => this.__toListMouseEvent(e)); }
    @memoize get onTouchstart(): Register<IListTouchEvent<T>> { return Event.map<TouchEvent, IListTouchEvent<T>>(this.view.onTouchstart, e => this.__toListTouchEvent(e)); }

    @memoize get onKeydown(): Register<IStandardKeyboardEvent> { return Event.map<KeyboardEvent, IStandardKeyboardEvent>(this.view.onKeydown, e => createStandardKeyboardEvent(e)); }
    @memoize get onKeyup(): Register<IStandardKeyboardEvent> { return Event.map<KeyboardEvent, IStandardKeyboardEvent>(this.view.onKeyup, e => createStandardKeyboardEvent(e)); }
    @memoize get onKeypress(): Register<IStandardKeyboardEvent> { return Event.map<KeyboardEvent, IStandardKeyboardEvent>(this.view.onKeypress, e => createStandardKeyboardEvent(e)); }
    @memoize get onContextmenu(): Register<IListContextmenuEvent<T>> { return this.__createContextmenuRegister(); }

    // [methods]

    public dispose(): void {
        this.disposables.dispose();
    }

    public layout(height?: number): void {
        this.view.layout(height);
    }

    public rerender(): void {
        this.view.rerender();
    }

    public splice(index: number, deleteCount: number, items: T[] = []): void {
        if (deleteCount === 0 && items.length === 0) {
            return;
        }
        
        if (index < 0 || index > this.getItemCount()) {
            throw new ListError(`splice invalid start index: ${index}`);
        }

        if (deleteCount < 0) {
            throw new ListError(`splice invalid deleteCount: ${deleteCount}`);
        }

        this.view.splice(index, deleteCount, items);
    }

    public reveal(index: number, relativePositionPercentage?: number): void {
        this.view.reveal(index, relativePositionPercentage);
    }

    public setDomFocus(): void {
        this.view.setDomFocus();
    }

    public setViewportSize(size: number): void {
        this.view.setViewportSize(size);
    }

    public setScrollPosition(position: number): void {
        this.view.setScrollPosition(position);
    }

    public getViewportSize(): number {
        return this.view.getViewportSize();
    }

    public getScrollPosition(): number {
        return this.view.getScrollPosition();
    }

    public getVisibleRange(): IRange {
        return this.view.getVisibleRange();
    }

    public getItem(index: number): T {
        return this.view.getItem(index);
    }

    // [item traits support]

    public setAnchor(index: number | null): void {
        this.anchor.set((index !== null) ? [index] : []);
    }

    public setFocus(index: number | null): void {
        this.focused.set((index !== null) ? [index] : []);
    }

    public setSelections(indice: number[]): void {
        this.selected.set(indice);
    }

    public getSelections(): number[] {
        return this.selected.items();
    }
    
    public getAnchor(): number | null {
        const indice = this.anchor.items();
        return indice.length ? indice[0]! : null;
    }

    public getFocus(): number | null {
        const indice = this.focused.items();
        return indice.length ? indice[0]! : null;
    }

    public getSelectedItems(): T[] {
        const indice = this.selected.items();
        return indice.map(index => this.view.getItem(index));
    }

    public getAnchorItem(): T | null {
        const indice = this.anchor.items();
        return indice.length ? this.view.getItem(indice[0]!) : null;
    }

    public getFocusedItem(): T | null {
        const indice = this.focused.items();
        return indice.length ? this.view.getItem(indice[0]!) : null;
    }

    public focusNext(next: number = 1, fullLoop: boolean = false, match?: (item: T) => boolean): number {
        if (this.getItemCount() === 0) {
            return -1;
        }

        const currFocused = this.focused.items();
        const indexFound = this.__findNextWithFilter(currFocused.length ? (currFocused[0]! + next) : 0, fullLoop, match);
        
        // founded
        if (indexFound !== -1) {
            this.focused.set([indexFound]);
        }

        return indexFound;
    }

    public focusPrev(prev: number = 1, fullLoop: boolean = false, match?: (item: T) => boolean): number {
        if (this.getItemCount() === 0) {
            return -1;
        }

        const currFocused = this.focused.items();
        const indexFound = this.__findPrevWithFilter(currFocused.length ? (currFocused[0]! - prev) : 0, fullLoop, match);
        
        // founded
        if (indexFound !== -1) {
            this.focused.set([indexFound]);
        }

        return indexFound;
    }

    public getItemCount(): number { 
        return this.view.getItemCount();
    }

    // [private helper methods]

    /**
     * @description Creates an instance of a {@link IListWidgetMouseController}.
     * May override by the inheritance to customize the mouse behaviour.
     */
    protected __createListWidgetMouseController(opts: IListWidgetOpts<T>): ListWidgetMouseController<T> {
        return new ListWidgetMouseController(this, opts);
    }

    /**
     * @description A mapper function to convert the {@link MouseEvent} to our 
     * standard {@link IListMouseEvent}.
     */
    private __toListMouseEvent(e: MouseEvent): IListMouseEvent<T> {
        return this.__toEvent(e);
    }

    /**
     * @description A mapper function to convert the {@link TouchEvent} to our 
     * standard {@link IListTouchEvent}.
     */
    private __toListTouchEvent(e: TouchEvent): IListTouchEvent<T> {
        return this.__toEvent(e);
    }

    private __toContextmenuEvent(e: PointerEvent): IListContextmenuEvent<T> {
        const event = this.__toEvent(e);
        return {
            ...event,
            position: { x: e.pageX + 1, y: e.pageY },
            target: isNumber(event.actualIndex) ? NulltoUndefined(this.view.getElement(event.actualIndex)) : undefined,
        }
    }

    private __createContextmenuRegister(): Register<IListContextmenuEvent<T>> {
        
        
        // only used to detect if pressing down context menu key
        this.onKeydown(e => {
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
        });

        // mouse right click
        const onMouse = Event.map<PointerEvent, IListContextmenuEvent<T>>(this.view.onContextmenu, e => this.__toContextmenuEvent(e));

        // contextmenu key OR shift + F10
        const onKeyRaw = Event.filter(this.onKeyup, e => e.key === KeyCode.ContextMenu || (e.shift && e.key === KeyCode.F10));
        const onKey = Event.map(onKeyRaw, e => { 
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation(); 

            const selections = this.getSelections();
            const actualIndex = selections.length ? selections[0] : undefined;
        
            let renderIndex: number | undefined;
            let item: T | undefined;
            let target: HTMLElement = this.view.DOMElement;
            if (actualIndex !== undefined) {
                renderIndex = this.view.getRenderIndex(actualIndex);
                item = this.view.getItem(actualIndex);
                target = this.view.getElement(actualIndex) ?? target;
            }

            return <IListContextmenuEvent<T>>{
                browserEvent: e.browserEvent,
                actualIndex: actualIndex,
                renderIndex: renderIndex,
                item: item,
                position: undefined,
                target: target,
            };
        });

        return Event.any([onMouse, onKey]);
    }

    /**
     * @description Transforms a {@link DragEvent} into {@link IListDragEvent}.
     * @param event The provided original drag event.
     * @returns The transformed event.
     */
    private __toListDragEvent(event: DragEvent): IListDragEvent<T> {

        const actualIndex = this.view.indexFromEventTarget(event.target)!; // will not be undefined
        
        // valid item index
        if (actualIndex >= 0 && actualIndex < this.view.getItemCount()) {
            const item = this.view.getItem(actualIndex);
            return {
                browserEvent: event,
                actualIndex: actualIndex, 
                item: item
            };
        }

        // we are not on any items
        return {
            browserEvent: event,
            actualIndex: undefined,
            item: undefined,
        };
    }

    /**
     * @description Universal standard event generation.
     */
    private __toEvent<E extends UIEvent>(e: E): { browserEvent: E, renderIndex: number | undefined, actualIndex: number | undefined, item: T | undefined } {
        const actualIndex = this.view.indexFromEventTarget(e.target);
        
        let renderIndex: number | undefined;
        let item: T | undefined;
        if (actualIndex !== undefined) {
            renderIndex = this.view.getRenderIndex(actualIndex);
            item = this.view.getItem(actualIndex);
        }

        return {
            browserEvent: e,
            renderIndex: renderIndex,
            actualIndex: actualIndex,
            item: item,
        };
    }

    /**
     * @description Try to find the first item forward starting from the given 
     * index that matches the match function.
     * @param index The start index.
     * @param fullLoop If loop all the items.
     * @param match The match function that matches the result. If not provided,
     * the next sibling will be returned.
     * @returns If not found, -1 returned.
     */
    private __findNextWithFilter(index: number, fullLoop: boolean, match?: (item: T) => boolean): number {
        const itemCount = this.getItemCount();
        
        for (let i = index; i < itemCount; i++) {
            
            if (index === itemCount && fullLoop === false) {
                return -1;
            }

            index = index % itemCount;

            const matched = !match || match(this.view.getItem(index));
            if (matched) {
                return index;
            }

            index++;
        }

        return -1;
    }

    /**
     * @description Try to find the first item backward starting from the given 
     * index that matches the match function.
     * @param index The start index.
     * @param fullLoop If loop all the items.
     * @param match The match function that matches the result. If not provided,
     * the next sibling will be returned.
     * @returns If not found, -1 returned.
     */
    private __findPrevWithFilter(index: number, fullLoop: boolean, match?: (item: T) => boolean): number {
        const itemCount = this.getItemCount();
        
        for (let i = index; i < itemCount; i++) {
            
            if (index < 0 && fullLoop === false) {
                return -1;
            }

            index = (itemCount + (index % itemCount)) % itemCount;

            const matched = !match || match(this.view.getItem(index));
            if (matched) {
                return index;
            }

            index--;
        }

        return -1;
    }
}
