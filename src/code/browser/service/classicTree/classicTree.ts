import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { AsyncMultiTree, IAsyncChildrenProvider, IAsyncMultiTree, IAsyncMultiTreeOptions } from "src/base/browser/secondary/tree/asyncMultiTree";
import { ITreeMouseEvent } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { Emitter, Register } from "src/base/common/event";
import { Pair } from "src/base/common/util/type";
import { ClassicItem } from "src/code/browser/service/classicTree/classicItem";

export interface ClassicOpenEvent {
    readonly item: ClassicItem;
    readonly browserEvent: UIEvent;
}

export interface IClassicTree<T, TFilter> extends IAsyncMultiTree<T, TFilter> {

    /**
     * Fires when a file / notepage in the explorer tree is about to be opened.
     */
    readonly onDidClick: Register<ClassicOpenEvent>;
}

/**
 * @class A simple inheritance that wraps some preset behaviours for explorer view.
 */
export class ClassicTree<T extends ClassicItem, TFilter> extends AsyncMultiTree<T, TFilter> implements IClassicTree<T, TFilter> {

    // [field]

    // [event]

    private readonly _onDidClick = new Emitter<ClassicOpenEvent>();
    public readonly onDidClick = this._onDidClick.registerListener;

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

        this._disposables.register(this.onClick(e => this.__onTreeClick(e)));
    }

    // [public static method]

    /**
     * Use this method to create the tree instead of {@link AsyncMultiTree.create}.
     */
    public static createTree<T extends ClassicItem, TFilter = void>(
        container: HTMLElement, 
        rootData: T, 
        renderers: ITreeListRenderer<T, TFilter, any>[], 
        itemProvider: IListItemProvider<T>, 
        childrenProvider: IAsyncChildrenProvider<T>,
        opts: IAsyncMultiTreeOptions<T, TFilter> = {}
    ): Pair<ClassicTree<T, TFilter>, Promise<void>>
    {
        const tree = new ClassicTree(container, rootData, renderers, itemProvider, childrenProvider, opts);
        return [tree, tree.refresh()];
    }

    // [private helper method]

    private __onTreeClick(event: ITreeMouseEvent<T>): void {
        
        // clicking nowhere
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

}