// import "src/base/browser/basic/contextMenu/contextMenu.scss";
import { addDisposableListener, DomUtility, EventType } from "src/base/browser/basic/dom";
import { FastElement } from "src/base/browser/basic/fastElement";
import { Disposable, DisposableManager, IDisposable } from "src/base/common/dispose";
import { Range } from "src/base/common/range";
import { IDomBox } from "src/base/common/util/size";

export interface IAnchor {
    readonly x: number;
    readonly y: number;

    // we can specify the anchor to have dimension
    readonly width?: number;
    readonly height?: number;
}

/**
 * Determines the primary axis of positioning (either vertical or horizontal) 
 * when calculating the view's position.
 * 
 * For an example, when sets to horizontal, the program will first to decide 
 * either place the view on the left or right relative to the anchor （based on 
 * {@link AnchorHorizontalPosition}. If the view intersects with the anchor, the 
 * secondary positioning strategy (vertical) is applied to the vertical axis to 
 * avoid overlapping (based on {@link AnchorVerticalPosition}).
 */
export const enum AnchorPrimaryAxisAlignment {
    Horizontal,
    Vertical,
}

export const enum AnchorHorizontalPosition {
    Left,
    Right,
}

export const enum AnchorVerticalPosition {
    Above,
    Below,
}

const enum AnchorAbstractPosition {
    Before,
    After,
}

interface IAnchorBox {
    readonly offset: number;
	readonly size: number;
	readonly direction: AnchorAbstractPosition;
	readonly mode: AnchorMode;
}

const enum AnchorMode {
    /**
     * Aligned with the anchor element.
     */
    Align,
    
    /**
     * Positioned to avoid overlapping the anchor element.
     */
    Avoid,
}

export interface IContextMenuDelegateBase {
    /**
     * @description The delegate returns an anchor for the context menu to build
     * the coordinates when rendering.
     */
    getAnchor(): HTMLElement | IAnchor;

    /**
     * Determines the primary axis of positioning (either vertical or horizontal) 
     * when calculating the view's position.
     * @default AnchorPrimaryAxisAlignment.Vertical
     */
    readonly primaryAlignment?: AnchorPrimaryAxisAlignment;

    /**
     * When determining the position in horizontal axis, place either on the 
     * left or right relative to the anchor.
     * @default AnchorHorizontalPosition.Right
     */
    readonly horizontalPosition?: AnchorHorizontalPosition;
    
    /**
     * When determining the position in vertical axis, place either on the 
     * above or below relative to the anchor.
     * @default AnchorHorizontalPosition.Below
     */
    readonly verticalPosition?: AnchorVerticalPosition;
}

/**
 * A delegate to provide external data and functionalities to help to show the
 * context menu.
 */
export interface IContextMenuDelegate extends IContextMenuDelegateBase {
    
    /**
     * @description The delegate decides how to render the content of the 
     * context menu.
     * @param container The container contains all the rendered results by the
     *                  delegate.
     * @returns Returns a disposable to be disposed when destroyed.
     */
    render(container: HTMLElement): IDisposable | undefined;

    /**
     * @description Invokes before the context menu gets destoryed (hidden).
     */
    onBeforeDestroy(): void;
}

/**
 * An interface only for {@link ContextMenu}.
 */
export interface IContextMenu extends IDisposable {
    
    /**
     * @description Place the context menu under the given container.
     * @param container The container that contains the context menu.
     */
    setContainer(container: HTMLElement): void;
    
    /**
     * @description Show up a context menu by the given delegate under the 
     * current container.
     * @param delegate A delegate that provides external data and functionalities.
     * 
     * @note If not under any container, this will not show up.
     */
    show(delegate: IContextMenuDelegate): void;

    /**
     * @description Destroys the current context menu if presented.
     */
    destroy(): void;

    /**
     * @description Is the context menu is visible (un-destroyed).
     */
    visible(): boolean;
}

/**
 * @class A {@link ContextMenu} can be placed under a given container. Then can
 * be shown under that container through the rendering method provided by a
 * {@link IContextMenuDelegate}.
 * 
 * @note The rendering process is abstracted out through a delegator. Usually
 * is rendered based on {@link Menu}.
 * 
 * @note When showing a {@link ContextMenu}, the position of the view will be
 * adjusted due to the anchor position and the viewport size to ensure the view 
 * is properly fit in and overlap avoided.
 * 
 * @note The default position type is 'absolute'.
 */
export class ContextMenu extends Disposable implements IContextMenu {

    // [constants]

    public static readonly CLASS_NAME = 'context-menu';

    // [fields]

    private readonly _element: FastElement<HTMLElement>;
    
    private _currContainer?: HTMLElement;
    private _currDelegate?: IContextMenuDelegate;
    
    private _currContainerDisposables: IDisposable = Disposable.NONE;
    private _currRenderContentDisposables: IDisposable = Disposable.NONE;

    // [constructor]

