import { AbstractScrollbar } from "src/base/browser/basic/scrollbar/abstractScrollbar";
import { IScrollEvent, Scrollable } from "src/base/common/scrollable";

export class VerticalScrollbar extends AbstractScrollbar {

    constructor(scrollable: Scrollable) {
        super({ scrollable: scrollable });
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