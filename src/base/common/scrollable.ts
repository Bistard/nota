
/**
 * @readonly Scroll wheel event type.
 */
 export interface IScrollEvent {
	deltaX: number;
    deltaY: number;
    deltaZ: number;
	
	preventDefault(): void;
	stopPropagation(): void;
}

export interface IScrollable {
	// TODO
}

const MIN_SLIDER_SIZE = 20; // pixels

/**
 * @class A class for storing the numerated data of {@link AbstractScrollbar}.
 * Self-recalculating the correct data of a slider if needed.
 */
export class Scrollable implements IScrollable {

    // [fields]

    /**
     * vertical: width of the scrollbar
     * horizontal: height of the scrollbar
     */
    private _scrollbarSize: number;

    /**
     * vertical: height of the viewport
     * horizontal: width of the viewport
     */
    private _viewportSize: number;

    /**
     * vertical: height of the actual scrolling area
     * horizontal: width of the actual scrolling area
     */
    private _scrollSize: number;

    /**
     * vertical: top of the actual scrolling area
     * horizontal: left of the actual scrolling area
     */
    private _scrollPosition: number;

    /**
     * vertical: the height of the slider
     * horizontal: the width of the slider
     */
    private _sliderSize: number;

    /**
     * vertical: the top of the slider
     * horizontal: the left of the slider
     */
    private _sliderPosition: number;

    /**
     * The ratio represents how fast the scroll goes, how fast the slider goes.
     */
    private _sliderRatio: number;

    /**
     * if `_scrollSize` is zero or `_scrollSize` <= `_viewportSize`, scrollbar 
     * is not required.
     */
    private _required: boolean;

    // [constructor]

    constructor(scrollbarSize: number, viewportSize: number, scrollSize: number, scrollPosition: number) {
        this._scrollbarSize = scrollbarSize;
        this._viewportSize = viewportSize;
        this._scrollSize = scrollSize;
        this._scrollPosition = scrollPosition;

        this._sliderSize = 0;
        this._sliderPosition = 0;
        this._sliderRatio = 0;
        this._required = false;

        this.__reCalculate();
    }

    // [methods - set]

    public setScrollbarSize(scrollbarSize: number): void {
        this._scrollbarSize = scrollbarSize;
    }

    public setViewportSize(viewportSize: number): void {
        if (this._viewportSize !== viewportSize) {
            this._viewportSize = viewportSize;
            this.__reCalculate();
        }
    }

    public setScrollSize(scrollSize: number): void {
        if (this._scrollSize !== scrollSize) {
            this._scrollSize = scrollSize;
            this.__reCalculate();
        }
    }

    public setScrollPosition(scrollPosition: number): void {
        if (this._scrollPosition !== scrollPosition) {
            this._scrollPosition = scrollPosition;
            this.__reCalculate();
        }
    }

    // [methods - get]

    public getScrollbarSize(): number {
        return this._scrollbarSize;
    }

    public getViewportSize(): number {
        return this._viewportSize;
    }

    public getScrollSize(): number {
        return this._scrollSize;
    }

    public getScrollPosition(): number {
        return this._scrollPosition;
    }

    public getSliderSize(): number {
        return this._sliderSize;
    }

    public getSliderPosition(): number {
        return this._sliderPosition;
    }

    public required(): boolean {
        return this._required;
    }

	// [methods]

	/**
	 * @description Generates our own defined scroll event.
	 * @param event The raw {@link WheelEvent}.
	 */
	public createScrollEvent(event: WheelEvent): IScrollEvent {
		return {
			deltaX: event.deltaX,
			deltaY: event.deltaY,
			deltaZ: event.deltaZ,
			preventDefault: () => event.preventDefault(),
			stopPropagation: () => event.stopPropagation()
		};
	}

    // [private methods]

    /**
     * Everytime when the {@link Scrollable} changes its fields, this method 
     * will be invoked to recalculate all the numerated data to display the 
     * correct scrollbar and its slider.
     */
    private __reCalculate(): void {

        this._required = this._scrollSize > 0 && this._scrollSize > this._viewportSize;
        
        /**
         * does not need a scrollbar since the current viewport has enough space 
         * to displays all the contents.
         */
        if (!this._required) {
            return;
        }

        /**
         * recalculates the size of the slider (set a minimum value to avoid the 
         * slider is too small to interact).
         */
        this._sliderSize = Math.max(
            MIN_SLIDER_SIZE, 
            Math.floor(this._viewportSize * (this._viewportSize / this._scrollSize))
        );

        /**
         * the slider can move from `0` to `this._viewportSize - this._sliderSize`
         * the scroll can move from `0` to `this._scrollSize - this._viewportSize`
         * we calculate the ratio which represents how fast the scroll goes, 
         * how fast the slider goes.
         */
        this._sliderRatio = (
            (this._viewportSize - this._sliderSize) / 
            (this._scrollSize - this._viewportSize)
        );
        
        /**
         * recalculates the position of the slider.
         */
        this._sliderPosition = this._scrollPosition * this._sliderRatio;
    }

}
