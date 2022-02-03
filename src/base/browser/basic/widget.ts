
import { Disposable, IDisposable } from "src/base/common/dispose";
import { addDisposableListener, EventType } from "src/base/common/dom";

export interface IWidget extends IDisposable {
    
    readonly element: HTMLElement | undefined;

    onClick(element: HTMLElement, callback: (event: any) => void): void;
    onMouseover(element: HTMLElement, callback: (event: any) => void): void;
    onMouseout(element: HTMLElement, callback: (event: any) => void): void;

    render(container: HTMLElement): void;
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
        /* override by the derived classes */
    }

    override dispose(): void {
		if (this._element) {
			this._element.remove();
			this._element = undefined;
		}

		super.dispose();
	}
}