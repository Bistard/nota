import { AbstractScrollbar, ScrollBarHost } from "src/base/browser/basic/scrollbar/abstractScrollbar";
import { IScrollEvent, Scrollable } from "src/base/common/scrollable";

export class VerticalScrollbar extends AbstractScrollbar {

    constructor(scrollable: Scrollable, host: ScrollBarHost) {
        super({ 
            scrollable: scrollable,
            host: host
        });
    }

    // [methods]

    public onDidScroll(event: IScrollEvent): void {
        // either no changes or not required, we do nothing
        if (event.deltaY === 0 || this._scrollable.required() === false) {
            return;
        }
        this.rerender();
    }

    public getFutureSliderPosition(event: IScrollEvent): number {
        const top = this._scrollable.getSliderPosition();
        const newTop = top + event.deltaY;
        const edgeTop = this._scrollable.getViewportSize() - this._scrollable.getSliderSize();

        // before the scrollbar
        if (newTop < 0) {
            event.deltaY = 0 - top;
            return 0;
        }

        // after the scrollbar
        if (newTop > edgeTop) {
            event.deltaY = edgeTop - top;
            return edgeTop;
        } 
        
        // returns as normal
        return newTop;
    }

    // [override abstract methods]

    public getScrollDelta(event: IScrollEvent): number {
        return event.deltaY;
    }

    protected __renderScrollbar(size: number): void {
        const element = this._element!;
        element.classList.add('scroll-bar', 'vertical');
        element.style.width = size + 'px';
    }

    protected __updateSlider(size: number, position: number): void {
        const slider = this._slider;
        slider.style.height = size + 'px';
        slider.style.top = position + 'px';
    }
    
    protected __getMousePosition(event: MouseEvent): number {
        return event.clientY;
    }

    protected __createScrollEventFromMouseEvent(event: MouseEvent, prevPosition: number): IScrollEvent {
        return {
            deltaX: 0,
            deltaY: event.clientY - prevPosition,
            preventDefault: () => event.preventDefault(),
            stopPropagation: () => event.stopPropagation()
        };
    }

    protected __createScrollEventFromSliderDelta(event: MouseEvent, prevSliderPosition: number, currSliderPosition: number): IScrollEvent {
        return {
            deltaX: 0,
            deltaY: currSliderPosition - prevSliderPosition,
            preventDefault: () => event.preventDefault(),
            stopPropagation: () => event.stopPropagation()
        };
    }
}