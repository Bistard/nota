import { AbstractScrollbar, ScrollBarHost } from "src/base/browser/basic/scrollbar/abstractScrollbar";
import { IScrollEvent, Scrollable } from "src/base/common/scrollable";

export class HorizontalScrollbar extends AbstractScrollbar {

    constructor(scrollable: Scrollable, host: ScrollBarHost) {
        super({ 
            scrollable: scrollable,
            host: host
        });
    }

    // [methods]

    public getFutureSliderPosition(event: IScrollEvent): number {
        const left = this._scrollable.getSliderPosition();
        const newLeft = left + event.deltaX;
        const edgeLeft = this._scrollable.getViewportSize() - this._scrollable.getSliderSize();

        // before the scrollbar
        if (newLeft < 0) {
            event.deltaX = 0 - left;
            return 0;
        }

        // after the scrollbar
        if (newLeft > edgeLeft) {
            event.deltaX = edgeLeft - left;
            return edgeLeft;
        } 
        
        // returns as normal
        return newLeft;
    }

    // [override abstract methods]

    public getScrollDelta(event: IScrollEvent): number {
        return event.deltaX;
    }

    public updateScrollSensibility(event: IScrollEvent, sensibility: number): void {
        event.deltaX *= sensibility;
    }

    protected __onDidScroll(event: IScrollEvent): void {
        // either no changes or not required, we do nothing
        if (event.deltaX === 0 || this._scrollable.required() === false) {
            return;
        }
        this.rerender();
    }

    protected __renderScrollbar(size: number): void {
        const element = this._element!;
        element.classList.add('scroll-bar', 'horizontal');
        element.style.height = size + 'px';
    }

    protected __updateSlider(size: number, position: number): void {
        const slider = this._slider;
        slider.style.width = size + 'px';
        slider.style.left = position + 'px';
    }
    
    protected __getMousePosition(event: MouseEvent): number {
        return event.clientX;
    }

    protected __createScrollEventFromMouseEvent(event: MouseEvent, prevPosition: number): IScrollEvent {
        return {
            deltaX: event.clientX - prevPosition,
            deltaY: 0,
            preventDefault: () => event.preventDefault(),
            stopPropagation: () => event.stopPropagation()
        };
    }

    protected __createScrollEventFromSliderDelta(event: MouseEvent, prevSliderPosition: number, currSliderPosition: number): IScrollEvent {
        return {
            deltaX: currSliderPosition - prevSliderPosition,
            deltaY: 0,
            preventDefault: () => event.preventDefault(),
            stopPropagation: () => event.stopPropagation()
        };
    }
}