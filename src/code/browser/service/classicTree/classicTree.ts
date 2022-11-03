import { AsyncTree, IAsyncTreeOptions } from "src/base/browser/secondary/tree/asyncTree";
import { ITreeMouseEvent } from "src/base/browser/secondary/tree/tree";
import { Emitter, Register } from "src/base/common/event";
import { IStandardKeyboardEvent, KeyCode } from "src/base/common/keyboard";
import { ClassicItem } from "src/code/browser/service/classicTree/classicItem";

export interface ClassicOpenEvent {
    readonly item: ClassicItem;
    readonly browserEvent: UIEvent;
}

export interface IClassicTree<T, TFilter> extends AsyncTree<T, TFilter> {

    /**
     * Fires when a file / notepage in the explorer tree is about to be opened.
     */
    readonly onDidClick: Register<ClassicOpenEvent>;
}

export interface IClassicTreeOptions<T extends ClassicItem, TFilter> extends IAsyncTreeOptions<T, TFilter> {}

/**
 * @class // TODO
 */
export class ClassicTree<T extends ClassicItem, TFilter> extends AsyncTree<T, TFilter> implements IClassicTree<T, TFilter> {

    // [field]

    // [event]

    private readonly _onDidClick = new Emitter<ClassicOpenEvent>();
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        container: HTMLElement,
        rootData: T,
        opts: IClassicTreeOptions<T, TFilter>,
    ) {
        super(container, rootData, opts);
        this.__register(this.onClick(e => this.__onClick(e)));
    }

    // [private helper method]

    private __onClick(event: ITreeMouseEvent<T>): void {
        // clicking no where
        if (event.data === null) {
            return;
        }

        if (event.browserEvent.shiftKey || event.browserEvent.ctrlKey) {
            return;
        }

        if (event.data.isDirectory()) {
            return;
        }

        this._onDidClick.fire({
            item: event.data,
            browserEvent: event.browserEvent
        });
    }
}