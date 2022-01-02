import { Disposable } from "src/base/common/dispose";
import { addDisposableListener, EventType } from "src/base/common/domNode";
import { Emitter } from "src/base/common/event";

/**
 * @description Gives easy abilities to listen to the provided element specific 
 * event type. Moreover, other listeners can listen to the same event from this 
 * widget.
 * 
 * @note When invokes onXXX() series of methods, it will automaticaly invokes 
 * all the corresponding event onDidXXX() methods.
 */
export class Widget extends Disposable {
    
    /* Events */
    protected readonly _onDidClick = this.__register( new Emitter<Event>() );
    public readonly onDidClick = this._onDidClick.registerListener;

    protected readonly _onDidMouseover = this.__register( new Emitter<Event>() );
    public readonly onDidMouseover = this._onDidMouseover.registerListener;

    protected readonly _onDidMouseout = this.__register( new Emitter<Event>() );
    public readonly onDidMouseout = this._onDidMouseout.registerListener;

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

}