import { IViewOpts } from "src/base/browser/secondary/splitView/splitView";
import { Priority } from "src/base/common/event";


export class SplitViewItem {

    public readonly maximumSize: number;
    public readonly minimumSize: number;
    public size: number;

    public resizePriority: Priority;

    private container: HTMLElement;

    constructor(container: HTMLElement, opt: IViewOpts) {
        container.appendChild(opt.element);
        
        this.container = container;
        this.maximumSize = opt.maximumSize;
        this.minimumSize = opt.minimumSize;
        
        this.resizePriority = opt.priority!;

        if (opt.initSize < this.minimumSize && opt.initSize > this.maximumSize) {
            throw new Error(`init size ${opt.initSize}px exceeds the min or max restriction: [${this.minimumSize}, ${this.maximumSize}]`);
        }
        this.size = opt.initSize;
        
    }

    public render(offset: number): void {
        this.container.style.width = `${this.size}px`;
        this.container.style.left = `${offset}px`;
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

}