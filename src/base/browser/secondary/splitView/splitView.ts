import { Sash } from "src/base/browser/basic/sash/sash";
import { ISplitViewItem, SplitViewItem } from "src/base/browser/secondary/splitView/splitViewItem";
import { IDisposable } from "src/base/common/dispose";
import { DomUtility, Orientation } from "src/base/common/dom";
import { Priority } from "src/base/common/event";
import { IDimension } from "src/base/common/util/size";

export interface IViewOpts {

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
     * The initial size of the view.
     */
    readonly initSize: number;
    
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
 * An interface only for {@link SplitView}.
 */
export interface ISplitView extends IDisposable {
    // TODO
}

/**
 * @description // TODO
 */
export class SplitView implements ISplitView {

    /**
     * The total visible width of the {@link SplitView}.
     */
    private size: number;
    private element: HTMLElement;
    private sashContainer: HTMLElement;
    private viewContainer: HTMLElement;

    private viewItems: ISplitViewItem[];
    private sashItems: Sash[];

    constructor(container: HTMLElement, views?: IViewOpts[]) {

        this.element = document.createElement('div');
        this.element.className = 'split-view';

        this.sashContainer = document.createElement('div');
        this.sashContainer.className = 'sash-container';

        this.viewContainer = document.createElement('div');
        this.viewContainer.className = 'view-container';

        this.size = DomUtility.getContentWidth(container);

        this.viewItems = [];
        this.sashItems = [];
        
        if (views) {
            for (const view of views) {
                this.__doAddView(view);
            }
        }
        
        this.__render();

        this.element.appendChild(this.viewContainer);
        this.element.appendChild(this.sashContainer);
        container.appendChild(this.element);
    }

    public dispose(): void {
        this.viewItems.forEach(view => view.dispose());
        this.sashItems.forEach(sash => sash.dispose());
    }

    public addView(opt: IViewOpts): void {
        this.__doAddView(opt);
        this.__render();
    } 

    /**
     * Invokes when the application window is resizing.
     * @param dimension The dimension of the window.
     */
    public onWindowResize(dimension: IDimension): void {
        // TODO
    }

    // [private helper methods]

    private __doAddView(opt: IViewOpts): void {
        
        if (opt.index === undefined) {
            opt.index = this.viewItems.length;
        }

        if (opt.priority === undefined) {
            opt.priority = Priority.Low;
        }

        // view

        const newView = document.createElement('div');
        newView.className = 'split-view-view';
        
        const view = new SplitViewItem(newView, opt);
        this.viewItems.splice(opt.index, 0, view);
    
        // sash

        if (this.viewItems.length > 1) {
            const sash = new Sash(this.sashContainer, {
                orientation: Orientation.Vertical
            });
            sash.create();
            sash.registerListeners();

            sash.onDidMove(e => {
                const [view1, view2] = this.__getAdjacentViews(sash);
                view1.updateSize(e.deltaX);
                view2.updateSize(-e.deltaX);
                view1.render();
                view2.render(this.__getViewOffset(view2) + e.deltaX);
                
                console.log('View1 size is: ', view1.getSize());
                console.log('View2 size is: ', view2.getSize());
                console.log('Their sum is: ', view1.getSize() + view2.getSize())

            });

            sash.onDidReset(() => {
                // TODO
                const [view1, view2] = this.__getAdjacentViews(sash);
                console.log('split-view: unfinished part reached');
                // view1.size = sash.defaultPosition;
                // view2.size -= e.deltaX;
                // view1.render();
                // view2.render(this.__getViewOffset(view2) + e.deltaX);
            });

            this.sashItems.splice(opt.index, 0, sash);
        }

        // rendering process

        if (this.viewItems.length === 1 || this.viewItems.length === opt.index + 1) {
            this.viewContainer.appendChild(newView);
        } else {
            this.viewContainer.insertBefore(newView, this.viewContainer.children.item(opt.index!));
        }
    }

