import { DomUtility } from "src/base/browser/basic/dom";
import { IListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { Event, Register } from "src/base/common/event";
import { IStandardKeyboardEvent, KeyCode } from "src/base/common/keyboard";
import { memoize } from "src/base/common/memoization";

/**
 * @internal
 * @class An internal class that handles the keyboard support of {@link IListWidget}.
 * It presets the following keypress behaviors (you may extend this class and
 * override the corresponding function):
 *  - enter
 *  - up arrow
 *  - down arrow
 *  - page up
 *  - page down
 *  - escape
 */
export class ListWidgetKeyboardController<T> extends Disposable {

    // [field]

    protected readonly _view: IListWidget<T>;

    // [constructor]

    constructor(view: IListWidget<T>) {
        super();
        this._view = view;
        this.__register(this.onKeydown(e => this.__onDidKeydown_aux(e)));
    }

    // [private getter]

    @memoize 
    protected get onKeydown(): Register<IStandardKeyboardEvent> { return Event.filter(this._view.onKeydown, e => !DomUtility.Elements.isInputElement(e.target as HTMLElement)); }

    // [private helper methods]

    private __onDidKeydown_aux(e: IStandardKeyboardEvent): void {
        e.preventDefault();
        this.__onDidKeydown(e);
    }

    // [protected methods]

    /**
     * @description Override this method to customize other keydown settings.
     * @param e The keydown event.
     */
    protected __onDidKeydown(e: IStandardKeyboardEvent): void {
        switch (e.key) {
            case KeyCode.Enter:
                this.__onEnter(e);
                break;
            case KeyCode.UpArrow:
                this.__onUpArrow(e);
                break;
            case KeyCode.DownArrow:
                this.__onDownArrow(e);
                break;
            case KeyCode.PageUp:
                this.__onPageupArrow(e);
                break;
            case KeyCode.PageDown:
                this.__onPagedownArrow(e);
                break;
            case KeyCode.Escape:
                this.__onEscape(e);
                break;
            default:
                break;
        }
    }

    protected __onEnter(e: IStandardKeyboardEvent): void {
        const focused = this._view.getFocus();
        this._view.setSelections(focused !== null ? [focused] : []);
    }

    protected __onUpArrow(e: IStandardKeyboardEvent): void {
        if (this._view.getFocus() === null) {
            this._view.setFocus(0);
            return;
        }

        const newFocused = this._view.focusPrev(1, false, undefined);
        if (newFocused !== -1) {
            this._view.setAnchor(newFocused);
            this._view.reveal(newFocused, undefined);
        }
    }

    protected __onDownArrow(e: IStandardKeyboardEvent): void {
        if (this._view.getFocus() === null) {
            this._view.setFocus(0);
            return;
        }
        
        const newFocused = this._view.focusNext(1, false, undefined);
        if (newFocused !== -1) {
            this._view.setAnchor(newFocused);
            this._view.reveal(newFocused, undefined);
        }
    }

    protected __onPageupArrow(e: IStandardKeyboardEvent): void {
        // TODO
        console.warn('does not support pageup in ListWidget yet.');
    }

    protected __onPagedownArrow(e: IStandardKeyboardEvent): void {
        // TODO
        console.warn('does not support pagedown in ListWidget yet.');
    }

    protected __onEscape(e: IStandardKeyboardEvent): void {
        if (this._view.getSelections().length > 0) {
            this._view.setSelections([]);
            this._view.setAnchor(null);
			return;
        }

        if (this._view.getSelections().length === 0) {
            this._view.setFocus(null);
            this._view.setAnchor(null);
        }
    }
}