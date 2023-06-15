import { IAsyncNode, IChildrenProvider, IIdentiityProivder } from "src/base/browser/secondary/tree/asyncTree";
import { IMultiTreeModelOptions, FlexMultiTreeModel } from "src/base/browser/secondary/tree/multiTreeModel";
import { ITreeNode } from "src/base/browser/secondary/tree/tree";
import { ISpliceable } from "src/base/common/range";
import { Blocker } from "src/base/common/util/async";

/**
 * An interface only for {@link AsyncTreeModel}.
 */
export interface IAsyncTreeModel<T, TFilter> extends FlexMultiTreeModel<T, TFilter> {
    
    /**
     * @description Refreshing the tree structure of the given node and all its 
     * descendants. This will always fetch the latest children of the current 
     * node.
     * @param node The provided async tree node.
     * @returns The {@link Promise} of the work.
     */
    refreshNode(node: IAsyncNode<T, TFilter>): Promise<void>;
}

/**
 * Constructor option for {@link AsyncTreeModel}.
 */
export interface IAsyncTreeModelOptions<T, TFilter> extends IMultiTreeModelOptions<T, TFilter> {
    readonly childrenProvider: IChildrenProvider<T>;
    readonly identityProvider?: IIdentiityProivder<T>;
}

/**
 * @class A {@link AsyncTreeModel} extends {@link FlexMultiTreeModel} and also 
 * wraps a {@link IAsyncNode} over each client data.
 * 
 * @implements
 * The node for refreshing should be returned by {@link FlexMultiTreeModel.getNode}
 * so that we are always modifying the original tree structure instead of 
 * creating a new one.
 */
export class AsyncTreeModel<T, TFilter> extends FlexMultiTreeModel<T, TFilter> implements IAsyncTreeModel<T, TFilter> {
    
    // [field]

    private readonly _childrenProvider: IChildrenProvider<T>;
    private readonly _identityProvider?: IIdentiityProivder<T>;

    /**
     * Storing the ongoing {@link Promise} when fetching the children stat of 
     * the corresponding async tree node.
     */
    private readonly _statFetching = new Map<IAsyncNode<T, TFilter>, Promise<T[]>>();
    
    /**
     * Storing the ongoing {@link Promise} when refreshing the async tree node and
     * all its descendants.
     */
    private readonly _nodeRefreshing = new Map<IAsyncNode<T, TFilter>, Promise<void>>();

    // [constructor]

    constructor(
        rootData: T,
        view: ISpliceable<ITreeNode<T, TFilter>>,
        opts: IAsyncTreeModelOptions<T, TFilter>,
    ) {
        super(rootData, view, opts);
        this._childrenProvider = opts.childrenProvider;
        this._identityProvider = opts.identityProvider;
    }

    // [public methods]

