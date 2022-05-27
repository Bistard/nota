import { IListWidget } from "./listWidget";

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
     * @description // TODO
     */
    onDragStart?(): void;

}

/**
 * A special interface for {@link IListView} usage.
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

    public onDragStart(): void {
        if (this.dnd.onDragStart) {
            this.dnd.onDragStart();
        }
    }

}