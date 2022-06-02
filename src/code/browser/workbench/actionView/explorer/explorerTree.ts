import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { AsyncMultiTree, IAsyncChildrenProvider, IAsyncMultiTree, IAsyncMultiTreeOptions } from "src/base/browser/secondary/tree/asyncMultiTree";
import { ITreeMouseEvent } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { Emitter, Register } from "src/base/common/event";
import { Pair } from "src/base/common/util/type";
import { ExplorerItem } from "src/code/browser/workbench/actionView/explorer/explorerItem";

export interface IExplorerOpenEvent<T> {
    item: T;
    browserEvent: UIEvent;
}

export interface IExplorerTree<T, TFilter> extends IAsyncMultiTree<T, TFilter> {

    /**
     * Fires when a file / notepage in the explorer tree is about to be opened.
     */
    readonly onOpen: Register<IExplorerOpenEvent<T>>;

}

/**
 * @class A simple inheritance that wraps some preset behaviours for explorer view.
 */
export class ExplorerTree<T extends ExplorerItem, TFilter> extends AsyncMultiTree<T, TFilter> implements IExplorerTree<T, TFilter> {

    // [field]

    // [event]

    private readonly _onOpen = new Emitter<IExplorerOpenEvent<T>>();
    public readonly onOpen = this._onOpen.registerListener;

    // [constructor]

    private constructor(
        container: HTMLElement,
        rootData: T,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        childrenProvider: IAsyncChildrenProvider<T>,
        opts: IAsyncMultiTreeOptions<T, TFilter> = {},
    ) {
        super(container, rootData, renderers, itemProvider, childrenProvider, opts);

        this._disposables.register(this.onClick(e => this.__onClick(e)));
    }

    // [public static method]

    /**
     * // REVIEW: Cannot do override here, weird conflict between inheritance and static method
     */
    public static create1<T extends ExplorerItem, TFilter = void>(
        container: HTMLElement, 
        rootData: T, 
        renderers: ITreeListRenderer<T, TFilter, any>[], 
        itemProvider: IListItemProvider<T>, 
        childrenProvider: IAsyncChildrenProvider<T>,
        opts: IAsyncMultiTreeOptions<T, TFilter> = {}
    ): Pair<ExplorerTree<T, TFilter>, Promise<void>>
    {
        const tree = new ExplorerTree(container, rootData, renderers, itemProvider, childrenProvider, opts);
        return [tree, tree.refresh()];
    }

    // [private helper method]

    private __onClick(event: ITreeMouseEvent<T>): void {
        
        // clicking nowhere
        if (event.data === null) {
            return;
        }

        if (event.data.isDirectory()) {
            return;
        }

        this._onOpen.fire({
            item: event.data,
            browserEvent: event.browserEvent
        });
    }

}