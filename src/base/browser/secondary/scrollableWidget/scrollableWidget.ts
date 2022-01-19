import { AbstractScrollbar } from "src/base/browser/basic/scrollbar/abstractScrollbar";
import { HorizontalScrollbar } from "src/base/browser/basic/scrollbar/horizontalScrollbar";
import { VerticalScrollbar } from "src/base/browser/basic/scrollbar/verticalScrollbar";
import { IWidget, Widget } from "src/base/browser/basic/widget";
import { IScrollableWidgetCreationOpts, IScrollableWidgetExtensionOpts, IScrollableWidgetOpts, resolveScrollableWidgetExtensionOpts, ScrollbarType } from "src/base/browser/secondary/scrollableWidget/scrollableWidgetOptions";
import { IScrollEvent, Scrollable } from "src/base/common/scrollable";

export interface IAbstractScrollableWidget extends IWidget {

    render(element: HTMLElement): void;
    
}

export abstract class AbstractScrollableWidget extends Widget implements IAbstractScrollableWidget {

    // [fields]

    private _opts: IScrollableWidgetOpts;

    protected _scrollable: Scrollable;
    protected _scrollbar: AbstractScrollbar;

    // [constructor]

    constructor(opts: IScrollableWidgetCreationOpts, extensionOpts: IScrollableWidgetExtensionOpts) {
        super();

        this._opts = resolveScrollableWidgetExtensionOpts(extensionOpts);

        // scrollable creation
        this._scrollable = new Scrollable(
            this._opts.scrollbarSize,
            opts.viewportSize,
            opts.scrollSize,
            opts.scrollPosition
        );

        // scrollbar creation
        if (this._opts.scrollbarType === ScrollbarType.vertical) {
            this._scrollbar = new VerticalScrollbar(this._scrollable);
        } else {
            this._scrollbar = new HorizontalScrollbar(this._scrollable);
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
        
        // register on mouse wheel listener
        this.__onMouseWheel();

        // render scrollbar
        const scrollbarElement = document.createElement('div');
        this._scrollbar.render(scrollbarElement);
        element.appendChild(scrollbarElement);
    }

    private __onMouseWheel(): void {
        if (this._element === undefined) {
            return;
        }

        this._element.onwheel = (e: WheelEvent): void => {
            
            const scrollEvent = this._scrollable.createScrollEvent(e);
            const currPosition = this._scrollable.getSliderPosition();

            // get the next slider position (if exceeds scrollbar, delta position will be update to correct one)
            const futurePosition = this._scrollbar.getFutureSliderPosition(scrollEvent);
            
            // slider does not move, we do nothing
            if (currPosition === futurePosition) {
                return;
            }

            // did scroll
            this.__onDidScroll(scrollEvent);
            
        };

    }

    // [abstraction]

    /**
     * @description Rerenders the {@link ScrollableWidget}.
     */
    protected abstract __rerender(): void;

    // [private helper methods]

    /**
     * @description Invokes when scroll happens.
     * @param event The wheel event when scroll happens.
     */
    private __onDidScroll(event: IScrollEvent): void {
        
        event.preventDefault();

        // updates scrollable position
        const newScrollPosition = this._scrollable.getScrollPosition() + event.deltaY * this._opts.mouseWheelScrollSensibility;
        this._scrollable.setScrollPosition(newScrollPosition);

        // updates scrollbar
        this._scrollbar.onDidScroll(event);

        // rerender
        this.__rerender();
    }
    
}
