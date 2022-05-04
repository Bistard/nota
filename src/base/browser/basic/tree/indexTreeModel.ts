import { ISpliceable } from "src/base/common/range";
import { ITreeModel, ITreeNode, ITreeNodeElement } from "./tree";

export interface IIndexTreeNode<T, TFilter = void> extends ITreeNode<T, TFilter> {
    
    /** override for specifying nodes type. */
    parent: IIndexTreeNode<T, TFilter> | null;
    children: IIndexTreeNode<T, TFilter>[];
    
    /** counts how many nodes are actually visible / rendered (includes itself). */
    visibleNodeCount: number;

}

/**
 * Interface only for {@link IndexTreeModel}.
 */
export interface IIndexTreeModel<T, TFilter = void> extends ITreeModel<T, TFilter, number[]> {

    /**
     * To insert or delete items in the tree by given the location.
     * @param location The location representation of the node.
     * @param deleteCount number of deleted nodes after the given location.
     * @param itemsToInsert number of items to be inserted after the given location.
     */
    splice(location: number[], deleteCount: number, itemsToInsert: ITreeNodeElement<T>[]): void;

}

/**
 * An {@link IndexTreeModel} is a type of {@link ITreeModel}. 
 * The tree model represents a multiway tree-like structure. The prefix `index` 
 * has two meanings:
 *  1. means the tree node can be found by a series of indices.
 *  2. means each children has its internal order.
 */
export class IndexTreeModel<T, TFilter = void> implements IIndexTreeModel<T, TFilter> {

    // [fields]

    /** Root does not refer to any specific tree node. */
    private _root: IIndexTreeNode<T, TFilter>;

    /** The corresponding list-like view component. */
    private _view: ISpliceable<IIndexTreeNode<T, TFilter>>;

    // [constructor]

    constructor(
        view: ISpliceable<IIndexTreeNode<T, TFilter>>,
    ) {
        this._view = view;
        
        this._root = {
            data: null,
            parent: null,
            children: [],
            depth: 0,
            visible: false,
            collapsible: true,
            collapsed: false,
            visibleNodeCount: 0,
        };

    }

    /** 
     * [methods] 
     * - Detailed documents see {@link ITreeModel} or {@link IIndexTreeModel}
     */
    
    public splice(
        location: number[], 
        deleteCount: number, 
        itemsToInsert: ITreeNodeElement<T>[]
    ): void 
    {
        let { node, listIndex, visible } = this.__getNodeWithListIndex(location, this._root);
        let visibleNodeCountChange = 0;
        const treeNodeToInsert: IIndexTreeNode<T, TFilter>[] = [];
        
        itemsToInsert.forEach(element => {
            const newChild = this.__createNode(element, node);
            treeNodeToInsert.push(newChild);
            visibleNodeCountChange += newChild.visibleNodeCount;
        });

        const lastIndex = location[location.length - 1]!;
        const deletedChildren = node.children.splice(lastIndex, deleteCount, ...treeNodeToInsert);
        let deletedVisibleNodeCount = 0;

        deletedChildren.forEach(child => {
            if (child.visible) {
                deletedVisibleNodeCount += child.visibleNodeCount;
            }
        });
        
        if (visible) {
            this.__updateAncestorVisibleNodeCount(node, visibleNodeCountChange - deletedVisibleNodeCount);
            this._view.splice(listIndex, deletedVisibleNodeCount, treeNodeToInsert);
        }
        
    }

    public hasNode(location: number[]): boolean {
        return this.__hasNode(location, this._root);
    }

    public getNode(location: number[]): IIndexTreeNode<T, TFilter> | undefined {
        return this.__getNode(location, this._root);
    }

    public getNodeLocation(node: IIndexTreeNode<T, TFilter>): number[] {
        const location: number[] = [];
        
        while (node.parent) {
            location.push(node.parent.children.indexOf(node));
            node = node.parent;
        }

        return location.reverse();
    }

    public getNodeListIndex(location: number[]): number {
        return this.__getNodeWithListIndex(location, this._root).listIndex;
    }
    
    public isCollapsible(location: number[]): boolean {
        const node = this.__getNode(location, this._root);
        
        if (node === undefined) {
            return false;
        }

        return node.collapsible;
    }

    public isCollapsed(location: number[]): boolean {
        const node = this.__getNode(location, this._root);
        
        if (node === undefined) {
            return false;
        }

        return node.collapsible && node.collapsed;
    }