    constructor(container: HTMLElement) {
        super();
        this._element = this.__register(new FastElement(document.createElement('div')));
        this._element.setClassName(ContextMenu.CLASS_NAME);
        this._element.setPosition('absolute');

        DomUtility.Modifiers.hide(this._element.element);
        this.setContainer(container);
    }

    // [public methods]

    public setContainer(newContainer: HTMLElement): void {
        
        // remove the context menu from the old container
        if (this._currContainer) {
            this._currContainerDisposables.dispose();
            this._currContainer.removeChild(this._element.element);
            this._currContainer = undefined;
        }

        // set the new container
        this._currContainer = newContainer;
        this._currContainer.appendChild(this._element.element);
        
        // register the context menu events
        {
            const disposables = new DisposableManager();
        
            disposables.register(
                addDisposableListener(this._element.element, EventType.click, (e) => {
                    if (!DomUtility.Elements.isAncestor(this._element.element, <Node>e.target)) {
                        this.destroy();
                    }
                })
            );

            this._currContainerDisposables = disposables;
        }
    }

    public show(delegate: IContextMenuDelegate): void {
        
        // the view is not placed under any container
        if (!this._currContainer) {
            return;
        }

        // destroy the current context menu if already visible
        if (this.visible()) {
            this.destroy();
        }

        // cleans the previous rendered result
        this.__resetViewAttrs();

        // enable show-up 
        DomUtility.Modifiers.show(this._element.element);

        // render the content of the context menu
        this._currDelegate = delegate;
        this._currRenderContentDisposables = this._currDelegate.render(this._element.element) || Disposable.NONE;

        // layout the context menu
        this.__layout(delegate);
    }

    public destroy(): void {
        const oldDelegate = this._currDelegate;
        this._currDelegate = undefined;

        // tells the delegate before actual hidden
        if (oldDelegate?.onBeforeDestroy) {
            oldDelegate.onBeforeDestroy();
        }

        // unrender
        this._currRenderContentDisposables.dispose();

        // hide the context menu
        DomUtility.Modifiers.hide(this._element.element);
    }

    public visible(): boolean {
        return !!this._currDelegate;
    }

    // [private methods]

    private __resetViewAttrs(): void {
        DomUtility.Modifiers.clearChildrenNodes(this._element.element);
        this._element.setClassName(ContextMenu.CLASS_NAME);
        this._element.setTop(0);
		this._element.setLeft(0);
		this._element.setZIndex(999);
    }

    private __layout(delegate: IContextMenuDelegate): void {
        
        if (!this.visible()) {
            return;
        }

        if (!this._currContainer) {
            return;
        }
        
        const [top, left] = this.__calculateViewPosition(delegate);

        const containerPos = DomUtility.Positions.getNodePagePosition(this._currContainer);
        this._element.setTop(top - containerPos.top);
        this._element.setLeft(left - containerPos.left);
    }

    private __calculateViewPosition(delegate: IContextMenuDelegate): [number, number] {
        let top: number;
        let left: number;

        const anchorBox = this.__getAnchorBox(delegate);
        const elementHeight = DomUtility.Attrs.getTotalHeight(this._element.element);
        const elementWidth = DomUtility.Attrs.getTotalWidth(this._element.element);

        const primaryAxisAlignment = delegate.primaryAlignment ?? AnchorPrimaryAxisAlignment.Vertical;
        const horizontalPos = delegate?.horizontalPosition ?? AnchorHorizontalPosition.Right;
        const verticalPos = delegate?.verticalPosition ?? AnchorVerticalPosition.Below;

        // consider the vertical placement first
        if (primaryAxisAlignment === AnchorPrimaryAxisAlignment.Vertical) {
            let currMode: AnchorMode = AnchorMode.Avoid;

            // place vertical first
            const verticalAnchor: IAnchorBox = {
                offset: anchorBox.top - window.scrollY,
                size: anchorBox.height,
                direction: verticalPos === AnchorVerticalPosition.Below ? AnchorAbstractPosition.Before : AnchorAbstractPosition.After,
                mode: currMode,
            };
            top = window.scrollY + this.__adjustOneAxisPosition(window.innerHeight, elementHeight, verticalAnchor);

            /**
             * If the element intersects vertically with anchor, we must 
             * avoid the anchor.
             */
            if (Range.intersection(
                { 
                    start: top, 
                    end: top + elementHeight 
                }, 
                { 
                    start: verticalAnchor.offset, 
                    end: verticalAnchor.offset + verticalAnchor.size 
                })
            ) {
                currMode = AnchorMode.Avoid;
            } else {
                currMode = AnchorMode.Align;
            }

            // place horizontal second
            const horizontalAnchor: IAnchorBox = {
                offset: anchorBox.left,
                size: anchorBox.width,
                direction: horizontalPos === AnchorHorizontalPosition.Left ? AnchorAbstractPosition.Before : AnchorAbstractPosition.After,
                mode: currMode,
            };
            left = this.__adjustOneAxisPosition(window.innerWidth, elementWidth, horizontalAnchor);
        }

        // consider the horizontal placement first
        else {
            let currMode: AnchorMode = AnchorMode.Avoid;

            // place horizontal first
            const horizontalAnchor: IAnchorBox = {
                offset: anchorBox.left,
                size: anchorBox.width,
                direction: horizontalPos === AnchorHorizontalPosition.Left ? AnchorAbstractPosition.Before : AnchorAbstractPosition.After,
                mode: currMode,
            };
            left = this.__adjustOneAxisPosition(window.innerWidth, elementWidth, horizontalAnchor);
            
            /**
             * If the element intersects horizontally with anchor, we must 
             * avoid the anchor.
             */
            if (Range.intersection(
                { 
                    start: left, 
                    end: left + elementWidth
                }, 
                { 
                    start: horizontalAnchor.offset, 
                    end: horizontalAnchor.offset + horizontalAnchor.size 
                }
            )) {
                currMode = AnchorMode.Avoid;
            } else {
                currMode = AnchorMode.Align;
            }

            // place vertical second
            const verticalAnchor: IAnchorBox = {
                offset: anchorBox.top,
                size: anchorBox.height,
                direction: verticalPos === AnchorVerticalPosition.Below ? AnchorAbstractPosition.Before : AnchorAbstractPosition.After,
                mode: currMode,
            };
            top = window.pageYOffset + this.__adjustOneAxisPosition(window.innerHeight, elementHeight, verticalAnchor);
        }

        return [top, left];
    }

