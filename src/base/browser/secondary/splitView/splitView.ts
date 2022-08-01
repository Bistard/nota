import { ISash, ISashEvent, Sash } from "src/base/browser/basic/sash/sash";
import { ISplitViewItem, SplitViewItem } from "src/base/browser/secondary/splitView/splitViewItem";
import { IDisposable, Disposable } from "src/base/common/dispose";
import { DomUtility, Orientation } from "src/base/common/dom";
import { Emitter, Priority } from "src/base/common/event";
import { IDimension } from "src/base/common/util/size";
import { Pair } from "src/base/common/util/type";

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
export class SplitView extends Disposable implements ISplitView {

    // [field]

    private element: HTMLElement;
    private sashContainer: HTMLElement;
    private viewContainer: HTMLElement;

    /** The total visible width / height of the {@link SplitView}. */
    private size: number;
    private readonly viewItems: ISplitViewItem[];
    private readonly sashItems: ISash[];

    private readonly _onDidSashReset = this.__register(new Emitter<number>());
    public readonly onDidSashReset = this._onDidSashReset.registerListener;

    // [constructor]

    constructor(container: HTMLElement, viewOpts?: ISplitViewItemOpts[]) {
        super();

        this.element = document.createElement('div');
        this.element.className = 'split-view';

        this.sashContainer = document.createElement('div');
        this.sashContainer.className = 'sash-container';

        this.viewContainer = document.createElement('div');
        this.viewContainer.className = 'view-container';

        this.size = DomUtility.getContentWidth(container);

        this.viewItems = [];
        this.sashItems = [];
        
        if (viewOpts) {
            for (const viewOpt of viewOpts) {
                this.__doAddView(viewOpt);
            }
        }
        
        this.__render();

        this.element.appendChild(this.viewContainer);
        this.element.appendChild(this.sashContainer);
        container.appendChild(this.element);
    }

    // [public methods]

    public override dispose(): void {
        super.dispose();
        this.viewItems.forEach(view => view.dispose());
        this.sashItems.forEach(sash => sash.dispose());
    }

