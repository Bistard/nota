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
import { Iterable } from "src/base/common/iterable";
import { isPromise } from "util/types";

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

    constructor(private readonly _node: ITreeNode<IAsyncTreeNode<T>, TFilter>) {}

    get data(): T { return this._node.data.data; }
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
export type AsyncWeakMap<T, TFilter> = Weakmap<ITreeNode<IAsyncTreeNode<T>, TFilter>, ITreeNode<T, TFilter>>;

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
    protected readonly _root: IAsyncTreeNode<T>;
    
    private readonly _nodes: Map<T | null, IAsyncTreeNode<T>>;
    private readonly _nodemap: AsyncWeakMap<T, TFilter> = new Weakmap(node => new AsyncNodeConverter(node));

    private readonly _childrenProvider: IAsyncChildrenProvider<T>;

    /**
     * Storing the ongoing {@link Promise} when fetching the children stat of 
     * the corresponding async tree node.
     */
    private readonly _statFetching: Map<IAsyncTreeNode<T>, Promise<Iterable<T>>>;
    
    /**
     * Storing the ongoing {@link Promise} when refreshing the async tree node and
     * all its descendants.
     */
    private readonly _nodeRefreshing: Map<IAsyncTreeNode<T>, Promise<void>>;

    // [constructor]

    constructor(
        container: HTMLElement,
        renderers: ITreeListViewRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        childrenProvider: IAsyncChildrenProvider<T>,
    ) {
        this._disposables = new DisposableManager();

        this._tree = this.__createTree(container, renderers, itemProvider);
        this._root = this.__createAsyncTreeNode(undefined!, null);
        this._nodes = new Map();
        this._nodes.set(null, this._root);

        this._childrenProvider = childrenProvider;

        this._statFetching = new Map();
        this._nodeRefreshing = new Map();

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

    public async refresh(data: T = this._root.data): Promise<void> {
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
        itemProvider: IListItemProvider<T>
    ): MultiTree<IAsyncTreeNode<T>, TFilter> 
    {
        // convert the arguments into correct type (wrappers kind of stuff)
        const asyncRenderers = renderers.map(r => new AsyncTreeRenderer(r, this._nodemap));
        const asyncProvider = new composedItemProvider<T, IAsyncTreeNode<T>>(itemProvider);

        return new MultiTree<IAsyncTreeNode<T>, TFilter>(container, asyncRenderers, asyncProvider, {});
    }

    /**
     * @description Given the data, returns the corresponding async node.
     * @param data The given data.
     */
    private __getAsyncNode(data: T): IAsyncTreeNode<T> {
        
        // given data, gets corresponding async node.
        const node = this._nodes.get(data === this._root.data ? null : data);

        if (node === undefined) {
            throw new Error('async node is not founded');
        }

        return node;
    }

    /**
     * @description Determines if the given node is an ancestor of the other.
     * @param node The given node.
     * @param other The other node.
     */
    private __isAncestor(node: IAsyncTreeNode<T>, other: IAsyncTreeNode<T>): boolean {
        if (other.parent === null) {
            return false;
        } 
        
        else if (other.parent === node) {
            return true;
        }

        return this.__isAncestor(node, other.parent);
    }

    /**
     * @description Helper function for fast creating a {@link IAsyncTreeNode}.
     */
    private __createAsyncTreeNode(data: T, parent: IAsyncTreeNode<T> | null): IAsyncTreeNode<T> {
        return {
            data: data,
            parent: parent,
            children: [],
            refreshing: null
        };
    }
    
    // [`refresh()` implementation]

    /**
     * @description Auxiliary method for `refresh()`.
     * @param data The provided data with type `T`.
     */
    private async __refresh(data: T): Promise<void> {
        
        // wait until nothing is refreshing
        if (this._root.refreshing) {
            await this._root.refreshing;
        }

        // get corresponding async node
        const node = this.__getAsyncNode(data);

        // wait until refresh the node and its descendants
        await this.__refreshNode(node);
        
        // renders the whole view
        this.__render(node);

    }

    /**
     * @description Refreshing the tree structure of the given node and all its 
     * descendants.
     * @param node The provided async tree node.
     * @returns The {@link Promise} of the work.
     */
    private async __refreshNode(node: IAsyncTreeNode<T>): Promise<void> {

        /**
         * If any ongoing refreshing node has a connection with the current node 
         * (equal, or either one is the ancestor of the other), we have to wait 
         * until it has been done, then we retry the method.
         */
        for (const [other, refreshing] of this._nodeRefreshing) {
            if (node === other || 
                this.__isAncestor(node, other) || 
                this.__isAncestor(other, node)) 
            {
                return refreshing.then(() => this.__refreshNode(node));
            }
        }

        /**
         * Reaching here meaning the given node and all its descendants are all 
         * settled. We may be ready for refreshing.
         */
        return this.__refreshNodeAndChildren(node);
    }

    /**
     * @description Labeling the given node is refreshing, then refreshing the 
     * tree structure of the given node and all its descendants.
     * @param node The given node.
     * @returns The {@link Promise} of the work.
     */
    private async __refreshNodeAndChildren(node: IAsyncTreeNode<T>): Promise<void> {

        // mark the current node is refreshing
        let finishRefresh: () => void;
        node.refreshing = new Promise((resolve, reject) => finishRefresh = resolve );
        this._nodeRefreshing.set(node, node.refreshing);

        // remove the mark once it finished
        node.refreshing.finally(() => {
            node.refreshing = null;
            this._nodeRefreshing.delete(node);
        });

        try {

            // wait until finish refreshing all its direct children
            const children = await this.__refreshChildren(node);

            /**
             * we continue the same work to the direct children, refreshing the 
             * other descendants.
             */
            await Promise.all(children.map(child => this.__refreshNodeAndChildren(child)));

        } finally {
            /**
             * function will do nothing except marking the current node 
             * refreshing state is finished.
             */
            finishRefresh!();
        }
    }

    /**
     * @description Will fetching the updated children of the given node and 
     * refresh the tree structure by the children.
     * @param node The given async tree node.
     */
    private async __refreshChildren(node: IAsyncTreeNode<T>): Promise<IAsyncTreeNode<T>[]> {

        let childrenPromise: Promise<Iterable<T>>;
        const hasChildren = this._childrenProvider.hasChildren(node.data);

        if (hasChildren === false) {
            // since the current node is a leaf, we return nothing.
            childrenPromise = Promise.resolve(Iterable.empty());
        }

        else {
            /**
             * @note We may set a timer instead of choose `await`. Once timed out,
             * we mark this node as `slow` state, and fires the event to tell 
             * everybody. One of the usage of this could be rendering `loading` 
             * animation. For now, I choose `await` for simplicity.
             */
            const children = this.__getChildren(node);
            childrenPromise = Promise.resolve(children);
        }

        try {
            const children = await childrenPromise;
            return this.__setChildren(node, children);
        } 
        
        catch (err) {
            throw err;
        } 
        
        finally {
            // do nothing for now
        }
    }

    /**
     * @description Given the tree node, returns the newest children of the node.
     * @param node The provided async tree node.
     */
    private __getChildren(node: IAsyncTreeNode<T>): Promise<Iterable<T>> | Iterable<T> {
        let refreshing = this._statFetching.get(node);

        // since the node is already fetching, we do nothing and return the same promise.
        if (refreshing) {
            return refreshing;
        }

        const children = this._childrenProvider.getChildren(node.data);
        
        if (isPromise(children)) {
            this._statFetching.set(node, children);
            return children.finally(() => this._statFetching.delete(node));
        }

        else {
            return children;
        }
    }

    /**
     * @description Updates the given children to the provided async tree node.
     * @param node The provided tree node.
     * @param childrenIterable The direct children of the given node.
     * @returns After the children were inserted, returns a iterable of the new 
     * children tree nodes.
     */
    private __setChildren(node: IAsyncTreeNode<T>, childrenIterable: Iterable<T>): IAsyncTreeNode<T>[] {
        
        const children = [...childrenIterable];

        // corner case check, performance improvement
        if (children.length === 0 && node.children.length === 0) {
            return [];
        }

        // create async tree node for each child
        const childrenNodes = children.map<IAsyncTreeNode<T>>(child => {
            return this.__createAsyncTreeNode(child, node);
        });

        // update new children mapping
        for (const newChild of childrenNodes) {
            this._nodes.set(newChild.data, newChild);
        }

        // delete the old children mapping
        for (const oldChild of node.children) {
            this._nodes.delete(oldChild.data);
        }
        
        node.children.splice(0, node.children.length, ...childrenNodes);

        return childrenNodes;
    }

    /**
     * @description 
     * @param node 
     */
    private __render(node: IAsyncTreeNode<T>): void {

    }

    
}
