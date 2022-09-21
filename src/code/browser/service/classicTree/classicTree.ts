import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { AsyncTree, IAsyncTreeOptions } from "src/base/browser/secondary/tree/asyncTree";
import { ITreeMouseEvent } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
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
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IClassicTreeOptions<T, TFilter>,
    ) {
        super(container, rootData, renderers, itemProvider, opts);
        this.__register(this.onClick(e => this.__onClick(e)));
        this.__register(this.onKeydown(e => this.__onKeydown(e)))
    }

    // [private helper method]

    private __onClick(event: ITreeMouseEvent<T>): void {
        // clicking no where
        if (event.data === null) {
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

    private __onKeydown(event: IStandardKeyboardEvent): void {
        if (event.key === KeyCode.Enter) {
            const anchor = this.getAnchor();
            if (anchor) {
                this.toggleCollapseOrExpand(anchor, false);
            }
        }
    }
}