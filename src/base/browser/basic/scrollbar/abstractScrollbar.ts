import "src/base/browser/basic/scrollbar/scrollbar.scss";
import { VisibilityController } from "src/base/browser/basic/visibilityController";
import { IWidget, Widget } from "src/base/browser/basic/widget";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { MouseClick } from "src/base/common/keyboard";
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
 * An interface only for {@link AbstractScrollbar}.
 */
export interface IAbstractScrollbar extends IWidget {

    /** Fires before scroll happens. */
    onWillScroll: Register<IScrollEvent>;
    
    /** Fires after scroll happens. */
    onDidScroll: Register<IScrollEvent>;

    /**
     * @description Rerenders the scrollbar.
     */
    rerender(size?: number, position?: number): void;

    /**
     * @description Displays the scrollbar.
     */
    show(): void;
    
    /**
     * @description Hides the scrollbar.
     */
    hide(): void;

}

/**
 * @class The base model for different scrollbars. Cannot be used directly.
 */
export abstract class AbstractScrollbar extends Widget {

    // [fields]

    protected readonly _slider: HTMLElement;
    protected _host: ScrollBarHost;
    protected _scrollable: Scrollable;
    private _visibilityController: VisibilityController;

    // [event]

    private readonly _onWillScroll = this.__register(new Emitter<IScrollEvent>());
    public readonly onWillScroll = this._onWillScroll.registerListener;

    private readonly _onDidScroll = this.__register(new Emitter<IScrollEvent>());
    public readonly onDidScroll = this._onDidScroll.registerListener;

    // [constructor]

    constructor(opts: IAbstractScrollbarOptions) {
        super();

        this._slider = document.createElement('div');
        this._slider.className = 'scroll-slider';

        this._host = opts.host;
        this._scrollable = opts.scrollable;

        this.__register(this._scrollable.onDidScroll(e => {
            this._onWillScroll.fire(e);
            this.__onDidScroll(e);
            this._onDidScroll.fire(e);
        }));

        this._visibilityController = new VisibilityController('visible', 'invisible', 'fade');
    }

    // [abstraction]

    /**
     * @description Returns the scroll delta change in the current direction.
     * @param event The wheel event.
     */
    public abstract getWheelDelta(event: WheelEvent): number;

    /**
     * @description Returns the touch position (either x or y).
     * @param touch The specific touch of the user finger.
     */
    public abstract getTouchPosition(touch: Touch): number;

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

    // [protected override methods]

    protected override __render(): void {
        this._visibilityController.setDomNode(this.element);

        // render scrollbar
        this.__renderScrollbar(this._scrollable.getScrollbarSize());
        // render slider
        this.__renderSlider(this._scrollable.getSliderSize(), this._scrollable.getSliderPosition());
    }

    protected override __registerListeners(): void {
        // mouse down on the scrollbar or slider
        this.__register(this.onMousedown(this.element, (e) => {
            e.stopPropagation();

            if (this._scrollable.required() === false) {
                return;
            }

            this.__scrollbarOrSliderOnDrag(e);
        }));
    }
    
    // [public methods]

    /**
     * @description Rerenders the slider.
     * @param size the size of the scrollbar.
     * @param position the position of the scrollbar.
     * 
     * @note if any parameters is not provided, take values from {@link Scrollable}.
     */
    public rerender(size?: number, position?: number): void {
        this.__updateSlider(size ?? this._scrollable.getSliderSize(), position ?? this._scrollable.getSliderPosition());
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
    
    // [private helper methods]

    /**
     * @description Renders the slider.
     * @param size The width / height of the slider.
     * @param position The top / left of the slider.
     */
    private __renderSlider(size: number, position: number): void {
        this.__updateSlider(size, position);
        this.element.appendChild(this._slider);
    }
    
    /**
     * @description Will be invoked once scrolling happens.
     * @param event The scroll event.
     */
    private __onDidScroll(event: IScrollEvent): void {
        this.rerender();
    }

    /**
     * @description Makes the slider is draggable with mouse.
     * @param event The mouse event when dragging happens.
     */
    private __sliderOnDrag(event: MouseEvent): void {
        
        // when dragging, prevent triggers any other events.
        event.preventDefault();

        // tell the host we did a drag motion
        this._host.onSliderDragStart();

        // toggle the slider as active
        this._slider.classList.toggle('active', true);

        // stores the current mouse position
        let currMousePosition = this.__getMousePosition(event);

        // mousemove listener
        const onMousemove = (e: MouseEvent) => {
            
            event.stopPropagation();
            
            // calculates the delta change in mouse move
            const mouseDelta = this.__getMousePosition(e) - currMousePosition;
            
            // do nothing if reaches the edge
            if ((this._scrollable.getSliderPosition() >= this._scrollable.getSliderMaxPosition()) && mouseDelta > 0) {
                return;
            }
            if ((this._scrollable.getSliderPosition() <= 0) && mouseDelta < 0) {
                return;
            }
            
            // sets the new scroll position relatives to the delta
            let newScrollPosition: number;
            if (mouseDelta < 0) {
                newScrollPosition = Math.max(0, this._scrollable.getScrollPositionFromDelta(mouseDelta));
            } else {
                const maxScrollPosition = this._scrollable.getScrollSize() - this._scrollable.getViewportSize();
                newScrollPosition = Math.min(maxScrollPosition, this._scrollable.getScrollPositionFromDelta(mouseDelta));
            }
            this._scrollable.setScrollPosition(newScrollPosition);
            
            // update and rerender
            this.__updateSlider(this._scrollable.getSliderSize(), this._scrollable.getSliderPosition());

            // reset the current mouse position
            currMousePosition = this.__getMousePosition(e);
        };

        let mouseoverDisposable: IDisposable = Disposable.NONE;
        let onClickDisposable: IDisposable = Disposable.NONE;

        // oncick listener
        const onClick = () => {
            // dispose listeners
            mouseoverDisposable.dispose();
            onClickDisposable.dispose();
            
            this._slider.classList.toggle('active', false);

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
        const scrollbarTop = this.element.getClientRects()[0]!.top;
        const mousePosition = this.__getMousePosition(event);
        const sliderStart = scrollbarTop + this._scrollable.getSliderPosition();
        const sliderEnd = sliderStart + this._scrollable.getSliderSize();
        
        // treats as slider on drag
        if (sliderStart <= mousePosition && mousePosition <= sliderEnd) {
            if (event.button === MouseClick.leftClick) {
                this.__sliderOnDrag(event);
            }
        } 
        
        // treats as scrollbar on drag
        else {
            this.__scrollbarOnDrag(event);
        }
        
    }

}
