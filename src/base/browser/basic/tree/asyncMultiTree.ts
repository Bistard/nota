import { IAbstractTree } from "src/base/browser/basic/tree/abstractTree";
import { AsyncTreeRenderer } from "src/base/browser/basic/tree/asyncTreeRenderer";
import { IMultiTree, MultiTree } from "src/base/browser/basic/tree/multiTree";
import { ITreeListViewRenderer } from "src/base/browser/basic/tree/treeListViewRenderer";
import { composedItemProvider, IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListTraitEvent } from "src/base/browser/secondary/listWidget/listTrait";
import { IListMouseEvent } from "src/base/browser/secondary/listWidget/listWidget";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { Weakmap } from "src/base/common/map";
import { IScrollEvent } from "src/base/common/scrollable";
import { ITreeNode } from "src/base/browser/basic/tree/tree";
import { AsyncMultiTreeModel, IAsyncMultiTreeModel } from "src/base/browser/basic/tree/asyncMultiTreeModel";

/**
 * Provides functionality to determine the children stat of the given data.
 */
export interface IAsyncChildrenProvider<T> {

    /**
     * @description Check if the given data has children.
     */
    hasChildren(data: T): boolean | Promise<boolean>;

    /**
     * @description Get the children from the given data.
     */
    getChildren(data: T): Iterable<T> | Promise<Iterable<T>>;

}

/**
 * An internal data structure used in {@link AsyncMultiTree}.
 */
export interface IAsyncTreeNode<T> {
    data: T;
    parent: IAsyncTreeNode<T> | null;
    children: IAsyncTreeNode<T>[];
    refreshing: Promise<void> | null;
}

/**
 * Since {@link AsyncMultiTree} built upon a {@link MultiTree}, the internal
 * tree has the type {@link IMultiTree<IAsyncTreeNode<T>>}. It represents any 
 * APIs will return a node with type {@link ITreeNode<IAsyncTreeNode<T>>} which
 * is not expected. To convert the return type to the {@link ITreeNode<T>}, this
 * will work just like a wrapper under a {@link Weakmap}.
 */
export class AsyncNodeConverter<T, TFilter> implements ITreeNode<T, TFilter> {

    constructor(private readonly _node: ITreeNode<IAsyncTreeNode<T> | null, TFilter>) {}

    get data(): T { return this._node.data!.data; }
    get parent(): ITreeNode<T, TFilter> | null { return this._node.parent ? new AsyncNodeConverter(this._node.parent) : null; }
    get children(): ITreeNode<T, TFilter>[] { return this._node.children.map(child => new AsyncNodeConverter(child)); }
    get depth(): number { return this._node.depth; }
    get visible(): boolean { return this._node.visible; }
    get collapsible(): boolean { return this._node.collapsible; }
    get collapsed(): boolean { return this._node.collapsed; }

}

/**
 * Only interface for {@link AsyncMultiTree}.
 */
export interface IAsyncMultiTree<T, TFilter> {

    // [event]

    get onDidScroll(): Register<IScrollEvent>;
    get onDidChangeFocus(): Register<boolean>;
    get onDidChangeItemFocus(): Register<IListTraitEvent>;
    get onDidChangeItemSelection(): Register<IListTraitEvent>;
    
    // TODO
    // get onClick(): Register<IListMouseEvent<IAsyncTreeNode<T>>>;
    // get onDoubleclick(): Register<IListMouseEvent<IAsyncTreeNode<T>>>;
    // get onMouseover(): Register<IListMouseEvent<IAsyncTreeNode<T>>>;
    // get onMouseout(): Register<IListMouseEvent<IAsyncTreeNode<T>>>;
    // get onMousedown(): Register<IListMouseEvent<IAsyncTreeNode<T>>>;
    // get onMouseup(): Register<IListMouseEvent<IAsyncTreeNode<T>>>;
    // get onMousemove(): Register<IListMouseEvent<IAsyncTreeNode<T>>>;

    // [method]

    /**
     * Disposes the whole tree (including view).
     */
    dispose(): void;

    /**
     * @description Given the data, re-acquires the stat of the the corresponding 
     * tree node and then its descendants asynchronousily. The view will be 
     * rerendered after all the tree nodes get refreshed.
     * @param data The provided data with type `T`.
     * @param rerender Rerenders the tree at the end.
     */
    refresh(data?: T): Promise<void>;

}

/** EXPORT FOR MODULE USAGE, DO NOT USE DIRECTLY. */
export type AsyncWeakMap<T, TFilter> = Weakmap<ITreeNode<IAsyncTreeNode<T> | null, TFilter>, ITreeNode<T, TFilter>>;

