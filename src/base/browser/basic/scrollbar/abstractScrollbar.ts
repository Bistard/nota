import { Widget } from "src/base/browser/basic/widget";
import { Scrollable } from "src/base/common/scrollable";

export interface IAbstractScrollbarOptions {
    
    scrollable: Scrollable,

}

/**
 * @class The base model for different scrollbars. Cannot be used directly.
 */
export abstract class AbstractScrollbar extends Widget {

    // [fields]

    protected _slider: HTMLElement;

    protected _scrollable: Scrollable;

    // [constructor]

    constructor(opts: IAbstractScrollbarOptions) {
        super();

        this._slider = document.createElement('div');
        this._slider.className = 'scroll-slider';

        this._scrollable = opts.scrollable;
    }

    // [abstractions]

    /**
     * @description Will be invoked once scrolling happens.
     * @param event The wheel event.
     */
    public abstract onDidScroll(event: WheelEvent): void;

     /**
      * @description Returns the future absolute position. the returned position 
      * will be resolved if the next animation frame the slider will exceeds the 
      * scrollbar.
      *  
      * @param event The wheel event.
      * @returns the future legal position.
      */
    public abstract getFutureSliderPosition(event: WheelEvent): number;

    /**
     * @description Renders the whole scrollbar.
     * @param size The size of the scrollbar
     */
    protected abstract __renderScrollbar(size: number): void;

    /**
     * @description Renders the visual status on the slider.
     * @param size size of the slider.
     * @param position position of the slider.
     */
    protected abstract __updateSlider(size: number, position: number): void;

    // [methods]

    /**
     * @description Renders the provided HTMLElement as a scrollbar.
     * @param element The HTMLElement of the scrollbar.
     * 
     * @warn Do not render twice.
     */
    public override render(element: HTMLElement): void {
        super.render(element);
        
        this.__renderScrollbar(this._scrollable.getScrollbarSize());
        this.__renderSlider(this._scrollable.getSliderSize(), this._scrollable.getSliderPosition());
    }

    /**
     * 
     */
    public rerender(): void {
        this.__renderScrollbar(this._scrollable.getScrollbarSize());
        this.__updateSlider(this._scrollable.getSliderSize(), this._scrollable.getSliderPosition());
    }

    // [protected methods]

    protected __renderSlider(size: number, position: number): void {
        
        this.__updateSlider(size, position);
        
        /**
         * register listeners
         */

        this.onMousedown(this._slider, (e) => {
            if (e.leftButton) {
				e.preventDefault();
				console.log('mouse down');
                this.__sliderMousedown(e);
			}
        });

        this.onClick(this._slider, e => {
			if (e.leftButton) {
				e.stopPropagation();
			}
		});

        this._element!.appendChild(this._slider);
    }

    private __sliderMousedown(event: MouseEvent): void {
        console.log(event);
    }

}
