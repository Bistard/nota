import { Disposable } from "src/base/common/dispose";
import { addDisposableListener, EventType } from "src/base/common/domNode";

/**
 * @description // TODO
 */
export class Widget extends Disposable {
    
    public onClick(element: HTMLElement, callback: (event: any) => void): void {
        this.__register(addDisposableListener(element, EventType.click, callback));
    }

    public onMouseover(element: HTMLElement, callback: (event: any) => void): void {
        this.__register(addDisposableListener(element, EventType.mouseover, callback));
    }

    public onMouseout(element: HTMLElement, callback: (event: any) => void): void {
        this.__register(addDisposableListener(element, EventType.mouseout, callback));
    }

}