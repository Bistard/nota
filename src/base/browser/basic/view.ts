
export const enum AnchorMode {
    /**
     * Aligned with the anchor element.
     */
    Align,
    
    /**
     * Positioned to avoid overlapping the anchor element.
     */
    Avoid,
}

export const enum AnchorAbstractPosition {
    Before,
    After,
}

export interface IAnchorBox {
    readonly offset: number;
	readonly size: number;
	readonly direction: AnchorAbstractPosition;
	readonly mode: AnchorMode;
}

/**
 * @description Calculates the position of a view along a single axis (width or 
 * height) concerning an anchor element based on a variety of factors, including 
 * available space in the viewport, the view size, and the anchor element's 
 * properties. This function is particularly useful for positioning UI elements 
 * such as tooltips, drop-down menus, or pop-up dialogs in a manner that ensures 
 * optimal alignment and visibility. 
 * 
 * @note Depending on the anchor element's properties, such as mode (Align or 
 * Avoid) and direction (Before or After), the function will either align the 
 * view with the anchor element or position it to avoid overlapping, ensuring 
 * the view is placed correctly within the available space of the viewport.
 * 
 * @param viewportSize The view port size (width or height).
 * @param viewSize The view size (width or height).
 * @param anchorBox Geometry about the anchor.
 * @returns A number where to position the context menu based on the assumed 
 *          axis.
 */
export function calcViewPositionAlongAxis(viewportSize: number, viewSize: number, anchorBox: IAnchorBox): number {
        
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