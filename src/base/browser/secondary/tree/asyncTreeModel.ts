import { IAsyncChildrenProvider } from "src/base/browser/secondary/tree/asyncMultiTree";
import { IAsyncTreeNode } from "src/base/browser/secondary/tree/asyncTree";
import { IMultiTreeModelOptions, MultiTreeModel } from "src/base/browser/secondary/tree/multiTreeModel";
import { ITreeNode } from "src/base/browser/secondary/tree/tree";
import { ISpliceable } from "src/base/common/range";
import { Blocker } from "src/base/common/util/async";
import { Iterable } from "src/base/common/util/iterable";

export class AsyncTreeModel<T, TFilter = void> extends MultiTreeModel<IAsyncTreeNode<T>, TFilter> {
    
    // [field]

    private readonly _root: IAsyncTreeNode<T>;
    private readonly _childrenProvider: IAsyncChildrenProvider<T>;

    /**
     * Mapping the client data to {@link IAsyncTreeNode}. Then each async tree
     * node can be used to map to {@link ITreeNode}.
     */
    private readonly _asyncNodes = new Map<T, IAsyncTreeNode<T>>();

    /**
     * Storing the ongoing {@link Promise} when fetching the children stat of 
     * the corresponding async tree node.
     */
    private readonly _statFetching = new Map<ITreeNode<IAsyncTreeNode<T>, TFilter>, Promise<Iterable<T>>>();
    
     /**
      * Storing the ongoing {@link Promise} when refreshing the async tree node and
      * all its descendants.
      */
    private readonly _nodeRefreshing = new Map<ITreeNode<IAsyncTreeNode<T>, TFilter>, Promise<void>>();

    // [constructor]

    constructor(
        rootNode: IAsyncTreeNode<T>,
        view: ISpliceable<ITreeNode<IAsyncTreeNode<T>, TFilter>>,
        childrenProvider: IAsyncChildrenProvider<T>,
        opts: IMultiTreeModelOptions<IAsyncTreeNode<T>, TFilter>,
    ) {
        super(rootNode, view, opts);
        
        this._root = rootNode;
        this._childrenProvider = childrenProvider;

        this._asyncNodes.set(rootNode.data, rootNode);
    }

    // [getter]

    get rootNode() { return this._root; }

    // [public methods]

    public async refreshNode(node: ITreeNode<IAsyncTreeNode<T>, TFilter>): Promise<void> {
        
        /**
         * If any ongoing refreshing node has a connection with the current node 
         * (equal, or either one is the ancestor of the other), we have to wait 
         * until it has been done, then we retry the refresh operation again.
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
         * settled for refreshing.
         */
        return this.__refreshNodeAndChildren(node);
    }

    public getAsyncNode(data: T): IAsyncTreeNode<T> {
        const node = this._asyncNodes.get(data);
        if (!node) {
            throw new Error('async node is not found');
        }
        return node;
    }

    // [private helper methods]

    /**
     * @description Labeling the given node is refreshing, then refreshing the 
     * tree structure of the given node and all its descendants.
     * @param node The given node.
     * @returns The {@link Promise} of the work.
     */
    private async __refreshNodeAndChildren(node: ITreeNode<IAsyncTreeNode<T>, TFilter>): Promise<void> {

        const asyncNode = node.data;

        // mark the current node is refreshing
        const blocker = new Blocker<void>();
        asyncNode.refreshing = blocker.waiting();
        this._nodeRefreshing.set(node, asyncNode.refreshing);

        // remove the mark once it finished
        asyncNode.refreshing.finally(() => {
            asyncNode.refreshing = null;
            this._nodeRefreshing.delete(node);
        });

        try {
            // wait until finish refreshing all its direct children
            const children = await this.__refreshDirectChildren(node);

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
            // Marking the current node refreshing state is finished.
            blocker.resolve();
        }
    }

