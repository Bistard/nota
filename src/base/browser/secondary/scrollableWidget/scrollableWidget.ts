import "src/base/browser/secondary/scrollableWidget/scrollableWidget.scss";
import { AbstractScrollbar, IScrollBarHost } from "src/base/browser/basic/scrollbar/abstractScrollbar";
import { HorizontalScrollbar } from "src/base/browser/basic/scrollbar/horizontalScrollbar";
import { VerticalScrollbar } from "src/base/browser/basic/scrollbar/verticalScrollbar";
import { IWidget, Widget } from "src/base/browser/basic/widget";
import { IScrollableWidgetExtensionOpts, IScrollableWidgetOpts, resolveScrollableWidgetExtensionOpts, ScrollbarType } from "src/base/browser/secondary/scrollableWidget/scrollableWidgetOptions";
import { Disposable, DisposableBucket } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { IScrollEvent, Scrollable } from "src/base/common/scrollable";
import { assert } from "src/base/common/utilities/panic";

export interface IScrollableWidget extends IWidget {

    /** Fires before scrolling happens. */
    onWillScroll: Register<IScrollEvent>;

    /** Fires after scrolling happens. */
    onDidScroll: Register<IScrollEvent>;

    /** @description Returns the inside {@link Scrollable}. */
    getScrollable(): Scrollable;
}

/**
 * @class Requires a {@link Scrollable} which handles all the calculations of 
 * the numerated data for scrolling, then the {@link ScrollableWidget} will 
 * react to it and render the corresponding {@link AbstractScrollbar} correctly.
 */
export class ScrollableWidget extends Widget implements IScrollableWidget {

    // [fields]

    private readonly _opts: IScrollableWidgetOpts;

    protected readonly _scrollable: Scrollable;
    protected readonly _scrollbar: AbstractScrollbar;

    protected _isSliderDragging: boolean;
    protected _isMouseOver: boolean;

    // [event]

    public readonly onWillScroll: Register<IScrollEvent>;
    public readonly onDidScroll: Register<IScrollEvent>;

    // [constructor]

    constructor(scrollable: Scrollable, extensionOpts: IScrollableWidgetExtensionOpts) {
        super();
        this._scrollable = scrollable;
        this._opts = resolveScrollableWidgetExtensionOpts(extensionOpts);
        this._isSliderDragging = false;
        this._isMouseOver = false;

        // scrollbar creation
        const host: IScrollBarHost = {
            onSliderDragStart: () => this._onSliderDragStart(),
            onSliderDragStop: () => this._onSliderDragStop()
        };

        this._scrollbar = this._opts.scrollbarType === ScrollbarType.vertical
            ? new VerticalScrollbar(this._scrollable, host)
            : new HorizontalScrollbar(this._scrollable, host);

        this.onWillScroll = this._scrollbar.onWillScroll;
        this.onDidScroll = this._scrollbar.onDidScroll;

        this.__register(scrollable);
        this.__register(this._scrollbar);
    }

    // [methods]

    public getScrollable(): Scrollable {
        return this._scrollable;
    }

    protected override __render(element: HTMLElement): void {
        element.classList.add('scrollable-element');
        
        const scrollbarElement = document.createElement('div');
        this._scrollbar.render(scrollbarElement);
        this._scrollbar.hide();

        element.appendChild(scrollbarElement);
    }

    // [private helper methods]

    /**
     * @description Register mouse wheel listener to the scrollable DOM element.
     */
    protected override __registerListeners(element: HTMLElement): void {

        // scrollbar visibility
        [this.onMouseover, this.onTouchmove]
            .forEach(event => this.__register(event.call(this, element, () => this.__onMouseover())));
        [this.onMouseout, this.onTouchend, this.onTouchcancel]
            .forEach(event => this.__register(event.call(this, element, () => this.__onMouseout())));
        
        // mouse wheel scroll support
        this.__register(this.onWheel(element, event => this.__onDidWheel(event)));
        
        // touch pad scroll support
        if (this._opts.touchSupport) {
            const touchController = this.__register(new TouchController(this, this._scrollbar));
            this.__register(touchController.onDidTouchmove(delta => this.__actualScroll(delta)));
        }
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

        let delta = this._scrollbar.getWheelDelta(event);
        if (event.altKey) {
            delta *= this._opts.fastScrollSensibility;
        }

        this.__actualScroll(delta);
    }

    /**
     * @description Given a delta change in position, make a scroll.
     * @param delta The delta in position.
     */
    private __actualScroll(delta: number): void {
        delta *= this._opts.scrollSensibility;

        // check if the scroll reaches the edges
        const currScrollPosition = this._scrollable.getScrollPosition();
        const maxScrollPosition = this._scrollable.getScrollSize() - this._scrollable.getViewportSize();
        if (
            (currScrollPosition >= maxScrollPosition && delta > 0) ||
            (currScrollPosition <= 0 && delta < 0)
        ) {
            return;
        }

        /**
         * ceil or floor the position to avoid getting a position less than zero 
         * or larger than maximum after adding the recalculated delta.
         * 
         * still possible to get a -0 position, but should not make a difference 
         * in this case.
         */
        let newScrollPosition: number;
        if (delta < 0) {
            newScrollPosition = Math.max(0, Math.ceil(this._scrollable.getScrollPosition() + delta));
        } else {
            newScrollPosition = Math.min(maxScrollPosition, Math.floor(this._scrollable.getScrollPosition() + delta));
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

    private __onMouseover(): void {
        this._isMouseOver = true;
        this._scrollbar.show();
    }

    private __onMouseout(): void {
        this._isMouseOver = false;
        if (!this._isSliderDragging) {
            this._scrollbar.hide();
        }
    }
}

/**
 * @internal
 */
class TouchController extends Disposable {

    // [field]

    private static readonly TOUCH_SENSIBILITY = 1.5;

    private readonly _widget: ScrollableWidget;
    private readonly _scrollbar: AbstractScrollbar;
    private _currPosition: number;

    // [event]

    private readonly _onDidTouchmove = this.__register(new Emitter<number>());
    public readonly onDidTouchmove = this._onDidTouchmove.registerListener;

    // [constructor]

    constructor(widget: ScrollableWidget, scrollbar: AbstractScrollbar) {
        super();
        this._widget = widget;
        this._scrollbar = scrollbar;
        this._currPosition = -1;
        
        if (!widget.element) {
            return;
        }

        const element = widget.element;

        const onTouchStart = widget.onTouchstart(element, (event: TouchEvent) => {
            if (!element || event.changedTouches.length === 0) {
                return;
            }

            const disposables = new DisposableBucket();
            const touch = assert(event.changedTouches[0]);
            this._currPosition = this._scrollbar.getTouchPosition(touch);

            disposables.register(widget.onTouchmove(element, (e) => this.__onTouchmove(e)));
            disposables.register(widget.onTouchcancel(element, () => disposables.dispose()));
            disposables.register(widget.onTouchend(element, () => disposables.dispose()));
        });
        
        this.__register(onTouchStart);
    }

    // [private helper methods]

    private __onTouchmove(event: TouchEvent): void {
        if (event.changedTouches.length === 0) {
            return;
        }
        
        if (this._widget.getScrollable().required() === false) {
            return;
        }

        event.preventDefault();

        const touch = assert(event.changedTouches[0]);
        const touchPosition = this._scrollbar.getTouchPosition(touch);
        const delta = this._currPosition - touchPosition;

        this._currPosition = touchPosition;
        this._onDidTouchmove.fire(delta * TouchController.TOUCH_SENSIBILITY);
    }
}