    // [private helper methods]

    /**
     * Check if the provided location is existed under the given node.
     * @param location The location representation of the node.
     * @param node The parent node to start with, default is the root.
     * @returns If the node exists.
     */
    private __hasNode(
        location: number[], 
        node: IIndexTreeNode<T, TFilter> = this._root,
    ): boolean 
    {
        for (let i = 0; i < location.length; i++) {
            let index = location[i]!;
            
            if (index < 0 || index >= node.children.length) {
                return false;
            }

            node = node.children[index]!;
        }

        return true;
    }

    /**
     * Try to get an existed node from the provided the location under the given 
     * parent node.
     * @param location The location representation of the node.
     * @param node The parent node to start with, default is the root.
     * @returns Returns undefined if not found, returns {@link IIndexTreeNode} vice 
     * versa.
     */
    private __getNode(
        location: number[], 
        node: IIndexTreeNode<T, TFilter> = this._root,
    ): IIndexTreeNode<T, TFilter> | undefined 
    {
        for (let i = 0; i < location.length; i++) {
            let index = location[i]!;
            
            if (index < 0 || index >= node.children.length) {
                return undefined;
            }

            node = node.children[index]!;
        }

        return node;
    }

    /**
     * Creates a new {@link IIndexTreeNode}.
     * @param element The provided {@link ITreeNodeElement<T>} for construction.
     * @param parent The parent of the new tree node.
     */
    private __createNode(
        element: ITreeNodeElement<T>, 
        parent: IIndexTreeNode<T, TFilter>,
    ): IIndexTreeNode<T, TFilter> 
    {
        const collapsible = typeof element.collapsible === 'boolean' ? element.collapsible : false;
        const collapsed = typeof element.collapsed === 'boolean' ? element.collapsed : false;

        // construct the new node
        const newNode: IIndexTreeNode<T, TFilter> = {
            data: element.data,
            parent: parent,
            depth: parent.depth + 1,
            visible: true,
            collapsible: collapsible,
            collapsed: collapsible ? collapsed : false,
            children: [],
            visibleNodeCount: 1
        };

        // construct the children nodes recursively
        let visibleNodeCount = 1;
        
        const childrenElements: ITreeNodeElement<T>[]  = element.children || [];
        childrenElements.forEach(element => {
            const child = this.__createNode(element, newNode);
            newNode.children.push(child);
            visibleNodeCount += child.visibleNodeCount;
        });

        // if the collapsible setting somehow sets to false, we may correct it here.
        newNode.collapsible = newNode.collapsible || newNode.children.length > 0;
        
        if (newNode.visible === false) {
            newNode.visibleNodeCount = 0;
        } else if (newNode.collapsed === false) {
            newNode.visibleNodeCount = visibleNodeCount;
        }

        return newNode;
    }

    /**
     * 
     * @param location The location representation of the node.
     * @param node The parent node to start with, default is the root.
     * @returns An object that contains three info.
     *  node: the corresponding node.
     *  listIndex: the index of the node in the tree when traversing in pre-order.
     * @warn If node is not found, an {@link Error} is thrown.
     */
    private __getNodeWithListIndex(
        location: number[], 
        node: IIndexTreeNode<T, TFilter> = this._root
    ): {node: IIndexTreeNode<T, TFilter>, listIndex: number, visible: boolean} 
    {

        let parent = node;
        let listIndex = 0;
        let visible = true;
        
        for (let i = 0; i < location.length; i++) {
            let index = location[i]!;
            
            if (index < 0 || index >= parent.children.length) {
                throw new Error('invalid location');
            }

            for (let j = 0; j < index; j++) {
                listIndex += parent.children[j]!.visibleNodeCount;
            }
            
            visible = visible && parent.visible;
            parent = parent.children[index]!;
        }

        return {
            node: parent,
            listIndex: listIndex,
            visible: visible
        };
    }

    /**
     * Updates `visibleNodeCount` of all the ancestors of the provided node.
     * @param node The provided tree node.
     * @param diff The difference to the new visibleNodeCount.
     */
    private __updateAncestorVisibleNodeCount(
        node: IIndexTreeNode<T, TFilter>, 
        diff: number
    ): void 
    {
        if (diff === 0) {
            return;
        }

        while (node.parent !== null) {
            node.visibleNodeCount += diff;
            node = node.parent;
        }
    }
}