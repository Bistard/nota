import { AbstractScrollbar, IScrollBarHost } from "src/base/browser/basic/scrollbar/abstractScrollbar";
import { Scrollable } from "src/base/common/scrollable";

export class HorizontalScrollbar extends AbstractScrollbar {

    constructor(scrollable: Scrollable, host: IScrollBarHost) {
        super({ 
            scrollable: scrollable,
            host: host
        });
    }

    // [override abstract methods]

    public getWheelDelta(event: WheelEvent): number {
        return event.deltaX;
    }

    public getTouchPosition(touch: Touch): number {
        return touch.clientX;
    }
    
    protected __renderScrollbar(size: number): void {
        this.element.classList.add('scroll-bar', 'horizontal');
        this.element.style.height = size + 'px';
    }

    protected __updateSlider(size: number, position: number): void {
        const slider = this._slider;
        slider.style.width = size + 'px';
        slider.style.left = position + 'px';
    }
    
    protected __getMousePosition(event: MouseEvent): number {
        return event.clientX;
    }
}