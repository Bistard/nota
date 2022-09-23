import { DomUtility } from "src/base/browser/basic/dom";
import { IListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { Event, Register } from "src/base/common/event";
import { IStandardKeyboardEvent, KeyCode } from "src/base/common/keyboard";
import { memoize } from "src/base/common/memoization";

/**
 * @internal
 * @class An internal class that handles the keyboard support of {@link IListWidget}.
 * It handles:
 *  - enter
 *  - up
 *  - down
 *  - page up
 *  - page down
 *  - escape
 */
export class ListWidgetKeyboardController<T> implements IDisposable {

    // [field]

    private readonly _disposables = new DisposableManager();
    private readonly _view: IListWidget<T>;

    // [constructor]

    constructor(view: IListWidget<T>) {
        this._view = view;
        this._disposables.register(this.onKeydown(e => this.__onDidKeydown(e)));
    }

    // [private getter]

    @memoize private get onKeydown(): Register<IStandardKeyboardEvent> { return Event.filter(this._view.onKeydown, e => !DomUtility.isInputElement(e.target as HTMLElement)); }

    // [public method]

    public dispose(): void {
        this._disposables.dispose();
    }

    // [private helper methods]

    private __onDidKeydown(e: IStandardKeyboardEvent): void {
        e.preventDefault();
        
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

    private __onEnter(e: IStandardKeyboardEvent): void {
        const focused = this._view.getFocus();
        this._view.setSelections(focused !== null ? [focused] : []);
    }

    private __onUpArrow(e: IStandardKeyboardEvent): void {
        if (this._view.getFocus() !== null) {
            const newFoused = this._view.focusPrev(1, false, undefined);
            if (newFoused !== -1) {
                this._view.setAnchor(newFoused);
                this._view.reveal(newFoused, undefined);
            }
            this._view.setDomFocus();
        }
    }

    private __onDownArrow(e: IStandardKeyboardEvent): void {
        if (this._view.getFocus() !== null) {
            const newFoused = this._view.focusNext(1, false, undefined);
            if (newFoused !== -1) {
                this._view.setAnchor(newFoused);
                this._view.reveal(newFoused, undefined);
            }
            this._view.setDomFocus();
        }
    }

    private __onPageupArrow(e: IStandardKeyboardEvent): void {
        // TODO
        console.warn('does not support pageup in ListWidget yet.');
    }

    private __onPagedownArrow(e: IStandardKeyboardEvent): void {
        // TODO
        console.warn('does not support pagedown in ListWidget yet.');
    }

    private __onEscape(e: IStandardKeyboardEvent): void {
        if (this._view.getSelections().length) {
            this._view.setSelections([]);
            this._view.setAnchor(null);
			this._view.setDomFocus();
        }
    }
}