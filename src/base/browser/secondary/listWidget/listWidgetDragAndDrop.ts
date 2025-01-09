import { IListDragEvent, IListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { addDisposableListener, DomUtility, EventType } from "src/base/browser/basic/dom";
import { Disposable, IDisposable, untrackDisposable } from "src/base/common/dispose";
import { IViewItem, IViewItemChangeEvent } from "src/base/browser/secondary/listView/listView";
import { requestAnimate } from "src/base/browser/basic/animation";
import { Arrays } from "src/base/common/utilities/array";
import { assert } from "src/base/common/utilities/panic";

export const enum DragOverEffect {
    Move,
    Copy,
}

export interface IDragOverResult {
    
    /**
     * Is the dragover event is allowed to be dropped.
     */
    readonly allowDrop: boolean;

    /**
     * The action of the dragover.
     * @default DragOverEffect.Move
     */
    readonly effect?: DragOverEffect;
}

/**
 * An interface that provides drag and drop support (dnd).
 */
export interface IListDragAndDropProvider<T> extends IDisposable {

    /**
     * @description Returns the user-defined data from the given item.
     * @param item The given item.
     * @returns Returns in a string format or null if it does not support drag.
     */
    getDragData(item: T): string | null;

    /**
     * @description Returns the tag of the dragging items for displaying purpose.
     * @param items The dragging items.
     * @returns A string-form of tag.
     */
    getDragTag(items: T[]): string;

    /**
     * @description Invokes when {@link EventType.dragstart} starts which 
     * indicates the user starts dragging an item.
     */
    onDragStart?(event: DragEvent): void;

    /**
     * @description Invokes when {@link EventType.dragover} happens which 
     * indicates a dragged item is being dragged over a valid drop target, every 
     * few hundred milliseconds.
     * @param event The current drag event.
     * @param currentDragItems The current dragging items.
     * @param targetOver The list target of the current drag event.
     * @param targetIndex The index of the list target of the current drag event.
     * 
     * @Note This method is called frequently, efficiency does matter here.
     * @note This function uses 0-based indexing.
     */
    onDragOver?(event: DragEvent, currentDragItems: T[], targetOver?: T, targetIndex?: number): IDragOverResult;

    /**
     * @description Invokes when {@link EventType.dragenter} happens which 
     * indicates a dragged item enters a valid drop target.
     * @param event The current drag event.
     * @param currentDragItems The current dragging items.
     * @param targetOver The list target of the current drag event.
     * @param targetIndex The index of the list target of the current drag event.
     * 
     * @note This function uses 0-based indexing.
     */
    onDragEnter?(event: DragEvent, currentDragItems: T[], targetOver?: T, targetIndex?: number): void;

    /**
     * @description Invokes when {@link EventType.dragleave} happens which 
     * indicates a dragged item leaves a valid drop target.
     * @param event The current drag event.
     * @param currentDragItems The current dragging items.
     * @param targetOver The list target of the current drag event.
     * @param targetIndex The index of the list target of the current drag event.
     * 
     * @note This function uses 0-based indexing.
     */
    onDragLeave?(event: DragEvent, currentDragItems: T[], targetOver?: T, targetIndex?: number): void;

    /**
     * @description Invokes when {@link EventType.drop} happens which indicates
     * drops on a valid target.
     * @param event The current drag event.
     * @param currentDragItems The current dragging items.
     * @param targetOver The list target of the current drag event.
     * @param targetIndex The index of the list target of the current drag event.
     * 
     * @note This function uses 0-based indexing.
     */
    onDragDrop?(event: DragEvent, currentDragItems: T[], targetOver?: T, targetIndex?: number): void;

    /**
     * @description Invokes when {@link EventType.dragend} happens which 
     * indicates a drag operation ends such as release the button or hitting the
     * ESC key.
     * @param event The current drag event.
     */
    onDragEnd?(event: DragEvent): void;
}

/**
 * A special interface for {@link IListWidget} usage.
 */
export interface IListWidgetDragAndDropProvider<T> extends IListDragAndDropProvider<T> {
    
    /**
     * @description Returns all the currently dragging items.
     * @param currItem The current mouse dragging (holding) item.
     */
    getDragItems(currItem: T): T[];
}

/**
 * @class A wrapper class for {@link IListWidget}.
 * @warn DO NOT USE DIRECTLY.
 */
class ListWidgetDragAndDropProvider<T> extends Disposable implements IListWidgetDragAndDropProvider<T> {

    private readonly view: IListWidget<T>;
    private readonly dnd: IListDragAndDropProvider<T>;

    constructor(view: IListWidget<T>, dnd: IListDragAndDropProvider<T>) {
        super();
        this.view = view;
        this.dnd = this.__register(dnd);
    }

    public getDragItems(currItem: T): T[] {
        const selected = this.view.getSelectedItems();
        // Only return selections when the user is dragging one of the selections
        if (Arrays.exist(selected, currItem)) {
            return selected;
        }
        return [currItem];
    }

    public getDragData(item: T): string | null {
        return this.dnd.getDragData(item);
    }

    public getDragTag(items: T[]): string {
        return this.dnd.getDragTag(items);
    }

    public onDragStart(event: DragEvent): void {
        this.dnd.onDragStart?.(event);
    }

    public onDragOver(event: DragEvent, currentDragItems: T[], targetOver?: T, targetIndex?: number): IDragOverResult {
        if (this.dnd.onDragOver) {
            return this.dnd.onDragOver(event, currentDragItems, targetOver, targetIndex);
        }
        return { allowDrop: false };
    }

    public onDragEnter(event: DragEvent, currentDragItems: T[], targetOver?: T, targetIndex?: number): void {
        if (this.dnd.onDragEnter) {
            return this.dnd.onDragEnter(event, currentDragItems, targetOver, targetIndex);
        }
    }

    public onDragLeave(event: DragEvent, currentDragItems: T[], targetOver?: T, targetIndex?: number): void {
        if (this.dnd.onDragLeave) {
            return this.dnd.onDragLeave(event, currentDragItems, targetOver, targetIndex);
        }
    }
    public onDragDrop(event: DragEvent, currentDragItems: T[], targetOver?: T, targetIndex?: number): void {
        if (this.dnd.onDragDrop) {
            return this.dnd.onDragDrop(event, currentDragItems, targetOver, targetIndex);
        }
    }

    public onDragEnd(event: DragEvent): void {
        this.dnd.onDragEnd?.(event);
    }
}

/**
 * @internal
 * @class An internal class that handles the dnd support of {@link IListWidget}.
 */
export class ListWidgetDragAndDropController<T> extends Disposable {

    // [field]

    private readonly _view: IListWidget<T>;
    private readonly _provider!: ListWidgetDragAndDropProvider<T>;

    /**
     * when drag starts this is the place to hold the dragging items.
     */
    private _currDragItems: T[] = [];
    private _allowDrop: boolean = false;
    private readonly _scrollOnEdgeController: ScrollOnEdgeController;

    // [constructor]

    constructor(
        view: IListWidget<T>,
        dragAndDropProvider: IListDragAndDropProvider<T>,
        toListDragEvent: (e: DragEvent) => IListDragEvent<T>,
        opts?: IScrollOnEdgeOptions,
    ) {
        super();
        this._view = view;
        this._provider = this.__register(new ListWidgetDragAndDropProvider(view, dragAndDropProvider));
        this._scrollOnEdgeController = this.__register(new ScrollOnEdgeController(view, opts));

        this.__enableDragAndDropSupport(toListDragEvent);
    }

    // [private helper methods]

    /**
     * @description Enables the drag and drop (dnd) support in {@link ListView}.
     */
    private __enableDragAndDropSupport(converter: (e: DragEvent) => IListDragEvent<T>): void {
        const dom = this._view.DOMElement;
        this.__register(addDisposableListener(dom, EventType.dragover, e => this.__onDragOver(converter(e))));
        this.__register(addDisposableListener(dom, EventType.drop, e => this.__onDragDrop(converter(e))));
        this.__register(addDisposableListener(dom, EventType.dragenter, e => this.__onDragEnter(converter(e))));
        this.__register(addDisposableListener(dom, EventType.dragleave, e => this.__onDragLeave(converter(e))));
        this.__register(addDisposableListener(dom, EventType.dragend, e => this.__onDragEnd(e)));

        // dragstart listener
        this.__register(this._view.onInsertItemInDOM((e: IViewItemChangeEvent<T>) => this.__initItemWithDragStart(e.item, e.index)));
        this.__register(this._view.onRemoveItemInDOM((e: IViewItemChangeEvent<T>) => e.item.dragStart?.dispose()));
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
        const userData = this._provider.getDragData(item.data);
        
        // make the HTMLElement actually draggable
        const row = assert(item.row);
        row.dom.draggable = !!userData;

        // add event listener
        if (userData) {
            item.dragStart = untrackDisposable(
                addDisposableListener(row.dom, EventType.dragstart, (e: DragEvent) => this.__onDragStart(item.data, userData, e))
            );
        }
    }
    
    private __onDragStart(data: T, userData: string, event: DragEvent): void {
        if (event.dataTransfer === null) {
            return;
        }

        // add tagging
        this._view.DOMElement.classList.add('dragging');

        const dragItems = this._provider.getDragItems(data);

        event.dataTransfer.effectAllowed = 'copyMove';
		event.dataTransfer.setData('text/plain', userData);
        
        // set the drag image
        {
            const tag = this._provider.getDragTag(dragItems);
            const dragImage = document.createElement('div');
            dragImage.className = 'list-drag-image';
            dragImage.innerHTML = tag;
            document.body.appendChild(dragImage);
            event.dataTransfer.setDragImage(dragImage, -10, -10);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        }
        
        this._currDragItems = dragItems;

        // reset hovering
        this._view.setHover([]);

        this._provider.onDragStart(event);
    }

    private __onDragOver(event: IListDragEvent<T>): void {
    
        // https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome
        event.browserEvent.preventDefault();

        // try scroll on edge animation
        this._scrollOnEdgeController.attemptScrollOnEdge(event.browserEvent);

        if (event.browserEvent.dataTransfer === null) {
            return;
        }
        
        // notify client
        const result = this._provider.onDragOver(event.browserEvent, this._currDragItems, event.item, event.actualIndex);
        this._allowDrop = result.allowDrop;
        
        if (!result.allowDrop) {
            event.browserEvent.dataTransfer.dropEffect = 'none';
            return;
        }

        // set drop type
        if (result.effect === DragOverEffect.Copy) {
            event.browserEvent.dataTransfer.dropEffect = 'copy';
        } else {
            event.browserEvent.dataTransfer.dropEffect = 'move';
        }
    }

    private __onDragDrop(event: IListDragEvent<T>): void {
        
        // do not allow to drop, we ignore the event.
        if (this._allowDrop === false) {
            return;
        }
        
        // get the data
        const dragItems = this._currDragItems;

        // clear dragover metadata
        this.__clearDragoverData();

        // no data to drop
        if (event.browserEvent.dataTransfer === null || dragItems.length === 0) {
            return;
        }

        // remove tagging
        this._view.DOMElement.classList.remove('dragging');

        // notify client
        event.browserEvent.preventDefault();
        this._provider.onDragDrop(event.browserEvent, dragItems, event.item, event.actualIndex);
    }

    private __onDragEnter(event: IListDragEvent<T>): void {
        // reset hovering
        this._view.setHover([]);
        // notify client
        this._provider.onDragEnter(event.browserEvent, this._currDragItems, event.item, event.actualIndex);
    }

    private __onDragLeave(event: IListDragEvent<T>): void {
        // notify client
        this._provider.onDragLeave(event.browserEvent, this._currDragItems, event.item, event.actualIndex);
    }

    private __onDragEnd(event: DragEvent): void {
        // remove tagging
        this._view.DOMElement.classList.remove('dragging');

        // clear dragover metadata
        this.__clearDragoverData();

        // notify client
        this._provider.onDragEnd(event);
    }

    private __clearDragoverData(): void {
        this._currDragItems = [];
        this._allowDrop = false;
        this._scrollOnEdgeController.clearCache();
    }

}

/**
 * Options for {@link ScrollOnEdgeController}.
 */
export interface IScrollOnEdgeOptions {

    /**
     * Distance in pixels from the edge to trigger auto-scroll.
     * @default 35
     */
    readonly edgeThreshold?: number;
}

class ScrollOnEdgeController extends Disposable {

    // [fields]

    private _scrollAnimationOnEdgeDisposable?: IDisposable;
    private _scrollAnimationMouseTop?: number;
    private readonly _view: IListWidget<unknown>;
    private readonly _opts: Required<IScrollOnEdgeOptions>;
    // [constructor]

    constructor(
        view: IListWidget<unknown>,
        opts?: IScrollOnEdgeOptions,
    ) {
        super();
        this._view = view;
        this._opts = {
            edgeThreshold: opts?.edgeThreshold ?? 35,
        };
    }

    // [public methods]

    public attemptScrollOnEdge(event: DragEvent): void {
        if (!this._scrollAnimationOnEdgeDisposable) {
            const top = DomUtility.Attrs.getViewportTop(this._view.DOMElement);
            this._scrollAnimationOnEdgeDisposable = requestAnimate(() => this.__animationOnEdge(top));
        }
        this._scrollAnimationMouseTop = event.pageY;
    }

    public clearCache(): void {
        this._scrollAnimationMouseTop = undefined;
        this._scrollAnimationOnEdgeDisposable?.dispose();
        this._scrollAnimationOnEdgeDisposable = undefined;
    }

    public override dispose(): void {
        super.dispose();
        this.clearCache();
    }

    // [private helper methods]

    private __animationOnEdge(viewTop: number): void {
        if (this._scrollAnimationMouseTop === undefined) {
            return;
        }

        const diff = this._scrollAnimationMouseTop - viewTop;
        
        const edgeThreshold  = this._opts.edgeThreshold;
        const lowerLimit     = edgeThreshold;
		const upperLimit     = Math.max(0, this._view.getViewportSize() - edgeThreshold);
        const scrollPosition = this._view.getScrollPosition();
        
        // scrolling on top
		if (diff < lowerLimit) {
			this._view.setScrollPosition(scrollPosition + Math.max(-14, Math.floor(0.3 * (diff - edgeThreshold))));
		} 
        // scrolling on bottom
        else if (diff > upperLimit) {
            this._view.setScrollPosition(scrollPosition + Math.min(14, Math.floor(0.3 * (diff - upperLimit))));
		}
    }
}