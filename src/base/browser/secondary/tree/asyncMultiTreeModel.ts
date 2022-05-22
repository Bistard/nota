import { AsyncWeakMap, IAsyncChildrenProvider, IAsyncTreeNode } from "src/base/browser/secondary/tree/asyncMultiTree";
import { IMultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeModel, ITreeSpliceEvent, ITreeNode, ITreeCollapseStateChangeEvent } from "src/base/browser/secondary/tree/tree";
import { Emitter, Register } from "src/base/common/event";
import { Iterable } from "src/base/common/iterable";
import { isIterable } from "src/base/common/type";

/**
 * An interface only for {@link AsyncMultiTreeModel}.
 * 
 * @note We are omitting these properties because the type does not fit.
 */
export interface IAsyncMultiTreeModel<T, TFilter> extends Omit<ITreeModel<T, TFilter, T>, 'onDidSplice' | 'onDidChangeCollapseStateChange'> {
    
    get onDidSplice(): Register<ITreeSpliceEvent<IAsyncTreeNode<T> | null, TFilter>>;
    
    get onDidChangeCollapseStateChange(): Register<ITreeCollapseStateChangeEvent<IAsyncTreeNode<T> | null, TFilter>>;

    /**
     * @description Refreshing the tree structure of the given node and all its 
     * descendants.
     * @param node The provided async tree node.
     * @returns The {@link Promise} of the work.
     */
    refreshNode(node: IAsyncTreeNode<T>): Promise<void>;

    /**
     * @description Given the data, returns the corresponding {@link IAsyncTreeNode}.
     * @param data The provided data.
     */
    getAsyncNode(data: T): IAsyncTreeNode<T>;

    /**
     * @description Returns the root async tree node of the tree.
     */
    getRootAsyncNode(): IAsyncTreeNode<T>;

    /** override */
    setCollapsed(data: T, collapsed?: boolean, recursive?: boolean): boolean;
}

/**
 * @class Model relies on a provided {@link IMultiTree} where each tree node has 
 * a type {@link ITreeNode<IAsyncTreeNode<T>>}.
 * 
 * Except the provided {@link IMultiTree}, the model itself will also maintain a 
 * same tree structure but using {@link IAsyncTreeNode<T>}.
 * 
 * The model only maintaining the inner tree structure. The {@link IMultiTree} 
 * and its view will be maintained by the wrapper class {@link IAsyncMultiTree}.
 * 
 * @note Reason for having a same tree structure inside the model, because every
 * `IMultiTree.splice()` call will rerender the whole view. Each `refresh()` 
 * call might causes too many render calls. That is why we need to maintain a 
 * same tree structure, once the build process finished, we only need to render 
 * once in the {@link IAsyncMultiTree}.
 */
export class AsyncMultiTreeModel<T, TFilter = void> implements IAsyncMultiTreeModel<T, TFilter> {

    // [field]

    private readonly _tree: IMultiTree<IAsyncTreeNode<T>, TFilter>;

    private readonly _root: IAsyncTreeNode<T>;
    private readonly _nodes: Map<T | null, IAsyncTreeNode<T>>;
    
    private readonly _unwrapper: AsyncWeakMap<T, TFilter>;
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
        rootData: T,
        tree: IMultiTree<IAsyncTreeNode<T>, TFilter>,
        childrenProvider: IAsyncChildrenProvider<T>,
        nodemap: AsyncWeakMap<T, TFilter>
    ) {
        
        this._root = this.__createAsyncTreeNode(rootData, null);
        this._tree = tree;
        this._nodes = new Map();
        this._nodes.set(null, this._root);
        this._unwrapper = nodemap;

        this._childrenProvider = childrenProvider;

        this._statFetching = new Map();
        this._nodeRefreshing = new Map();
    }

    // [event]

    get onDidSplice(): Register<ITreeSpliceEvent<IAsyncTreeNode<T> | null, TFilter>> { return this._tree.onDidSplice; }
    get onDidChangeCollapseStateChange(): Register<ITreeCollapseStateChangeEvent<IAsyncTreeNode<T> | null, TFilter>> { return this._tree.onDidChangeCollapseStateChange; }

    // [public method]

    get root() { return this._root.data; }

    public async refreshNode(node: IAsyncTreeNode<T>): Promise<void> {
        
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
                return refreshing.then(() => this.refreshNode(node));
            }
        }

        /**
         * Reaching here meaning the given node and all its descendants are all 
         * settled. We may be ready for refreshing.
         */
        return this.__refreshNodeAndChildren(node);
    }

    public getAsyncNode(data: T): IAsyncTreeNode<T> {
        return this.__getAsyncNode(data);
    }

    public getRootAsyncNode(): IAsyncTreeNode<T> {
        return this._root;
    }

    public getNode(data: T): ITreeNode<T, TFilter> {
        const asyncNode = this.__getAsyncNode(data);
        const node = this._tree.getNode(asyncNode === this._root ? null : asyncNode);
        return this._unwrapper.map(node);
    }

    public hasNode(data: T): boolean {
        try {
            this.__getAsyncNode(data);
        } catch (err) {
            return false;
        }
        return true;
    }

    public isCollapsible(data: T): boolean {
        const asyncNode = this.__getAsyncNode(data);
        return this._tree.isCollapsible(asyncNode === this._root ? null : asyncNode);
    }

    public isCollapsed(data: T): boolean {
        const asyncNode = this.__getAsyncNode(data);
        return this._tree.isCollapsed(asyncNode === this._root ? null : asyncNode);
    }

    public setCollapsed(data: T, collapsed?: boolean, recursive?: boolean): boolean {
        const asyncNode = this.__getAsyncNode(data);

        const location = asyncNode === this._root ? null : asyncNode;
        if (collapsed) {
            return this._tree.collapse(location, recursive ?? false);
        } else {
            return this._tree.expand(location, recursive ?? false);
        };
    }

    public rerender(data: T): void {
        const asyncNode = this.__getAsyncNode(data);
        this._tree.rerender(asyncNode === this._root ? null : asyncNode);
    }

    // [private helper method]

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
        }
        
        catch (err) {
            throw err;
        }

        finally {
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

        if (!isIterable(children)) {
            this._statFetching.set(node, children);
            return children.finally(() => this._statFetching.delete(node));
        } else {
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
            this.__dfsDelete(oldChild);
        }
        
        node.children.splice(0, node.children.length, ...childrenNodes);

        return childrenNodes;
    }

    /**
     * @description Recursively deletes the given node and its descendants.
     * @param node The provided async tree node.
     */
    private __dfsDelete(node: IAsyncTreeNode<T>) {
        this._nodes.delete(node.data);
        node.children.forEach(child => this._nodes.delete(child.data));
    }

}