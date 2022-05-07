import { IListWidget } from "./listWidget";

/**
 * An interface that provides drag and drop support (dnd) to the {@link IListView}.
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

export interface IListWidgetDragAndDropProvider<T> extends IListDragAndDropProvider<T> {
    
    /**
     * @description Returns all the currently dragging items.
     * @param currItem The current mouse dragging (holding) item.
     */
    getDragItem(currItem: T): T[];

}

export class ListWidgetDragAndDropProvider<T> implements IListWidgetDragAndDropProvider<T> {

    private view: IListWidget<T>;
    private dnd: IListDragAndDropProvider<T>;

    constructor(view: IListWidget<T>, dnd: IListDragAndDropProvider<T>) {
        this.view = view;
        this.dnd = dnd;
    }

    public getDragItem(currItem: T): T[] {
        const selected = this.view.getSelections();
        if (selected.length > 0) {
            return selected;
        }
        return [currItem];
    }

    public getDragData(item: T): string | null {
        return this.dnd.getDragData(item);
    }

}