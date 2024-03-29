import { AbstractScrollbar, IScrollBarHost } from "src/base/browser/basic/scrollbar/abstractScrollbar";
import { Scrollable } from "src/base/common/scrollable";

export class VerticalScrollbar extends AbstractScrollbar {

    constructor(scrollable: Scrollable, host: IScrollBarHost) {
        super({ 
            scrollable: scrollable,
            host: host
        });
    }

    // [override abstract methods]

    public getWheelDelta(event: WheelEvent): number {
        return event.deltaY;
    }

    public getTouchPosition(touch: Touch): number {
        return touch.clientY;
    }

    protected __renderScrollbar(size: number): void {
        this.element.classList.add('scroll-bar', 'vertical');
        this.element.style.width = size + 'px';
    }

    protected __updateSlider(size: number, position: number): void {
        const slider = this._slider;
        slider.style.height = size + 'px';
        slider.style.top = position + 'px';
    }
    
    protected __getMousePosition(event: MouseEvent): number {
        return event.clientY;
    }
}