/**
 * @class Wraps a {@link IMultiTree}, // TODO
 * 
 * 
 * @note Children of each node is NOT decided by the user, instead, creator needs
 * to provider a {@link IAsyncChildrenProvider} which has ability to determine
 * the children of each node.
 */
export class AsyncMultiTree<T, TFilter> implements IAsyncMultiTree<T, TFilter>, IDisposable {

    // [field]

    private readonly _disposables: DisposableManager;

    protected readonly _tree: IMultiTree<IAsyncTreeNode<T>, TFilter>;
    protected readonly _model: IAsyncMultiTreeModel<T, TFilter>;
    
    // [constructor]

    constructor(
        container: HTMLElement,
        renderers: ITreeListViewRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        childrenProvider: IAsyncChildrenProvider<T>,
    ) {
        this._disposables = new DisposableManager();

        const unwrapper: AsyncWeakMap<T, TFilter> = new Weakmap(node => new AsyncNodeConverter(node));

        this._tree = this.__createTree(container, renderers, itemProvider, unwrapper);
        this._model = this.__createModel(this._tree, childrenProvider, unwrapper);
        
    }

    // [event]

    get onDidScroll(): Register<IScrollEvent> { return this._tree.onDidScroll; }
    get onDidChangeFocus(): Register<boolean> { return this._tree.onDidChangeFocus; }
    get onDidChangeItemFocus(): Register<IListTraitEvent> { return this._tree.onDidChangeItemFocus; }
    get onDidChangeItemSelection(): Register<IListTraitEvent> { return this._tree.onDidChangeItemSelection; }
    
    // get onClick(): Register<IListMouseEvent<IAsyncTreeNode<T>>> { return this._tree.onClick; }
    // get onDoubleclick(): Register<IListMouseEvent<IAsyncTreeNode<T>>> { return this._tree.onDoubleclick; }
    // get onMouseover(): Register<IListMouseEvent<IAsyncTreeNode<T>>> { return this._tree.onMouseover; }
    // get onMouseout(): Register<IListMouseEvent<IAsyncTreeNode<T>>> { return this._tree.onMouseout; }
    // get onMousedown(): Register<IListMouseEvent<IAsyncTreeNode<T>>> { return this._tree.onMousedown; }
    // get onMouseup(): Register<IListMouseEvent<IAsyncTreeNode<T>>> { return this._tree.onMouseup; }
    // get onMousemove(): Register<IListMouseEvent<IAsyncTreeNode<T>>> { return this._tree.onMousemove; }

    // [method]

    public async refresh(data: T = this._model.root): Promise<void> {
        this.__refresh(data);
    }

    public dispose(): void {
        this._disposables.dispose();
    }

    // [private helper method]

    /**
     * @description Creates and returns a {@link IMultiTree}.
     */
     private __createTree(
        container: HTMLElement,
        renderers: ITreeListViewRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        unwrapper: AsyncWeakMap<T, TFilter>
    ): MultiTree<IAsyncTreeNode<T>, TFilter> 
    {
        // convert the arguments into correct type (wrappers kind of stuff)
        const asyncRenderers = renderers.map(r => new AsyncTreeRenderer(r, unwrapper));
        const asyncProvider = new composedItemProvider<T, IAsyncTreeNode<T>>(itemProvider);

        return new MultiTree<IAsyncTreeNode<T>, TFilter>(container, asyncRenderers, asyncProvider, {});
    }

    private __createModel(
        tree: IMultiTree<IAsyncTreeNode<T>, TFilter>,
        childrenProvider: IAsyncChildrenProvider<T>,
        unwrapper: AsyncWeakMap<T, TFilter>
    ): IAsyncMultiTreeModel<T, TFilter> {
        return new AsyncMultiTreeModel<T, TFilter>(tree, childrenProvider, unwrapper);
    }

    /**
     * @description Auxiliary method for `refresh()`.
     * @param data The provided data with type `T`.
     */
    private async __refresh(data: T): Promise<void> {
        
        // wait until nothing is refreshing
        const root = this._model.getAsyncNode(data);
        if (root.refreshing) {
            await root.refreshing;
        }

        // get corresponding async node
        const node = this._model.getAsyncNode(data);

        // wait until refresh the node and its descendants
        await this._model.refreshNode(node);
        
        // renders the whole view
        this.__render(node);

    }

    /**
     * @description 
     * @param node 
     */
    private __render(node: IAsyncTreeNode<T>): void {

    }

    
}
