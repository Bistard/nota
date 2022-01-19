import { AbstractScrollbar } from "src/base/browser/basic/scrollbar/abstractScrollbar";
import { Scrollable } from "src/base/common/scrollable";

export class VerticalScrollbar extends AbstractScrollbar {

    constructor(scrollable: Scrollable) {
        super({ scrollable: scrollable });
    }

    // [methods]

    public onDidScroll(event: WheelEvent): void {
        // either no changes or not required, we do nothing
        if (event.deltaY === 0 || this._scrollable.required() === false) {
            return;
        }
        this.rerender();
    }

    public getFutureSliderPosition(event: WheelEvent): number {
        const newPosition = this._scrollable.getScrollPosition() + event.deltaY;
        const viewportSize = this._scrollable.getViewportSize();

        // before the scrollbar
        if (newPosition < 0) {
            return 0;
        }

        // after the scrollbar
        // FIX
        if (newPosition > viewportSize) {
            return viewportSize;
        } 
        
        // returns as normal
        return newPosition;
    }

    // [override abstract methods]

    protected __renderScrollbar(size: number): void {
        const element = this._element!;
        element.classList.add('scroll-bar', 'vertical');
        element.style.width = size + 'px';
    }

    protected override __updateSlider(size: number, position: number): void {
        const slider = this._slider;
        slider.style.height = size + 'px';
        slider.style.top = position + 'px';
    }
    
}