    /**
     * @description Will fetching the updated direct children stat of the given 
     * node.
     * @param node The given async tree node.
     */
    private async __refreshDirectChildren(node: ITreeNode<IAsyncTreeNode<T>, TFilter>): Promise<ITreeNode<IAsyncTreeNode<T>, TFilter>[]> {

        const asyncNode = node.data;

        let childrenPromise: Promise<Iterable<T>>;
        asyncNode.couldHasChildren = this._childrenProvider.hasChildren(asyncNode.data);

        if (asyncNode.couldHasChildren === false) {
            // since the current node is a leaf, we return nothing.
            childrenPromise = Promise.resolve(Iterable.empty());
        }

        else {
            /**
             * // REVIEW 
             * We may set a timer instead of choose `await`. Once timed out,
             * we mark this node as `slow` state, and fires the event to tell 
             * everybody. One of the usage of this could be rendering `loading` 
             * animation. For now, I choose `await` for simplicity.
             */
            childrenPromise = Promise.resolve(this.__getChildren(node));
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
    private async __getChildren(node: ITreeNode<IAsyncTreeNode<T>, TFilter>): Promise<Iterable<T>> {
        let refreshing = this._statFetching.get(node);

        // since the node is already fetching, we do nothing and return the same promise.
        if (refreshing) {
            return refreshing;
        }

        // get the children from the provider and set it as refreshing.
        const childrenPromise = Promise.resolve(this._childrenProvider.getChildren(node.data.data));
        this._statFetching.set(node, childrenPromise);
        
        // wait for the children to be finished
        const children = await childrenPromise;
        this._statFetching.delete(node);
        
        return children;
    }

    /**
     * @description Updates the given children to the provided async tree node.
     * @param node The provided tree node.
     * @param childrenIterable The direct children of the given node.
     * @returns After the children were inserted, returns a iterable of the new 
     * children tree nodes.
     */
    private __setChildren(node: ITreeNode<IAsyncTreeNode<T>, TFilter>, childrenIterable: Iterable<T>): ITreeNode<IAsyncTreeNode<T>, TFilter>[] {
        
        const children = [...childrenIterable];

        // corner case check, performance improvement
        if (children.length === 0 && node.children.length === 0) {
            return [];
        }

        /**
         * Create tree node for each child. Moreover check if any of the 
         * children is not collapsed, these children will be returned and for 
         * future refresh.
         */
        const childrenNodesForRefresh: IAsyncTreeNode<T>[] = [];
        const childrenNodes: IAsyncTreeNode<T>[] = [];
        for (const child of children) {
            const hasChildren = this._childrenProvider.hasChildren(child);
            const childAsyncNode = this.__createAsyncTreeNode(child, node.data, hasChildren);

            /**
             * the children of the current children should not be collapsed, we
             * need to keep refreshing on next time.
             */
            if (hasChildren && this._childrenProvider.collapseByDefault && !this._childrenProvider.collapseByDefault(child)) {
                node.collapsed = false;
                childrenNodesForRefresh.push(childAsyncNode);
            }

            childrenNodes.push(childAsyncNode);
        }

        // delete the old children mapping
        for (const oldChild of node.children) {
            this.__dfsDelete(oldChild);
        }

        // update new children mapping
        for (const newChild of childrenNodes) {
            this._asyncNodes.set(newChild.data, newChild);
        }
        
        // insert the children nodes into the current node
        node.children.splice(0, node.children.length, ...childrenNodes);

        return childrenNodesForRefresh;
    }

    /**
     * @description Recursively deletes the given node and its descendants.
     * @param node The provided async tree node.
     */
    private __dfsDelete(node: ITreeNode<IAsyncTreeNode<T>, TFilter>) {
        this._asyncNodes.delete(node.data.data);
        for (const child of node.children) {
            this.__dfsDelete(child);
        }
    }

    /**
     * @description Helper function for fast creating a {@link IAsyncTreeNode}.
     */
    private __createAsyncTreeNode(data: T, parent: IAsyncTreeNode<T> | null, couldHasChildren: boolean): IAsyncTreeNode<T> {
        return {
            data: data,
            refreshing: null,
            couldHasChildren: couldHasChildren,
        };
    }

    /**
     * @description Determines if the given node is an ancestor of the other.
     * @param node The given node.
     * @param other The other node.
     */
    private __isAncestor(node: ITreeNode<IAsyncTreeNode<T>, TFilter>, other: ITreeNode<IAsyncTreeNode<T>, TFilter>): boolean {
        if (other.parent === null) {
            return false;
        } 
        
        else if (other.parent === node) {
            return true;
        }

        return this.__isAncestor(node, other.parent);
    }

}