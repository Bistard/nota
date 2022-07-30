import { IViewOpts } from "src/base/browser/secondary/splitView/splitView";
import { Priority } from "src/base/common/event";

/**
 * An interface only for {@link SplitViewItem}.
 */
export interface ISplitViewItem {
    
    readonly maximumSize: number;
    readonly minimumSize: number;
    size: number;
    
    /**
     * @description Updates the size of view and update the left / top of the 
     * view relatives to the whole window if the offset is given.
     * @param offset The given offset in numbers.
     */
    render(offset?: number): void;

    /**
     * @description Checks if the view is resizable.
     */
    flexible(): boolean;

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

export class SplitViewItem implements ISplitViewItem {

    public readonly maximumSize: number;
    public readonly minimumSize: number;
    public size: number;

    private _resizePriority: Priority;
    private _disposed: boolean;
    private _container: HTMLElement;

    constructor(container: HTMLElement, opt: IViewOpts) {
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
        this.size = opt.initSize;
        
    }

    public render(offset?: number): void {
        console.log('given offset: ', offset);
        if (this._disposed) {
            return;
        }

        this._container.style.width = `${this.size}px`;
        if (offset) {
            this._container.style.left = `${offset}px`;
            console.log('actual left: ', this._container.style.left);
        }
        console.log('=======');
    }

    public flexible(): boolean {
        return this.maximumSize > this.minimumSize;
    }

    public getShrinkableSpace(): number {
        if (!this.flexible() || this.size < this.minimumSize) {
            return 0;
        }
        return this.size - this.minimumSize;
    }

    public getWideableSpace(): number {
        if (!this.flexible() || this.maximumSize < this.size) {
            return 0;
        }
        return this.maximumSize - this.size;
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