    /**
     * @description Aims to position the context menu optimally based on the 
     * available space.
     * @param viewportSize The view port size (width or height).
     * @param viewSize The view size (width or height).
     * @param anchorBox Geometry about the anchor.
     * @returns A number where to position the context menu based on the assumed 
     *          axis.
     */
    private __adjustOneAxisPosition(viewportSize: number, viewSize: number, anchorBox: IAnchorBox): number {
        
        /**
         * represents the avaliable position boundary along the given axis after 
         * the anchor element.
         */
        const afterAnchorPositionBoundary = (
            
            anchorBox.mode === AnchorMode.Align
            
            /**
             * Align: the after boundary is at the beginning of the anchor 
             * element, and the view will be aligned with the beginning of the 
             * anchor.
             */
             ? anchorBox.offset

            /**
             * Avoid: the after boundary is at the end of the anchor element, 
             * and the view will be positioned after the anchor element to avoid 
             * overlapping.
             */
             : anchorBox.offset + anchorBox.size
        );

        /**
         * represents the avaliable position boundary along the given axis 
         * before the anchor element.
         */
        const beforeAnchorPositionBoundary = 
            
            (anchorBox.mode === AnchorMode.Align
            
            /**
             * Align: the before boundary is at the end of the anchor element,
             * and the view will be aligned with the end of the anchor.
             */
             ? anchorBox.offset + anchorBox.size
            
            /**
             * Avoid: the before boundary is at the beginning of the anchor
             * element, and the view will be positioned before the beginning of
             * the anchor element to avoid overlapping.
             */
             : anchorBox.offset
        );
        
        
        /**
         * Attempts to position the view before the anchor element along with
         * the given axis.
         */
        if (anchorBox.direction === AnchorAbstractPosition.Before) {
            
            // happy case, lay it out after the anchor.
            if (viewSize + afterAnchorPositionBoundary <= viewportSize) {
                return afterAnchorPositionBoundary;
            }
    
            // ok case, lay it out before the anchor.
            if (viewSize <= beforeAnchorPositionBoundary) {
                return beforeAnchorPositionBoundary - viewSize;
            }
    
            // sad case, lay it over the anchor.
            return Math.max(viewportSize - viewSize, 0);
        }

        /**
         * Attempts to position the view after the anchor element along with
         * the given axis.
         */
        else {
            // happy case, lay it out before the anchor.
            if (viewSize <= beforeAnchorPositionBoundary) {
                return beforeAnchorPositionBoundary - viewSize;
            }
    
            // ok case, lay it out after the anchor.
            if (viewSize <= viewportSize - afterAnchorPositionBoundary) {
                return afterAnchorPositionBoundary;
            }
    
            // sad case, lay it over the anchor.
            return 0;
        }
    }

    private __getAnchorBox(delegate: IContextMenuDelegate): IDomBox {
        
        let box: IDomBox;
        const anchor = delegate.getAnchor();

        // if the anchor is an node, we find the dimension of it.
        if (DomUtility.Elements.isHTMLElement(anchor)) {
            const anchorDimension = DomUtility.Positions.getNodePagePosition(anchor);
            box = {
                top: anchorDimension.top,
                left: anchorDimension.left,
                width: anchorDimension.width,
                height: anchorDimension.height,
            };
        } 
        // if the anchor is just a point,
        else {
            box = {
                top: anchor.y,
                left: anchor.x,
                width: anchor.width || 1,
                height: anchor.height || 1
            };
        }

        return box;
    }
}
