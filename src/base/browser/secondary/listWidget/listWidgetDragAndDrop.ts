import { IListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { EventType } from "src/base/common/dom";

/**
 * An interface that provides drag and drop support (dnd).
 */
export interface IListDragAndDropProvider<T> {

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
     * few hundred milliseconds. It returns a boolean indicates if allow to drop 
     * the current selected items on the target.
     * @param event The current drag event.
     * @param currentDragItems The current dragging items.
     * @param targetOver The list target of the current drag event.
     * @param targetIndex The index of the list target of the current drag event.
     */
    onDragOver?(event: DragEvent, currentDragItems: T[], targetOver?: T, targetIndex?: number): boolean;

    /**
     * @description Invokes when {@link EventType.dragenter} happens which 
     * indicates a dragged item enters a valid drop target.
     * @param event The current drag event.
     * @param currentDragItems The current dragging items.
     * @param targetOver The list target of the current drag event.
     * @param targetIndex The index of the list target of the current drag event.
     */
    onDragEnter?(event: DragEvent, currentDragItems: T[], targetOver?: T, targetIndex?: number): void;

    /**
     * @description Invokes when {@link EventType.dragleave} happens which 
     * indicates a dragged item leaves a valid drop target.
     * @param event The current drag event.
     * @param currentDragItems The current dragging items.
     * @param targetOver The list target of the current drag event.
     * @param targetIndex The index of the list target of the current drag event.
     */
    onDragLeave?(event: DragEvent, currentDragItems: T[], targetOver?: T, targetIndex?: number): void;

    /**
     * @description Invokes when {@link EventType.drop} happens which indicates
     * drops on a valid target.
     * @param event The current drag event.
     * @param currentDragItems The current dragging items.
     * @param targetOver The list target of the current drag event.
     * @param targetIndex The index of the list target of the current drag event.
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
 * @wran DO NOT USE DIRECTLY.
 */
export class ListWidgetDragAndDropProvider<T> implements IListWidgetDragAndDropProvider<T> {

    private view: IListWidget<T>;
    private dnd: IListDragAndDropProvider<T>;

    constructor(view: IListWidget<T>, dnd: IListDragAndDropProvider<T>) {
        this.view = view;
        this.dnd = dnd;
    }

    public getDragItems(currItem: T): T[] {
        const selected = this.view.getSelectedItems();
        if (selected.length > 0) {
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
        if (this.dnd.onDragStart) {
            this.dnd.onDragStart(event);
        }
    }

    public onDragOver(event: DragEvent, currentDragItems: T[], targetOver?: T, targetIndex?: number): boolean {
        if (this.dnd.onDragOver) {
            return this.dnd.onDragOver(event, currentDragItems, targetOver, targetIndex);
        }
        return false;
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
        if (this.dnd.onDragEnd) {
            return this.dnd.onDragEnd(event);
        }
    }
}