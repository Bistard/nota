export const enum ScrollbarType { 
    vertical,
    horizontal
}

export interface IScrollableWidgetExtensionOpts {

    /**
     * Types of scrollbar that the widget supports.
     * @default ScrollbarType.vertical
     * 
     * @note (right now it cannot support both types at the same time)
     */
    scrollbarType?: ScrollbarType;

    /**
     * A multiplier to be used on the `deltaX` and `deltaY` of a mouse wheel 
     * scroll event.
	 * @default 1
     */
    scrollSensibility?: number;

    /**
     * A multiplier to be used for wheel scroll event when `ALT` keyword is 
     * pressed.
     * @default 5
     */
    mouseWheelFastScrollSensibility?: number;

    /**
     * When this option is on, mouse wheel goes up, the slider goes down.
     * @default false
     */
    reverseMouseWheelDirection?: boolean;

    /**
     * Whether to support touching pad support.
     * @default true
     */
    touchSupport?: boolean;
}

export type IScrollableWidgetOpts = Required<IScrollableWidgetExtensionOpts>

/**
 * @description Resolves the given possible incompleted option into a complete 
 * option with default values.
 * @param opts A scrollable widget option might not be completed.
 * @returns A resolved option {@link IScrollableWidgetOpts}
 */
export function resolveScrollableWidgetExtensionOpts(opts: IScrollableWidgetExtensionOpts): IScrollableWidgetOpts {
    return {
        scrollbarType:                   opts.scrollbarType ?? ScrollbarType.vertical,
        scrollSensibility:               opts.scrollSensibility ?? 1,
        mouseWheelFastScrollSensibility: opts.mouseWheelFastScrollSensibility ?? 5,
        reverseMouseWheelDirection:      opts.reverseMouseWheelDirection ?? false,
        touchSupport:                    opts.touchSupport ?? true,
    };
}