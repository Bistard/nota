import { AbstractScrollbar } from "src/base/browser/basic/scrollbar/abstractScrollbar";
import { Scrollable } from "src/base/common/scrollable";

export class HorizontalScrollbar extends AbstractScrollbar {

    constructor(scrollable: Scrollable) {
        super({ scrollable: scrollable });
    }

    // [methods]

    public onDidScroll(event: WheelEvent): void {
        // either no changes or not required, we do nothing
        if (event.deltaX === 0 || this._scrollable.required() === false) {
            return;
        }
        this.rerender();
    }

    public getFutureSliderPosition(event: WheelEvent): number {
        const newPosition = this._scrollable.getScrollPosition() + event.deltaX;
        const viewportSize = this._scrollable.getViewportSize();

        // before the scrollbar
        if (newPosition < 0) {
            return 0;
        }

        // exceeds the scrollbar
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
        element.classList.add('scroll-bar', 'horizontal');
        element.style.height = size + 'px';
    }

    protected override __updateSlider(size: number, position: number): void {
        const slider = this._slider;
        slider.style.width = size + 'px';
        slider.style.left = position + 'px';
    }
    
}