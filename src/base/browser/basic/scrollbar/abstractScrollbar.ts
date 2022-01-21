import { ScrollbarVisibilityController } from "src/base/browser/basic/visibilityController";
import { Widget } from "src/base/browser/basic/widget";
import { IDisposable } from "src/base/common/dispose";
import { IScrollEvent, Scrollable } from "src/base/common/scrollable";

/**
 * @readonly A {@link ScrollBarHost} is the parent host who actually contains 
 * the scrollbar.
 */
export interface ScrollBarHost {
    /**
     * callback when slider dragging start. Provided by the host.
     */
    onSliderDragStart(): void;
    
    /**
     * callback when slider dragging stoped. Provided by the host.
     */
    onSliderDragStop(): void;
}

/**
 * The {@link AbstractScrollbar} creation option.
 */
export interface IAbstractScrollbarOptions {
    scrollable: Scrollable,
    host: ScrollBarHost,
}

/**
 * @class The base model for different scrollbars. Cannot be used directly.
 */
export abstract class AbstractScrollbar extends Widget {

    // [fields]

    protected _slider: HTMLElement;

    protected _host: ScrollBarHost;

    protected _scrollable: Scrollable;

    private _visibilityController: ScrollbarVisibilityController;

    // [constructor]

    constructor(opts: IAbstractScrollbarOptions) {
        super();

        this._slider = document.createElement('div');
        this._slider.className = 'scroll-slider';

        this._host = opts.host;
        this._scrollable = opts.scrollable;

        this._visibilityController = new ScrollbarVisibilityController('visible', 'invisible', 'fade');
    }

    // [abstractions]

    /**
     * @description Will be invoked once scrolling happens.
     * @param event The scroll event.
     */
    public abstract onDidScroll(event: IScrollEvent): void;

    /**
     * @description Returns the future absolute position. the returned position 
     * will be resolved if the next animation frame the slider will exceeds the 
     * scrollbar.
     * 
     * @note If future position exceeds the scrollbar, the {@link IScrollEvent.deltaX/deltaY} 
     * will be resolved to the correct one.
     *  
     * @param event The scroll event.
     * @returns the future legal position.
     */
    public abstract getFutureSliderPosition(event: IScrollEvent): number;

    /**
     * @description Returns the scroll event delta direction (either deltaX or 
     * deltaY depends on scrollbar direction).
     * @param event The scroll event.
     */
    public abstract getScrollDelta(event: IScrollEvent): number;

    /**
     * @description Renders the whole scrollbar.
     * @param size The size of the scrollbar.
     */
    protected abstract __renderScrollbar(size: number): void;

    /**
     * @description Renders the visual status on the slider.
     * @param size size of the slider.
     * @param position position of the slider.
     */
    protected abstract __updateSlider(size: number, position: number): void;

    /**
     * @description Returns the mouse position (either x or y depends on 
     * scrollbar direction).
     * @param event The mouse event.
     */
    protected abstract __getMousePosition(event: MouseEvent): number;

    // [methods]

    /**
     * @description Renders the provided HTMLElement as a scrollbar.
     * @param element The HTMLElement of the scrollbar.
     * 
     * @warn Do not render twice.
     */
    public override render(element: HTMLElement): void {
        super.render(element);
        
        this._visibilityController.setDomNode(this._element!);

        // render scrollbar
        this.__renderScrollbar(this._scrollable.getScrollbarSize());

        // mouse down on the scrollbar or slider
        this.onMousedown(this._element!, (e) => {
            this.__scrollbarOrSliderOnDrag(e);
        });

        // render slider
        this.__renderSlider(this._scrollable.getSliderSize(), this._scrollable.getSliderPosition());
    }

    /**
     * @description Rerenders the scrollbar and slider.
     */
    public rerender(): void {
        this.__renderScrollbar(this._scrollable.getScrollbarSize());
        this.__updateSlider(this._scrollable.getSliderSize(), this._scrollable.getSliderPosition());
    }

    /**
     * @description Shows the scrollbar with fading animation.
     */
    public show(): void {
        this._visibilityController.setVisibility(true);
    }

