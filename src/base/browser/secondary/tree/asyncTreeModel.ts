import { IAsyncNode } from "src/base/browser/secondary/tree/asyncTree";
import { IMultiTreeModelOptions, MultiTreeModel } from "src/base/browser/secondary/tree/multiTreeModel";
import { ITreeNode } from "src/base/browser/secondary/tree/tree";
import { ISpliceable } from "src/base/common/range";
import { Blocker } from "src/base/common/util/async";
import { Iterable } from "src/base/common/util/iterable";

/**
 * Provides functionality to determine the children stat of the given data.
 */
export interface IChildrenProvider<T> {

    /**
     * @description Check if the given data has children.
     */
    hasChildren(data: T): boolean;

    /**
     * @description Get the children from the given data.
     */
    getChildren(data: T): T[] | Promise<T[]>;

    /**
     * @description Determines if the given data requires to refresh children
     * when the corresponding tree node of the data is about to expand.
     * @note If not provided, the tree node will always get refreshed when 
     * expanding.
     */
    shouldRefreshChildren?(data: T): boolean;

    /**
     * @description Determines if the given data should be collapsed when 
     * constructing.
     * @note This has higher priority than `{@link IAsyncMultiTreeOptions.collapsedByDefault}`
     * which will only be applied when the function is not provided.
     */
    collapseByDefault?: (data: T) => boolean;
}

/**
 * An interface only for {@link AsyncTreeModel}.
 */
export interface IAsyncTreeModel<T, TFilter> extends MultiTreeModel<T, TFilter> {
    
    /**
     * @description Refreshing the tree structure of the given node and all its 
     * descendants.
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
}

/**
 * @class A {@link AsyncTreeModel} extends {@link MultiTreeModel} and also wraps 
 * a {@link IAsyncNode} over each client data.
 * 
 * @implements
 * The node for refreshing should be returned by {@link MultiTreeModel.getNode}
 * so that we are always modifying the original tree structure instead of 
 * creating a new one.
 */
export class AsyncTreeModel<T, TFilter> extends MultiTreeModel<T, TFilter> implements IAsyncTreeModel<T, TFilter> {
    
    // [field]

    private readonly _childrenProvider: IChildrenProvider<T>;

    /**
     * Storing the ongoing {@link Promise} when fetching the children stat of 
     * the corresponding async tree node.
     */
    private readonly _statFetching = new Map<IAsyncNode<T, TFilter>, Promise<Iterable<T>>>();
    
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
    }

    // [public methods]

    public async refreshNode(node: IAsyncNode<T, TFilter>): Promise<void> {
        
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
            const children = await this.__refreshDirectChildren(asyncNode);

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
     * @param asyncNode The given async tree node.
     */
    private async __refreshDirectChildren(asyncNode: IAsyncNode<T, TFilter>): Promise<IAsyncNode<T, TFilter>[]> {

        let childrenPromise: Promise<Iterable<T>>;
        asyncNode.collapsible = this._childrenProvider.hasChildren(asyncNode.data);

        if (asyncNode.collapsible === false) {
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
            childrenPromise = Promise.resolve(this.__getChildren(asyncNode));
        }

        try {
            const children = await childrenPromise;
            return this.__setChildren(asyncNode, children);
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
    private async __getChildren(node: IAsyncNode<T, TFilter>): Promise<Iterable<T>> {
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
     * @description Updates the given children to the provided async tree node.
     * @param node The provided tree node.
     * @param childrenIterable The direct children of the given node.
     * @returns After the children were inserted, returns a iterable of the new 
     * children tree nodes.
     */
    private __setChildren(node: IAsyncNode<T, TFilter>, childrenIterable: Iterable<T>): IAsyncNode<T, TFilter>[] {
        
        const childrenData = [...childrenIterable];

        // corner case check, performance improvement
        if (!childrenData.length && !node.children.length) {
            return [];
        }

        /**
         * Create tree node for each child. Moreover check if any of the 
         * children is not collapsed, these children will be returned and for 
         * future refresh.
         */
        const childrenItemsForRefresh: IAsyncNode<T, TFilter>[] = [];
        const childrenItems: IAsyncNode<T, TFilter>[] = [];

        for (const childData of childrenData) {
            const hasChildren = this._childrenProvider.hasChildren(childData);
            
            const newChildItem: IAsyncNode<T, TFilter> = {
                data: childData,
                parent: node,
                children: [],
                collapsible: hasChildren,
                visibleNodeCount: 1,
                
                collapsed: undefined!,
                depth: undefined!,
                visible: undefined!,
                refreshing: undefined!,
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
                    newChildItem.collapsed = false;
                    childrenItemsForRefresh.push(newChildItem);
                } else {
                    newChildItem.collapsed = true;
                }
            }

            childrenItems.push(newChildItem);
        }
        
        // insert the children nodes into the current node
        node.children = childrenItems;

        return childrenItemsForRefresh;
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