import { IViewOpts } from "src/base/browser/secondary/splitView/splitView";
import { Priority } from "src/base/common/event";


export class SplitViewItem {

    public readonly maximumSize: number;
    public readonly minimumSize: number;
    public size: number;

    public resizePriority: Priority;

    private disposed: boolean;
    private container: HTMLElement;

    constructor(container: HTMLElement, opt: IViewOpts) {
        this.disposed = false;
        
        container.appendChild(opt.element);
        
        this.container = container;
        this.maximumSize = opt.maximumSize;
        this.minimumSize = opt.minimumSize;
        if (opt.maximumSize < opt.minimumSize) {
            throw new Error('Provided maxSize is smaller than provided minSize');
        }
        
        this.resizePriority = opt.priority!;

        if (opt.initSize < this.minimumSize && opt.initSize > this.maximumSize) {
            throw new Error(`init size ${opt.initSize}px exceeds the min or max restriction: [${this.minimumSize}, ${this.maximumSize}]`);
        }
        this.size = opt.initSize;
        
    }

    public render(offset?: number): void {
        if (this.disposed) {
            return;
        }

        this.container.style.width = `${this.size}px`;
        if (offset) {
            this.container.style.left = `${offset}px`;
        }
    }

    public flexible(): boolean {
        return this.maximumSize > this.minimumSize;
    }

    public shrinkableSpace(): number {
        return this.size - this.minimumSize;
    }

    public wideableSpace(): number {
        return this.maximumSize - this.size;
    }

    public dispose(): void {
        if (this.disposed === false) {
			this.container.remove();
            this.disposed = true;
		}
    }

}