    /**
     * @description 
     */
    private __render(): void {
        this.__resize();
        this.__doRender();
    }

    /**
     * @description Recalculates all the sizes of views to fit the whole content 
     * of the split view.
     */
    private __resize(): void {
        
        const splitViewSize = this.size;
        let contentSize = 0;

        // sort all the flexible views by their priority
        const low: ISplitViewItem[] = [];
        const normal: ISplitViewItem[] = [];
        const high: ISplitViewItem[] = [];

        for (const view of this.viewItems) {
            if (view.isFlexible()) {
                if (view.getResizePriority() === Priority.Low) {
                    low.push(view);
                } else if (view.getResizePriority() === Priority.Normal) {
                    normal.push(view);
                } else {
                    high.push(view);
                }
            }
            contentSize += view.getSize();
        }

        // all the views fit perfectly, we do nothing.
        if (contentSize === splitViewSize) {
            return;
        }

        if (low.length + normal.length + high.length === 0) {
            throw new SplitViewSpaceError(splitViewSize, contentSize);
        }

        let offset: number;
        let complete = false;

        // left-most flexible views need to be shrink to fit the whole split-view.
        if (contentSize > splitViewSize) {
            
            offset = contentSize - splitViewSize; // TODO
            
            for (const group of [high, normal, low]) { 
                for (const flexView of group) {
                    const spare = flexView.getShrinkableSpace(); // TODO
                    if (spare >= offset) {
                        flexView.updateSize(-offset); // TODO
                        offset = 0;
                        complete = true;
                        break;
                    }
                    
                    flexView.updateSize(-spare); // TODO
                    offset -= spare;
                }
    
                if (complete) break;
            }

            if (offset === 0) {
                return;
            }
            
            // flexible views try their best but still too big to be hold.
            throw new SplitViewSpaceError(splitViewSize, splitViewSize + offset);
        }

        // left-most flexible views need to be increased to fit the whole split-view.
        else {
            
            offset = splitViewSize - contentSize;
            
            for (const group of [high, normal, low]) {
                for (const flexView of group) {
                    const spare = flexView.getWideableSpace();
                    if (spare >= offset) {
                        flexView.updateSize(offset);
                        offset = 0;
                        complete = true;
                        break;
                    }
                    
                    flexView.updateSize(spare);
                    offset -= spare;
                }

                if (complete) break;
            }

            if (offset === 0) {
                return;
            }

            // flexible views try their best but still too small to fit the entire view.
            throw new SplitViewSpaceError(splitViewSize, splitViewSize - offset);
        }
    }

    /**
     * @description 
     */
    private __doRender(): void {
        
        let offset = 0;
        for (let i = 0; i < this.viewItems.length; i++) {
            const view = this.viewItems[i]!;
            view.render(offset);

            offset += view.getSize();

            if (i != this.viewItems.length - 1) {
                const sash = this.sashItems[i]!;
                sash.relayout(offset - sash.size / 2);
            }
        }
    }

    /**
     * @description Returns the adjacent split views given the {@link Sash}.
     */
    private __getAdjacentViews(sash: Sash): [ISplitViewItem, ISplitViewItem] {
        const before = this.sashItems.indexOf(sash);
        return [this.viewItems[before]!, this.viewItems[before + 1]!];
    }

    /**
     * @description Returns the position (offset) of the given split view 
     * relatives to the whole split view container.
     */
    private __getViewOffset(view: ISplitViewItem): number {
        let offset = 0;

        for (let i = 0; i < this.viewItems.length; i++) {
            const viewItem = this.viewItems[i]!;

            if (viewItem === view) {
                return offset;
            }

            offset += viewItem.getSize();
        }

        throw new Error(`view not found in split-view: ${view}`);
    }
}

export class SplitViewSpaceError extends Error {
    constructor(
        splitViewSize: number,
        contentSize: number,
    ) {
        super(`split-view space error: cannot fit all the views (${contentSize}px) into split-view (${splitViewSize}px)`);
    }
}