    /**
     * @description Hides the scrollbar with fading animation.
     */
    public hide(): void {
        this._visibilityController.setVisibility(false);
    }

    // [protected methods]

    /**
     * @description Renders the slider.
     * @param size The width / height of the slider.
     * @param position The top / left of the slider.
     */
    protected __renderSlider(size: number, position: number): void {
        this.__updateSlider(size, position);
        this._element!.appendChild(this._slider);
    }

    /**
     * @description Makes the slider is draggable with mouse.
     * @param event The mouse event when dragging happens.
     */
    private __sliderOnDrag(event: MouseEvent): void {
        event.preventDefault();
        
        // tell the host we did a drag motion
        this._host.onSliderDragStart();

        // stores the current mouse position
        let currMousePosition = this.__getMousePosition(event);

        // mousemove listener
        const onMousemove = (e: MouseEvent) => {
            
            e.preventDefault();
            
            // calculates the delta change in mouse move
            const deltaMouseChange = this.__getMousePosition(e) - currMousePosition;
            
            // do nothing if reaches the edge
            if ((this._scrollable.getSliderPosition() >= this._scrollable.getSliderMaxPosition()) && deltaMouseChange > 0) {
                return;
            }
            if ((this._scrollable.getSliderPosition() <= 0) && deltaMouseChange < 0) {
                return;
            }
            
            // sets the new scroll position relatives to the delta
            const newScrollPosition = this._scrollable.getScrollPositionFromDelta(deltaMouseChange);
            this._scrollable.setScrollPosition(newScrollPosition);
            
            // update and rerender
            this.__updateSlider(this._scrollable.getSliderSize(), this._scrollable.getSliderPosition());

            // reset the current mouse position
            currMousePosition = this.__getMousePosition(e);
        };

        let mouseoverDisposable: IDisposable;
        let onClickDisposable: IDisposable;

        // oncick listener
        const onClick = () => {
            // dispose listeners
            mouseoverDisposable.dispose();
            onClickDisposable.dispose();
            
            // tell the host we finish the drag motion
            this._host.onSliderDragStop();
        }

        // starts register listeners
        mouseoverDisposable = this.onMousemove(document.documentElement, onMousemove);
        onClickDisposable = this.onClick(document.documentElement, onClick);
    }

    /**
     * @description Sets the slider to the mousedowned position then make it draggable.
     * @param event The mouse event when dragging happens.
     */
    private __scrollbarOnDrag(event: MouseEvent): void {
        
        // first, set the slider to the current mousedowned position (half slider size offset)
        const currSliderPosition = this._scrollable.getSliderPosition();
        const sliderOffset = Math.round(this._scrollable.getSliderSize() / 2);
        const currMousePosition = this.__getMousePosition(event);
        const newSliderPosition = 
            Math.round(
                Math.min(
                    this._scrollable.getViewportSize() - this._scrollable.getSliderSize(), 
                    Math.max(0, currMousePosition - sliderOffset)
                )
            );

        const newScrollPosition = this._scrollable.getScrollPositionFromDelta(newSliderPosition - currSliderPosition);
        this._scrollable.setScrollPosition(newScrollPosition);

        // update and rerender
        this.__updateSlider(this._scrollable.getSliderSize(), this._scrollable.getSliderPosition());

        // second, set the slider be draggable
        this.__sliderOnDrag(event);
    }

    /**
     * @description Determines the behaviour of mousedown on the scrollbar.
     * @param event The mouse event when mousedown on scrollbar.
     */
    private __scrollbarOrSliderOnDrag(event: MouseEvent): void {

        // determine which part is mousedowned
        const scrollbarTop = this._element!.getClientRects()[0]!.top;
        const mousePosition = this.__getMousePosition(event);
        const sliderStart = scrollbarTop + this._scrollable.getSliderPosition();
        const sliderEnd = sliderStart + this._scrollable.getSliderSize();
        
        event.preventDefault();

        // treats as slider on drag
        if (sliderStart <= mousePosition && mousePosition <= sliderEnd) {
            this.__sliderOnDrag(event);
        } 
        
        // treats as scrollbar on drag
        else {
            this.__scrollbarOnDrag(event);
        }
        
    }

}
