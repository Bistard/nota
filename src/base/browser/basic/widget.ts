import { Disposable, IDisposable } from "src/base/common/dispose";
import { addDisposableListener, EventType } from "src/base/common/dom";
import { Emitter, Register } from "src/base/common/event";

export interface IWidget extends IDisposable {
    
    readonly onDidClick: Register<Event>;
    readonly onDidMouseover: Register<Event>;
    readonly onDidMouseout: Register<Event>;

    onClick(element: HTMLElement, callback: (event: any) => void): void;
    onMouseover(element: HTMLElement, callback: (event: any) => void): void;
    onMouseout(element: HTMLElement, callback: (event: any) => void): void;

    readonly element: HTMLElement | undefined;
    render(container: HTMLElement): void;
    applyStyle(): void;
}

/**
 * @description Gives easy abilities to listen to the provided element specific 
 * event type. Moreover, other listeners can listen to the same event from this 
 * widget.
 * 
 * @note When invokes onXXX() series of methods, it will automaticaly invokes 
 * all the corresponding event onDidXXX() methods. Briefly speaking, events will
 * be fired automatically.
 */
export abstract class Widget extends Disposable implements IWidget {
    
    // REVIEW: causes extra memory usage if the derived classes are not listening to some provided events
    /* Events */
    private readonly _onDidClick = this.__register( new Emitter<Event>() );
    public readonly onDidClick = this._onDidClick.registerListener;

    private readonly _onDidMouseover = this.__register( new Emitter<Event>() );
    public readonly onDidMouseover = this._onDidMouseover.registerListener;

    private readonly _onDidMouseout = this.__register( new Emitter<Event>() );
    public readonly onDidMouseout = this._onDidMouseout.registerListener;

    /* other attributes */

    protected _element: HTMLElement | undefined = undefined;

    /* constructor */
    constructor() {
        super();
    }

    get element(): HTMLElement | undefined {
        return this._element;
    }

    /* Registers a callback function when the provided element is clicked */
    public onClick(element: HTMLElement, callback: (event: any) => void): void {
        this.__register(addDisposableListener(element, EventType.click, (e: any) => {
            callback(e);
            this._onDidClick.fire(e);
        }));
    }

    /* Registers a callback function when the provided element is mouseovered */
    public onMouseover(element: HTMLElement, callback: (event: any) => void): void {
        this.__register(addDisposableListener(element, EventType.mouseover, (e: any) => {
            callback(e);
            this._onDidMouseover.fire(e);
        }));
    }

    /* Registers a callback function when the provided element is mouseouted */
    public onMouseout(element: HTMLElement, callback: (event: any) => void): void {
        this.__register(addDisposableListener(element, EventType.mouseout, (e: any) => {
            callback(e);
            this._onDidMouseout.fire(e);
        }));
    }

    public render(container: HTMLElement): void {
        this._element = container;
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