import { AbstractScrollbar, ScrollBarHost } from "src/base/browser/basic/scrollbar/abstractScrollbar";
import { HorizontalScrollbar } from "src/base/browser/basic/scrollbar/horizontalScrollbar";
import { VerticalScrollbar } from "src/base/browser/basic/scrollbar/verticalScrollbar";
import { IWidget, Widget } from "src/base/browser/basic/widget";
import { IScrollableWidgetExtensionOpts, IScrollableWidgetOpts, resolveScrollableWidgetExtensionOpts, ScrollbarType } from "src/base/browser/secondary/scrollableWidget/scrollableWidgetOptions";
import { Emitter, Register } from "src/base/common/event";
import { IScrollEvent, Scrollable } from "src/base/common/scrollable";

export interface IScrollableWidget extends IWidget {

    /**
     * Fires when scrolling happens.
     */
    onDidScroll: Register<IScrollEvent>;

    /**
     * Returns the inside {@link Scrollable}.
     */
    getScrollable(): Scrollable;

}

/**
 * @class Requires a {@link Scrollable} which handles all the calculations of 
 * the numerated data for scrolling, then the {@link ScrollableWidget} will 
 * react to it and render the corresponding {@link AbstractScrollbar} correctly.
 */
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

    // [methods]

    public getScrollable(): Scrollable {
        return this._scrollable;
    }

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

        this.onWheel(this.element!, (event: WheelEvent) => { this.__onDidWheel(event) });
    }

    /**
     * @description Invokes when mouse wheel scroll happens.
     * @param event The scroll delta.
     */
    private __onDidWheel(event: WheelEvent): void {
        
        event.preventDefault();

        // no need for a scrollable (enough viewport for displaying)
        if (this._scrollable.required() === false) {
            return;
        }

        const scrollDelta = this._scrollbar.getDelta(event) * this._opts.mouseWheelScrollSensibility;

        // check if the scroll reaches the edge
        const currScrollPosition = this._scrollable.getScrollPosition();
        const maxScrollPosition = this._scrollable.getScrollSize() - this._scrollable.getViewportSize();
        if (
            (currScrollPosition >= maxScrollPosition && scrollDelta > 0) ||
            (currScrollPosition <= 0 && scrollDelta < 0)
        ) {
            return;
        }

        /**
         * ceil or floor the position to avoid getting a position less than zero 
         * or larger than maximum after adding the recalculated delta.
         * 
         * still posible to get a -0 position, but should not make a difference 
         * in this case.
         */
        let newScrollPosition: number;
        if (scrollDelta < 0) {
            newScrollPosition = Math.max(0, Math.ceil(this._scrollable.getScrollPosition() + scrollDelta));
        } else {
            newScrollPosition = Math.min(maxScrollPosition, Math.floor(this._scrollable.getScrollPosition() + scrollDelta));
        }
        
        this._scrollable.setScrollPosition(newScrollPosition);
        
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
