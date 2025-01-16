import { BaseElement, IBaseElement } from "src/base/browser/basic/dom";
import { panic } from "src/base/common/utilities/panic";

export interface IWidget extends IBaseElement {
    
    /**
     * The HTMLElement of the widget. 
     * @panic If not rendered, this getter will throw an error.
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
     * @panic A widget can only be rendered once.
     * @panic If the element is undefined or null, an throw will be thrown.
     */
    render(element: HTMLElement): void;
}

/**
 * @description Gives easy abilities to listen to the provided element specific 
 * event type.
 */
export abstract class Widget extends BaseElement implements IWidget {
    
    // [field]
    
    private _rendered: boolean;
    private _element?: HTMLElement;

    // [constructor]

    constructor() {
        super();
        this._rendered = false;
    }

    // [method]

    get element(): HTMLElement {
        if (!this._element) {
            panic('[Widget] The widget is not rendered');
        }
        return this._element;
    }

    get rendered(): boolean {
        return this._rendered;
    }

    public render(element: HTMLElement): void {
        if (this._rendered) {
            console.warn('[Widget] Cannot render the widget twice');
            return;
        }

        this._element = element;
        if (!this._element) {
            panic('[Widget] The widget is not rendered properly');
        }
        
        this._rendered = true;
        
        this.__render(element);
        this.__applyStyle(element);
        this.__registerListeners(element);
    }

    protected __render(element: HTMLElement): void {}
    protected __applyStyle(element: HTMLElement): void {}
    protected __registerListeners(element: HTMLElement): void {}

    public override dispose(): void {
		if (this._element) {
			this._element.remove();
            this._element = undefined;
		}
        super.dispose();
	}
}