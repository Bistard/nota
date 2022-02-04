import { AbstractScrollbar, ScrollBarHost } from "src/base/browser/basic/scrollbar/abstractScrollbar";
import { Scrollable } from "src/base/common/scrollable";

export class VerticalScrollbar extends AbstractScrollbar {

    constructor(scrollable: Scrollable, host: ScrollBarHost) {
        super({ 
            scrollable: scrollable,
            host: host
        });
    }

    // [override abstract methods]

    public getDelta(event: WheelEvent): number {
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
}