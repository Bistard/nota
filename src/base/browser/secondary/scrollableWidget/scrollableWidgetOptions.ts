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
    readonly scrollbarType?: ScrollbarType;

    /**
     * A multiplier to be used on the `deltaX` and `deltaY` of a mouse wheel 
     * scroll event.
	 * @default 1
     */
    readonly scrollSensibility?: number;

    /**
     * A multiplier to be used for wheel scroll event when `ALT` keyword is 
     * pressed.
     * @default 5
     */
    readonly fastScrollSensibility?: number;

    /**
     * When this option is on, mouse wheel goes up, the slider goes down.
     * @default false
     */
    readonly reverseMouseWheelDirection?: boolean;

    /**
     * Whether to support touching pad support.
     * @default true
     */
    readonly touchSupport?: boolean;
}

export type IScrollableWidgetOpts = Required<IScrollableWidgetExtensionOpts>;

/**
 * @description Resolves the given possible incomplete option into a complete 
 * option with default values.
 * @param opts A scrollable widget option might not be completed.
 * @returns A resolved option {@link IScrollableWidgetOpts}
 */
export function resolveScrollableWidgetExtensionOpts(opts: IScrollableWidgetExtensionOpts): IScrollableWidgetOpts {
    return {
        scrollbarType:                   opts.scrollbarType ?? ScrollbarType.vertical,
        scrollSensibility:               opts.scrollSensibility ?? 1,
        fastScrollSensibility: opts.fastScrollSensibility ?? 5,
        reverseMouseWheelDirection:      opts.reverseMouseWheelDirection ?? false,
        touchSupport:                    opts.touchSupport ?? true,
    };
}