    public async refreshNode(node: IAsyncNode<T, TFilter>): Promise<void> {
        
        /**
         * Forget the current children of the node so that next `getChildren`
         * operation will work properly.
         */
        if (this._childrenProvider.forgetChildren) {
            this._childrenProvider.forgetChildren(node.data);
        }

        /**
         * The node is already collapsed, we should do nothing since there is no
         * need to refresh. We will forget the children next time.
         */
        if (node.collapsed) {
            return;
        }

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

    // [private helper methods]

    /**
     * @description Labeling the given node is refreshing, then refreshing the 
     * tree structure of the given node and all its descendants.
     * @param asyncNode The given node.
     * @returns The {@link Promise} of the work.
     */
    private async __refreshNodeAndChildren(asyncNode: IAsyncNode<T, TFilter>): Promise<void> {

        // mark the current node is refreshing
        const blocker = new Blocker<void>();
        asyncNode.refreshing = blocker.waiting();
        this._nodeRefreshing.set(asyncNode, asyncNode.refreshing);

        // remove the mark once it finished
        asyncNode.refreshing.finally(() => {
            this._nodeRefreshing.delete(asyncNode);
            asyncNode.refreshing = undefined;
        });

        try {
            // wait until finish refreshing all its direct children
            const childrenToRefresh = await this.__refreshDirectChildren(asyncNode);

            /**
             * we continue the same work to the direct children, refreshing the 
             * other descendants.
             */
            await Promise.all(childrenToRefresh.map(child => this.__refreshNodeAndChildren(child)));
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
     * @param asyncNode The given async tree node.
     * @returns An array of children that requires further refresh.
     */
    private async __refreshDirectChildren(asyncNode: IAsyncNode<T, TFilter>): Promise<IAsyncNode<T, TFilter>[]> {

        let childrenPromise: Promise<T[]>;
        asyncNode.collapsible = this._childrenProvider.hasChildren(asyncNode.data);

        if (asyncNode.collapsible === false) {
            childrenPromise = Promise.resolve([]);
        } else {
            childrenPromise = this.__getChildren(asyncNode);
        }

        try {
            const children = await childrenPromise;
            return this.__setChildren(asyncNode, children);
        } 
        
        catch (err) {
            throw err;
        }
    }

    /**
     * @description Given the tree node, returns the newest children of the node.
     * @param node The provided async tree node.
     */
    private async __getChildren(node: IAsyncNode<T, TFilter>): Promise<T[]> {
        let refreshing = this._statFetching.get(node);

        // since the node is already fetching, we do nothing and return the same promise.
        if (refreshing) {
            return refreshing;
        }

        // get the children from the provider and set it as refreshing.
        const childrenPromise = Promise.resolve(this._childrenProvider.getChildren(node.data));
        this._statFetching.set(node, childrenPromise);
        
        // wait for the children to be finished
        const children = await childrenPromise;
        this._statFetching.delete(node);
        
        return children;
    }

    /**
     * @description Updates the given children to the provided {@link IAsyncNode}.
     * @param node The provided tree node.
     * @param childrenData The direct children of the given node.
     * @returns An array of children that requires further refresh.
     */
    private __setChildren(node: IAsyncNode<T, TFilter>, childrenData: readonly T[]): IAsyncNode<T, TFilter>[] 
    {
        /**
         * Was empty children and no children is changed, we should quit and 
         * refresh nothing.
         */
        if (!childrenData.length && !node.children.length) {
            return [];
        }

        // will be returned for the deeper refresh in the future
        const childrenNodesToRefresh: IAsyncNode<T, TFilter>[] = [];
        // the updated direct children of the current node
        const childrenNodes: IAsyncNode<T, TFilter>[] = [];
        
        /**
         * If the tree can identify the uniqueness of each node, then it is 
         * possible to reuse the old nodes instead of creating new ones.
         */
        if (this._identityProvider) {
            this.__tryReuseOldNode(this._identityProvider, childrenData, node, childrenNodes, childrenNodesToRefresh);
        } else {
            this.__alwaysCreateNewNode(childrenData, node, childrenNodes, childrenNodesToRefresh);
        }

        node.stale = true;
        node.oldChildren = node.children;
        node.children = childrenNodes;

        return childrenNodesToRefresh;
    }

    /**
     * @description When refreshing the given parent, the children node will 
     * always be replaced by the new created node.
     */
    private __alwaysCreateNewNode(
        childrenData: readonly T[],
        parent: IAsyncNode<T, TFilter>,
        newNodes: IAsyncNode<T, TFilter>[],
        newNodesToRefresh: IAsyncNode<T, TFilter>[],
    ): void 
    {
        for (const childData of childrenData) {
            const hasChildren = this._childrenProvider.hasChildren(childData);
            const newChildNode = this.__createNewChildNode(childData, parent, hasChildren, newNodesToRefresh);
            newNodes.push(newChildNode);
        }
    }

    /**
     * @description When refreshing the given parent, the old child node may be 
     * reused when detect duplicate client provided data.
     */
    private __tryReuseOldNode(
        identityProvider: IIdentiityProivder<T>,
        childrenData: readonly T[],
        parent: IAsyncNode<T, TFilter>,
        newNodes: IAsyncNode<T, TFilter>[],
        newNodesToRefresh: IAsyncNode<T, TFilter>[],
    ): void 
    {
        /**
         * When an identity provider is given. Use a mapping that remembers all 
         * the existed data, for the re-use purpose when encountering the same 
         * data.
         */
        const existedNodes = new Map<string, IAsyncNode<T, TFilter>>();
        for (const existed of parent.children) {
            const id = identityProvider.getID(existed.data);
            existedNodes.set(id, existed);
        }

        for (const childData of childrenData) {
            const hasChildren = this._childrenProvider.hasChildren(childData);

            const id = identityProvider.getID(childData);
            const existedNode = existedNodes.get(id);
            
            // the child node can be reused
            if (existedNode) {
                existedNode.data = childData;
                existedNode.collapsible = hasChildren;

                // forget the old children
                if (this._childrenProvider.forgetChildren) {
                    this._childrenProvider.forgetChildren(existedNode.data);
                }

                newNodes.push(existedNode);

                /**
                 * Do not modify the collapse state of the existed node. Only
                 * keep refreshing downwards when it is not collapsed.
                 */
                if (hasChildren && !existedNode.collapsed) {
                    newNodesToRefresh.push(existedNode);
                }
            }
            
            // no existed nodes, we create a new one as normal.
            else {
                const newChildNode = this.__createNewChildNode(childData, parent, hasChildren, newNodesToRefresh);
                newNodes.push(newChildNode);
            }
        }
    }

    private __createNewChildNode(
        childData: T, 
        parent: IAsyncNode<T, TFilter>,
        hasChildren: boolean,
        toRefresh: IAsyncNode<T, TFilter>[],
    ): IAsyncNode<T, TFilter>
    {
        const newNode: IAsyncNode<T, TFilter> = {
            data: childData,
            parent: parent,
            children: [],
            collapsible: hasChildren,
            
            /**
             * The following metadata will be recalculated correctly in
             * {@link FlexIndexTreeModel}.
             */

            visibleNodeCount: undefined!,
            collapsed: undefined!,
            depth: undefined!,
            visible: undefined!,
            rendererMetadata: undefined!,
        };
        
        if (hasChildren) {
            /**
             * the children of the current node should not be collapsed, we 
             * need to keep refreshing on next time.
             */
            if (this._childrenProvider.collapseByDefault && 
                !this._childrenProvider.collapseByDefault(childData)
            ) {
                newNode.collapsed = false;
                toRefresh.push(newNode);
            }
        }

        return newNode;
    }

    /**
     * @description Determines if the given node is an ancestor of the other.
     * @param node The given node.
     * @param other The other node.
     */
    private __isAncestor(node: IAsyncNode<T, TFilter>, other: IAsyncNode<T, TFilter>): boolean {
        if (!other.parent) {
            return false;
        } 
        
        else if (other.parent === node) {
            return true;
        }

        return this.__isAncestor(node, other.parent);
    }

}