    public addView(opt: ISplitViewItemOpts): void {
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

    public relayout(): void {
        // TODO
    }

    // [private helper methods]

    private __doAddView(opt: ISplitViewItemOpts): void {
        
        if (opt.index === undefined) {
            opt.index = this.viewItems.length;
        }

        if (opt.priority === undefined) {
            opt.priority = Priority.Low;
        }

        // view

        const newView = document.createElement('div');
        newView.className = 'split-view-item';
        
        const view = new SplitViewItem(newView, opt);
        this.viewItems.splice(opt.index, 0, view);
    
        // sash

        if (this.viewItems.length > 1) {
            const sash = new Sash(this.sashContainer, {
                orientation: Orientation.Vertical
            });
            sash.registerListeners();

            sash.onDidEnd(e => this.__onDidSashEnd(e, sash));
            sash.onDidMove(e => this.__onDidSashMove(e, sash));
            sash.onDidReset(() => {
                const index = this.sashItems.indexOf(sash);
                this._onDidSashReset.fire(index);
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
     * @description Recalculates all the positions of the views and sashes and
     * rerenders them all.
     */
    private __render(): void {
        this.__resizeViewsToFit();
        this.__doRenderViewsAndSashes();
    }

    /**
     * @description Recalculates all the sizes of views to fit the whole content 
     * of the split view.
     * 
     * @throws A {@link SplitViewSpaceError} will be thrown if the current 
     * contents cannot fit into the current split-view size.
     */
    private __resizeViewsToFit(): void {
        
        const splitViewSize = this.size;
        let currContentSize = 0;

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
            currContentSize += view.getSize();
        }

        // all the views fit perfectly, we do nothing.
        if (currContentSize === splitViewSize) {
            return;
        }

        if (low.length + normal.length + high.length === 0) {
            throw new SplitViewSpaceError(splitViewSize, currContentSize);
        }

        let offset: number;
        let complete = false;

        // left-most flexible views need to be shrink to fit the whole split-view.
        if (currContentSize > splitViewSize) {
            
            offset = currContentSize - splitViewSize; // TODO
            
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
            
            offset = splitViewSize - currContentSize;
            
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
     * @description Rerenders all the views and sashes positions after all the 
     * calculations are done.
     * 
     * @complexity O(n) - n: total number of split-view-items in memory.
     */
    private __doRenderViewsAndSashes(): void {
        let prevView = this.viewItems[0]!;
        let view = this.viewItems[0]!;
        view.render(0);
        
        let offset = view.getSize();
        for (let i = 1; i < this.viewItems.length; i++) {
            view = this.viewItems[i]!;
            view.render(offset);
            
            const sash = this.sashItems[i - 1]!;
            sash.position = offset - sash.size / 2;
            sash.relayout();
            sash.range.start = offset - Math.min(prevView.getShrinkableSpace(), view.getWideableSpace());
            sash.range.end = offset + Math.min(prevView.getWideableSpace(), view.getShrinkableSpace());
            
            offset += view.getSize();
            prevView = view;
        }
    }

    /**
     * @description Returns the adjacent split views given the {@link ISash}.
     * @param sash The given {@link ISash}.
     * @returns The two adjacent {@link ISplitViewItem}s.
     * 
     * @complexity O(n) - n: total number of sashes in memory.
     * @throws An exception will be thrown if the sash is not found.
     */
    private __getAdjacentViews(sash: ISash): Pair<ISplitViewItem, ISplitViewItem> {
        const beforeIdx = this.sashItems.indexOf(sash);
        
        if (beforeIdx === -1) {
            throw new Error('cannot find the given sash');
        }

        return [this.viewItems[beforeIdx]!, this.viewItems[beforeIdx + 1]!];
    }

    /**
     * @description Returns the position offset (left / top) of the given 
     * split-view-tiem relatives to the whole split view container.
     * @param viewItem The provided split-view-item.
     * 
     * @complexity O(n) - n: total number of split-view-items in memory.
     */
    private __getViewOffset(viewItem: ISplitViewItem): number {
        let offset = 0;

        for (let i = 0; i < this.viewItems.length; i++) {
            const currItem = this.viewItems[i]!;

            if (currItem === viewItem) {
                return offset;
            }

            offset += currItem.getSize();
        }

        throw new Error(`view not found in split-view: ${viewItem}`);
    }

    /**
     * @description Invokes when any of the sashes is moving (mouse-move).
     */
    private __onDidSashMove(event: ISashEvent, sash: ISash): void {
        const [prevView, nextView] = this.__getAdjacentViews(sash);
        prevView.updateSize(event.deltaX);
        nextView.updateSize(-event.deltaX);
        prevView.render();
        nextView.render(this.__getViewOffset(nextView));
    }

    /**
     * @description Invokes when any of the sashes is stoped dragging (mouse-up).
     * @param event The {@link ISashEvent} when the sash stopped dragging.
     * @param sash The target {@link ISash}.
     */
    private __onDidSashEnd(event: ISashEvent, sash: ISash): void {
        const currSashIndex = this.sashItems.indexOf(sash);
        
        const prevSash = this.sashItems[currSashIndex - 1];
        const nextSash = this.sashItems[currSashIndex + 1];
        
        if (prevSash) {
            const viewLeft = this.viewItems[currSashIndex - 1]!;
            const viewRight = this.viewItems[currSashIndex]!;
            const prevSashPosition = event.currentX - viewRight.getSize();
            prevSash.range.end = Math.min(event.currentX, prevSashPosition + viewLeft.getWideableSpace(),
            prevSashPosition + viewRight.getShrinkableSpace());
        }

        if (nextSash) {
            const viewLeft = this.viewItems[currSashIndex + 1]!;
            const viewRight = this.viewItems[currSashIndex + 2]!;
            const nextSashPosition = event.currentX + viewLeft.getSize();
            nextSash.range.start = Math.max(event.currentX, nextSashPosition - viewRight.getWideableSpace(), 
            nextSashPosition - viewLeft.getShrinkableSpace());
        }
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