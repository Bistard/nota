
import { Disposable, IDisposable } from "src/base/common/dispose";
import { addDisposableListener, EventType } from "src/base/browser/basic/dom";

export interface IWidget extends IDisposable {
    
    readonly element: HTMLElement | undefined;

    onClick(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;
    onDoubleclick(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;
    onMouseover(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;
    onMouseout(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;
    onMousedown(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;    
    onMouseup(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;
    onMousemove(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;
    onWheel(element: HTMLElement, callback: (event: WheelEvent) => void): IDisposable;
    
    /**
     * @description Renders and auto registers listeners.
     * @param container The provided HTMLElement of the button.
     */
    render(container: HTMLElement): void;

     /**
      * @description Applys the styles to the current HTMLElement. 
      * May be override by the derived classes.
      */
    applyStyle(): void;
}

/**
 * @description Gives easy abilities to listen to the provided element specific 
 * event type.
 */
export abstract class Widget extends Disposable implements IWidget {
    
    // [attributes]
    protected _element: HTMLElement | undefined = undefined;

    // [constructor]
    constructor() {
        super();
    }

    get element(): HTMLElement | undefined {
        return this._element;
    }

    /* Registers a callback function when the provided element is clicked */
    public onClick(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.click, (e: MouseEvent) => {
            callback(e);
        }));
    }

    /* Registers a callback function when the provided element is double-clicked */
    public onDoubleclick(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.doubleclick, (e: MouseEvent) => {
            callback(e);
        }));
    }

    /* Registers a callback function when the provided element is mouseovered */
    public onMouseover(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mouseover, (e: MouseEvent) => {
            callback(e);
        }));
    }

    /* Registers a callback function when the provided element is mouseouted */
    public onMouseout(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mouseout, (e: MouseEvent) => {
            callback(e);
        }));
    }

    /* Registers a callback function when the provided element is mousedowned */
    public onMousedown(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mousedown, (e: MouseEvent) => {
            callback(e);
        }));
    }

    /* Registers a callback function when the provided element is mouseuped */
    public onMouseup(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mouseup, (e: MouseEvent) => {
            callback(e);
        }));
    }

    /* Registers a callback function when the provided element is mousemoved */
    public onMousemove(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mousemove, (e: MouseEvent) => {
            callback(e);
        }));
    }

    /* Registers a callback function when the provided element is on-wheel scrolling */
    public onWheel(element: HTMLElement, callback: (event: WheelEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.wheel, (e: WheelEvent) => {
            callback(e);
        }));
    }

    public render(element: HTMLElement): void {
        this._element = element;
    }

    public applyStyle(): void {
        
    }

    public override dispose(): void {
		if (this._element) {
            // REVIEW: check if remove() will automatically calling `removeEventListener()`.
            // REVIEW: if yes, we then do not need to register its own event listener at the first place.
			this._element.remove();
			this._element = undefined;
		}
        super.dispose();
	}
}