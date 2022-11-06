import { Disposable, IDisposable } from "src/base/common/dispose";
import { addDisposableListener, EventType } from "src/base/browser/basic/dom";
import { Mutable } from "src/base/common/util/type";

export interface IWidget extends IDisposable {
    
    /**
     * The HTMLElement of the widget. 
     * @throws If not rendered, this getter will throw an error.
     */
    readonly element: HTMLElement;

    /**
     * Determine if the widget is rendered.
     */
    readonly rendered: boolean;

    /**
     * @description Renders, apply styles and register listeners in 
     * chronological order.
     * @param element The provided HTMLElement to be treated as the widget's
     * element.
     * 
     * @note A widget can only be rendered once.
     * @throws If the element is undefined or null, an throw will be thrown.
     */
    render(element: HTMLElement): void;

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
    
    private _rendered: boolean;
    private readonly _element!: HTMLElement;

    // [constructor]

    constructor() {
        super();
        this._rendered = false;
    }

    // [method]

    get element(): HTMLElement {
        if (!this._element) {
            throw new Error('The widget is not rendered');
        }
        return this._element;
    }

    get rendered(): boolean {
        return this._rendered;
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
        if (this._rendered) {
            console.warn('Cannot render the widget twice');
            return;
        }

        (<Mutable<HTMLElement>>this._element) = element;
        if (!this._element) {
            throw new Error('The widget is not rendered properly');
        }
        
        this._rendered = true;
        
        this.__render();
        this.__applyStyle();
        this.__registerListeners();
    }

    protected __render(): void {}
    protected __applyStyle(): void {}
    protected __registerListeners(): void {}

    public override dispose(): void {
		if (this._element) {
			this._element.remove();
            (<Mutable<HTMLElement | undefined>>this._element) = undefined;
		}
        super.dispose();
	}
}