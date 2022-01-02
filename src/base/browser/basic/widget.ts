import { Disposable } from "src/base/common/dispose";
import { addDisposableListener, EventType } from "src/base/common/domNode";

/**
 * @description Gives easy abilities to listen to the provided element specific 
 * event type.
 */
export class Widget extends Disposable {
    
    /* Registers a callback function when the provided element is clicked */
    public onClick(element: HTMLElement, callback: (event: any) => void): void {
        this.__register(addDisposableListener(element, EventType.click, callback));
    }

    /* Registers a callback function when the provided element is mouseovered */
    public onMouseover(element: HTMLElement, callback: (event: any) => void): void {
        this.__register(addDisposableListener(element, EventType.mouseover, callback));
    }

    /* Registers a callback function when the provided element is mouseouted */
    public onMouseout(element: HTMLElement, callback: (event: any) => void): void {
        this.__register(addDisposableListener(element, EventType.mouseout, callback));
    }

}