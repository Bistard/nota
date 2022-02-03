import { AbstractScrollbar, ScrollBarHost } from "src/base/browser/basic/scrollbar/abstractScrollbar";
import { HorizontalScrollbar } from "src/base/browser/basic/scrollbar/horizontalScrollbar";
import { VerticalScrollbar } from "src/base/browser/basic/scrollbar/verticalScrollbar";
import { IWidget, Widget } from "src/base/browser/basic/widget";
import { IScrollableWidgetExtensionOpts, IScrollableWidgetOpts, resolveScrollableWidgetExtensionOpts, ScrollbarType } from "src/base/browser/secondary/scrollableWidget/scrollableWidgetOptions";
import { Emitter, Register } from "src/base/common/event";
import { IScrollEvent, Scrollable } from "src/base/common/scrollable";

export interface IScrollableWidget extends IWidget {

    onDidScroll: Register<IScrollEvent>;

    getScrollable(): Scrollable;

    render(element: HTMLElement): void;
    
}

export class ScrollableWidget extends Widget implements IScrollableWidget {

    // [fields]

    private _opts: IScrollableWidgetOpts;

    protected _scrollable: Scrollable;
    protected _scrollbar: AbstractScrollbar;

    protected _isSliderDragging: boolean;
    protected _isMouseOver: boolean;

    /**
     * fires when scroll happens.
     */
    private _onDidScroll = this.__register(new Emitter<IScrollEvent>());
    public onDidScroll = this._onDidScroll.registerListener;

    // [constructor]

    constructor(scrollable: Scrollable, extensionOpts: IScrollableWidgetExtensionOpts) {
        super();

        this._scrollable = scrollable;

        this._opts = resolveScrollableWidgetExtensionOpts(extensionOpts);
        this._isSliderDragging = false;
        this._isMouseOver = false;

        // scrollbar creation
        const host: ScrollBarHost = {
            onSliderDragStart: () => this._onSliderDragStart(),
            onSliderDragStop: () => this._onSliderDragStop()
        };

        if (this._opts.scrollbarType === ScrollbarType.vertical) {
            this._scrollbar = new VerticalScrollbar(this._scrollable, host);
        } else {
            this._scrollbar = new HorizontalScrollbar(this._scrollable, host);
        }
    }

    // [methods - get]

    public getScrollable(): Scrollable {
        return this._scrollable;
    }

    // [methods - set]

    // [methods]

    public override render(element: HTMLElement): void {
        super.render(element);
        
        this._element!.classList.add('scrollable-element');
        
        // scrollbar visibility
        this.onMouseover(this._element!, () => this._onMouseover());
        this.onMouseout(this._element!, () => this._onMouseout());

        // register on mouse wheel listener
        this.__registerMouseWheelListener();

        this._scrollable.onDidScroll((e: IScrollEvent) => {
            this._onDidScroll.fire(e);
        });

        // render scrollbar
        const scrollbarElement = document.createElement('div');
        this._scrollbar.render(scrollbarElement);
        this._scrollbar.hide();

        element.appendChild(scrollbarElement);
    }

    // [private helper methods]

    /**
     * @description Register mouse wheel listener to the scrollable DOM element.
     */
    private __registerMouseWheelListener(): void {
        if (this._element === undefined) {
            return;
        }

        this._element.onwheel = (e: WheelEvent): void => {
            
            if (this._scrollable.required() === false) {
                return;
            }

            const scrollEvent = this._scrollable.createScrollEvent(e);
            const currPosition = this._scrollable.getSliderPosition();

            // get the next slider position (if exceeds scrollbar, delta position will be update to correct one)
            const futurePosition = this._scrollbar.getFutureSliderPosition(scrollEvent);
            
            // slider does not move, we do nothing
            if (currPosition === futurePosition) {
                return;
            }

            // did scroll
            this.__onDidWheel(scrollEvent);
            
        };
    }

    /**
     * @description Invokes when mouse wheel scroll happens.
     * @param event The wheel event when mouse wheel scroll happens.
     */
     private __onDidWheel(event: IScrollEvent): void {
        
        event.preventDefault();

        // updates scrollable position
        const sliderDelta = this._scrollbar.getScrollDelta(event) * this._opts.mouseWheelScrollSensibility;
        const newScrollPosition = this._scrollable.getScrollPosition() + sliderDelta / this._scrollable.getSliderRatio();
        this._scrollable.setScrollPosition(newScrollPosition);
        
        // fires the event
        this._scrollable.fire(event);
    }

    private _onSliderDragStart(): void {
        this._isSliderDragging = true;
    }

    private _onSliderDragStop(): void {
        this._isSliderDragging = false;
        
        // drag stops and mouse is not over the scrollable element, scrollbar should be hide.
        if (!this._isMouseOver) {
            this._scrollbar.hide();
        }
    }

    private _onMouseover(): void {
        this._isMouseOver = true;
        this._scrollbar.show();
    }

    private _onMouseout(): void {
        this._isMouseOver = false;
        if (!this._isSliderDragging) {
            this._scrollbar.hide();
        }
    }

}
