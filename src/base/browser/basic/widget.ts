import { BaseElement, IBaseElement } from "src/base/browser/basic/dom";
import { Mutable } from "src/base/common/util/type";

export interface IWidget extends IBaseElement {
    
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
}

/**
 * @description Gives easy abilities to listen to the provided element specific 
 * event type.
 */
export abstract class Widget extends BaseElement implements IWidget {
    
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