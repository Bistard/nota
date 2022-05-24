import { AllRequired, ifOrDefault } from "src/base/common/type";

export const enum ScrollbarType { 
    vertical,
    horizontal
}

export interface IScrollableWidgetExtensionOpts {

    /**
     * @readonly Types of scrollbar that the widget supports.
     * @default ScrollbarType.vertical
     * 
     * @note (right now it cannot support both types at the same time)
     */
    scrollbarType?: ScrollbarType;

    /**
     * @readonly A multiplier to be used on the `deltaX` and `deltaY` of a mouse 
     * wheel scroll event.
	 * @default 1
     */
    mouseWheelScrollSensibility?: number;

    /**
     * @readonly A multiplier to be used for wheel scroll event when `ALT` 
     * keyword is pressed.
     * @default 5
     */
    mouseWheelFastScrollSensibility?: number;

    /**
     * @readonly When this option is on, mouse wheel goes up, the slider goes 
     * down.
     * @default false
     */
    reverseMouseWheelDirection?: boolean;
}

export interface IScrollableWidgetOpts extends AllRequired<IScrollableWidgetExtensionOpts> {
    // nothing
}

/**
 * @description Resolves the given possible incompleted option into a complete 
 * option with default values.
 * @param opts A scrollable widget option might not be completed.
* @returns A resolved option {@link IScrollableWidgetOpts}
 */
export function resolveScrollableWidgetExtensionOpts(opts: IScrollableWidgetExtensionOpts): IScrollableWidgetOpts {

    return {
        scrollbarType:                   ifOrDefault(opts.scrollbarType, ScrollbarType.vertical),
        mouseWheelScrollSensibility:     ifOrDefault(opts.mouseWheelScrollSensibility, 1),
        mouseWheelFastScrollSensibility: ifOrDefault(opts.mouseWheelFastScrollSensibility, 5),
        reverseMouseWheelDirection:      ifOrDefault(opts.reverseMouseWheelDirection, false),
    };

}