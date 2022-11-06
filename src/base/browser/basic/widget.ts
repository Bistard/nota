import { Disposable, IDisposable } from "src/base/common/dispose";
import { addDisposableListener, EventType } from "src/base/browser/basic/dom";
import { Mutable } from "src/base/common/util/type";

export interface IWidget extends IDisposable {
    
    readonly element: HTMLElement | undefined;

    /**
     * @description Renders and auto registers listeners.
     * @param container The provided HTMLElement of the button.
     */
    render(container: HTMLElement): void;

     /**
      * @description Applys the styles to the current HTMLElement. 
      * @note May be override by the derived classes.
      */
    applyStyle(): void;

    onClick(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;
    onDoubleclick(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;
    onMouseover(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;
    onMouseout(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;
    onMousedown(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;    
    onMouseup(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;
    onMousemove(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable;
    onWheel(element: HTMLElement, callback: (event: WheelEvent) => void): IDisposable;
    onTouchstart(element: HTMLElement, callback: (event: TouchEvent) => void): IDisposable;
    onTouchmove(element: HTMLElement, callback: (event: TouchEvent) => void): IDisposable;
    onTouchend(element: HTMLElement, callback: (event: TouchEvent) => void): IDisposable;
    onTouchcancel(element: HTMLElement, callback: (event: TouchEvent) => void): IDisposable;
}

/**
 * @description Gives easy abilities to listen to the provided element specific 
 * event type.
 */
export abstract class Widget extends Disposable implements IWidget {
    
    // [field]
    
    protected readonly _element: HTMLElement | undefined = undefined;

    // [constructor]

    constructor() {
        super();
    }

    // [method]

    get element(): HTMLElement | undefined {
        return this._element;
    }

    public onClick(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.click, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onDoubleclick(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.doubleclick, (e: MouseEvent) => {
            callback(e);
        }));
    }
    public onMouseover(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mouseover, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMouseout(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mouseout, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMousedown(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mousedown, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMouseup(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mouseup, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMousemove(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mousemove, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onWheel(element: HTMLElement, callback: (event: WheelEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.wheel, (e: WheelEvent) => {
            callback(e);
        }));
    }

    public onTouchstart(element: HTMLElement, callback: (event: TouchEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.touchstart, (e: TouchEvent) => {
            callback(e);
        }));
    }

    public onTouchmove(element: HTMLElement, callback: (event: TouchEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.touchmove, (e: TouchEvent) => {
            callback(e);
        }));
    }

    public onTouchend(element: HTMLElement, callback: (event: TouchEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.touchend, (e: TouchEvent) => {
            callback(e);
        }));
    }

    public onTouchcancel(element: HTMLElement, callback: (event: TouchEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.touchcancel, (e: TouchEvent) => {
            callback(e);
        }));
    }

    public render(element: HTMLElement): void {
        (<Mutable<HTMLElement>>this._element) = element;
        // TODO
        /**
         * this.__render();
         * this.__applyStyle();
         * this.__registerListeners();
         */
    }

    public applyStyle(): void {
        // noop
    }

    public override dispose(): void {
		if (this._element) {
			this._element.remove();
            (<Mutable<HTMLElement | undefined>>this._element) = undefined;
		}
        super.dispose();
	}
}