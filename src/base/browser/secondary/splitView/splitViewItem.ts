import { Orientation } from "src/base/browser/basic/dom";
import { Priority } from "src/base/common/event";
import { panic } from "src/base/common/utilities/panic";

/**
 * An interface for {@link ISplitViewItem} construction.
 */
export interface ISplitViewItemOpts {

    /**
     * The HTMLElement of the view.
     */
    readonly element: HTMLElement;

    /**
     * The minimum size of the view, when sets to 0, the view may reach invisible.
     */
    readonly minimumSize: number;

    /**
     * The maximum size of the view, when sets to {@link Number.POSITIVE_INFINITY}, 
     * the size will have no restrictions.
     */
    readonly maximumSize: number;

    /**
     * The initial size of the view. If not provided, set to the minimum size as
     * default.
     */
    readonly initSize?: number;
    
    /**
     * When adding/removing view, the view with higher priority will be resized 
     * first.
     * Default is {@link Priority.Low}.
     */
    priority?: Priority;

    /**
     * The index of the view. Default inserts to the last.
     */
    index?: number;
}


/**
 * An interface only for {@link SplitViewItem}.
 */
export interface ISplitViewItem {
    
    /**
     * @description Updates the size of view and update the left / top of the 
     * view relatives to the whole window if the offset is given.
     * @param offset The given offset in numbers.
     */
    render(orientation: Orientation, offset?: number): void;

    /**
     * @description Checks if the view is resizable.
     */
    isFlexible(): boolean;

    /**
     * @description Sets the width / height of the view.
     * @param newSize The given new size in number.
     */
    setSize(newSize: number): void;

    /**
     * @description Sets the width / height of the view with the given offset.
     * @param offset The given offset size in number.
     */
    updateSize(offset: number): void;

    /**
     * @description Returns the width / height of the view.
     */
    getSize(): number;

    /**
     * @description Returns the maximum size of the view.
     */
    getMaxSize(): number;

    /**
     * @description Sets the maximum size of the view.
     */
    setMaxSize(newVal: number): void;

    /**
     * @description Returns the minimum size of the view.
     */
    getMinSize(): number;

    /**
     * @description Sets the minimum size of the view.
     */
    setMinSize(newVal: number): void;

    /**
     * @description Returns the shrinkable size of the view (if the view is able
     * to resize to the left / top).
     * @returns The shrinkable size in number.
     */
    getShrinkableSpace(): number;
    
    /**
     * @description Returns the wideable size of the view (if the view is able
     * to resize to the right / bottom).
     * @returns The wideable size in number.
     */
    getWideableSpace(): number;

    /**
     * @description Returns the resize priority of the view.
     */
    getResizePriority(): Priority;

    /**
     * @description Sets the resize priority of the view.
     * @param priority The given {@link Priority}.
     */
    setResizePriority(priority: Priority): void;

    getElement(): HTMLElement;

    /**
     * @description Disposes the {@link HTMLElement} and all other internal data.
     */
    dispose(): void;
}

/**
 * @class An internal data structure used in {@link SplitView} for storing data
 * for each splitted view.
 */
export class SplitViewItem implements ISplitViewItem {

    // [field]

    private _maximumSize: number;
    private _minimumSize: number;
    
    private _disposed: boolean;
    private _container: HTMLElement;
    private _resizePriority: Priority;

    private _element: HTMLElement;
    private _size: number;

    // [constructor]

    constructor(container: HTMLElement, opt: ISplitViewItemOpts) {
        this._disposed = false;
        
        container.appendChild(opt.element);
        
        this._container = container;
        this._element = opt.element;
        this._maximumSize = opt.maximumSize;
        this._minimumSize = opt.minimumSize;
        if (opt.maximumSize < opt.minimumSize) {
            panic('Provided maxSize is smaller than provided minSize');
        }
        
        this._resizePriority = opt.priority ?? Priority.Low;
        if (opt.initSize !== undefined) {
            
            if (opt.initSize < this._minimumSize || opt.initSize > this._maximumSize) {
                panic(`init size ${opt.initSize}px exceeds the min or max restriction: [${this._minimumSize}, ${this._maximumSize}]`);
            }
            this._size = opt.initSize;
        } else {
            this._size = this._minimumSize;
        }
    }

    // [public methods]

    public render(orientation: Orientation, offset?: number): void {
        if (this._disposed) {
            return;
        }

        // The splitView has a horizontal layout
        if (orientation === Orientation.Horizontal) {
            this._container.style.width = `${this._size}px`;
            if (offset !== undefined) {
                this._container.style.left = `${offset}px`;
            }
        } 
        // The splitView has a vertical layout
        else {
            this._container.style.height = `${this._size}px`;
            if (offset !== undefined) {
                this._container.style.top = `${offset}px`;
            }
        }
        
    }

    public isFlexible(): boolean {
        return this._maximumSize > this._minimumSize;
    }

    public setSize(newSize: number): void {
        this._size = newSize;
    }

    public updateSize(offset: number): void {
        this._size += offset;
    }

    public getSize(): number {
        return this._size;
    }

    public getMaxSize(): number {
        return this._maximumSize;
    }

    public setMaxSize(newVal: number): void {
        this._maximumSize = newVal;
    }

    public getMinSize(): number {
        return this._minimumSize;
    }

    public setMinSize(newVal: number): void {
        this._minimumSize = newVal;
    }

    public getShrinkableSpace(): number {
        if (!this.isFlexible() || this._size < this._minimumSize) {
            return 0;
        }
        return this._size - this._minimumSize;
    }

    public getWideableSpace(): number {
        if (!this.isFlexible() || this._maximumSize < this._size) {
            return 0;
        }
        return this._maximumSize - this._size;
    }

    public getResizePriority(): Priority {
        return this._resizePriority;
    }

    public setResizePriority(priority: Priority): void {
        this._resizePriority = priority;
    } 

    public getElement(): HTMLElement {
        return this._element;
    }

    public dispose(): void {
        if (this._disposed === false) {
			this._container.remove();
            this._disposed = true;
		}
    }

}