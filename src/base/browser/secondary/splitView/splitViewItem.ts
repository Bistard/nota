import { Orientation } from "src/base/browser/basic/dom";
import { Priority } from "src/base/common/event";
import { Numbers } from "src/base/common/utilities/number";
import { check, panic } from "src/base/common/utilities/panic";
import { isNullable } from "src/base/common/utilities/type";

/**
 * An interface for {@link ISplitViewItem} construction.
 */
export type ISplitViewItemOpts = {

    /**
     * The HTMLElement of the view.
     */
    readonly element: HTMLElement;

    /**
     * When adding/removing view, the view with higher priority will be resized 
     * first.
     * @default Priority.Low
     */
    priority?: Priority;

    /**
     * The display index of the view relative to the whole split view. Default 
     * inserts to the last.
     */
    index?: number;
    
} & (IResizableSplitViewItemOpts | IFixedSplitViewItemOpts);

export type IResizableSplitViewItemOpts = {
    
    readonly fixed?: undefined;

    /**
     * The minimum size (in pixel) of the view.
     *      - When orientation is 'horizontal', this means the minimum 'width'
     *          of this view during resizing.
     *      - When orientation is 'vertical', this means the minimum 'height'
     *          of this view during resizing.
     * 
     * @note when sets to `0` or sets to `null`, the view may reach invisible 
     *       during resizing.
     * @panic `minimumSize` cannot exceeds `maximumSize`.
     * @panic `minimumSize` cannot be negative number.
     */
    readonly minimumSize: number | null;

    /**
     * The maximum size (in pixel) of the view.
     *      - When orientation is 'horizontal', this means the maximum 'width'
     *          of this view during resizing.
     *      - When orientation is 'vertical', this means the maximum 'height'
     *          of this view during resizing.
     * 
     * @note when sets to `{@link Number.POSITIVE_INFINITY}` or `null`, the view
     *       may reach unlimited size during resizing.
     * @panic `maximumSize` cannot less than `minimumSize`.
     * @panic `maximumSize` cannot be negative number.
     */
    readonly maximumSize: number | null;

    /**
     * The initial size (in pixels) of the view. 
     *      - When orientation is 'horizontal', this means the initial 'width'
     *          of this view when constructing.
     *      - When orientation is 'vertical', this means the initial 'height'
     *          of this view when constructing.
     * 
     * If not provided, this will set 
     * to the `minimumSize` as default.
     */
    readonly initSize: number | null;
};

export type IFixedSplitViewItemOpts = {
    
    readonly fixed: true;

    /**
     * The fixed size (in pixel) of the view. It means the view will not able to
     * be resized and always has the same size:
     *      - When orientation is 'horizontal', this means the fixed 'width'
     *          of this view when constructing.
     *      - When orientation is 'vertical', this means the fixed 'height'
     *          of this view when constructing.
     */
    readonly fixedSize: number;
};


/**
 * An interface only for {@link SplitViewItem}.
 */
export interface ISplitViewItem {
    
    /**
     * @description Returns the raw HTMLElement.
     */
    getElement(): HTMLElement;

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

    private _container: HTMLElement;
    private _element: HTMLElement;

    private _maximumSize: number;
    private _minimumSize: number;
    private _size: number;
    private _resizePriority: Priority;
    
    private _disposed: boolean;

    // [constructor]

    constructor(container: HTMLElement, opt: ISplitViewItemOpts) {
        this._disposed = false;
        container.appendChild(opt.element);
        
        const resolvedMinimum = opt.fixed ? opt.fixedSize : opt.minimumSize;
        const resolvedMaximum = opt.fixed ? opt.fixedSize : opt.maximumSize;
        const resolvedInitial = opt.fixed ? opt.fixedSize : opt.initSize;

        this._container = container;
        this._element = opt.element;
        this._minimumSize = resolvedMinimum ?? 0;
        this._maximumSize = resolvedMaximum ?? Number.POSITIVE_INFINITY;
        if (this._maximumSize < this._minimumSize) {
            panic('[SplitViewItem] Provided maxSize is smaller than provided minSize');
        }

        check(this._maximumSize >= 0, '[SplitViewItem] maximumSize cannot < 0.');
        check(this._minimumSize >= 0, '[SplitViewItem] minimumSize cannot < 0.');
        
        this._resizePriority = opt.priority ?? Priority.Low;
        
        if (isNullable(resolvedInitial)) {
            this._size = this._minimumSize;
        } 
        else {
            if (resolvedInitial < this._minimumSize || resolvedInitial > this._maximumSize) {
                panic(`[SplitViewItem] init size ${resolvedInitial}px exceeds the min or max restriction: [${this._minimumSize}, ${this._maximumSize}]`);
            }
            this._size = resolvedInitial;
        }
    }

    // [public methods]

    public render(orientation: Orientation, offset?: number): void {
        check(this._disposed === false, '[SplitViewItem] Cannot render after disposed.');

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
        check(Numbers.within(newSize, this._minimumSize, this._maximumSize, true, true));
        this._size = newSize;
    }

    public updateSize(offset: number): void {
        const updated = this._size + offset;
        check(Numbers.within(updated, this._minimumSize, this._maximumSize, true, true));
        this._size = updated;
    }

    public getSize(): number {
        return this._size;
    }

    public getMaxSize(): number {
        return this._maximumSize;
    }

    public setMaxSize(newVal: number): void {
        check(newVal >= this._size);
        this._maximumSize = newVal;
    }

    public getMinSize(): number {
        return this._minimumSize;
    }

    public setMinSize(newVal: number): void {
        check(newVal <= this._size);
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