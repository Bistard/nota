import { ISplitViewItemOpts } from "src/base/browser/secondary/splitView/splitView";
import { Priority } from "src/base/common/event";

/**
 * An interface only for {@link SplitViewItem}.
 */
export interface ISplitViewItem {
    
    readonly maximumSize: number;
    readonly minimumSize: number;
    
    /**
     * @description Updates the size of view and update the left / top of the 
     * view relatives to the whole window if the offset is given.
     * @param offset The given offset in numbers.
     */
    render(offset?: number): void;

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

    /**
     * @description Disposes the {@link HTMLElement} and all other internal data.
     */
    dispose(): void;
}

/**
 * @class An internal data structure used in {@link SplitView} for storing data
 * for each splited view.
 */
export class SplitViewItem implements ISplitViewItem {

    // [field]

    // TODO: use getter / setter so that it can be modified after ctor.
    public readonly maximumSize: number;
    public readonly minimumSize: number;
    
    private _disposed: boolean;
    private _container: HTMLElement;
    private _resizePriority: Priority;

    private _size: number;

    // [constructor]

    constructor(container: HTMLElement, opt: ISplitViewItemOpts) {
        this._disposed = false;
        
        container.appendChild(opt.element);
        
        this._container = container;
        this.maximumSize = opt.maximumSize;
        this.minimumSize = opt.minimumSize;
        if (opt.maximumSize < opt.minimumSize) {
            throw new Error('Provided maxSize is smaller than provided minSize');
        }
        
        this._resizePriority = opt.priority!;

        if (opt.initSize < this.minimumSize && opt.initSize > this.maximumSize) {
            throw new Error(`init size ${opt.initSize}px exceeds the min or max restriction: [${this.minimumSize}, ${this.maximumSize}]`);
        }
        this._size = opt.initSize;
        
    }

    // [public methods]

    public render(offset?: number): void {
        if (this._disposed) {
            return;
        }

        this._container.style.width = `${this._size}px`;
        if (offset) {
            this._container.style.left = `${offset}px`;
        }
    }

    public isFlexible(): boolean {
        return this.maximumSize > this.minimumSize;
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

    public getShrinkableSpace(): number {
        if (!this.isFlexible() || this._size < this.minimumSize) {
            return 0;
        }
        return this._size - this.minimumSize;
    }

    public getWideableSpace(): number {
        if (!this.isFlexible() || this.maximumSize < this._size) {
            return 0;
        }
        return this.maximumSize - this._size;
    }

    public getResizePriority(): Priority {
        return this._resizePriority;
    }

    public setResizePriority(priority: Priority): void {
        this._resizePriority = priority;
    } 

    public dispose(): void {
        if (this._disposed === false) {
			this._container.remove();
            this._disposed = true;
		}
    }

}