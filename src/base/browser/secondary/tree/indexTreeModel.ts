import { ITreeModel, ITreeNode, ITreeNodeItem } from "src/base/browser/secondary/tree/tree";
import { Emitter, Register } from "src/base/common/event";
import { ISpliceable } from "src/base/common/range";

/**
 * Type of event when the {@link IIndexTreeModel} splice did happen.
 */
export interface ITreeModelSpliceEvent<T, TFilter> {
    
    /** Inserted nodes */
    inserted: IIndexTreeNode<T, TFilter>[];
	
    /** Deleted nodes */
    deleted: IIndexTreeNode<T, TFilter>[];
}

/**
 * Option type for ITreeModel.splice().
 */
export interface ITreeModelSpliceOptions<T, TFilter> {
    
    /**
     * Invokes when the tree node is created.
     */
    onDidCreateNode?: (node: ITreeNode<T, TFilter>) => void;

    /**
     * Invokes when the tree node is deleted.
     */
    onDidDeleteNode?: (node: ITreeNode<T, TFilter>) => void;
}

export interface IIndexTreeModelCreationOptions {
    
    /**
     * When inserting new node, if sets to collapsed to default.
     */
    collapsedByDefault?: boolean;

}

/**
 * An internal data structure for {@link IIndexTreeModel}. Represents each tree 
 * node.
 */
export interface IIndexTreeNode<T, TFilter = void> extends ITreeNode<T, TFilter> {
    
    /** override for specifying nodes type. */
    parent: IIndexTreeNode<T, TFilter> | null;
    children: IIndexTreeNode<T, TFilter>[];
    
    /** counts how many nodes are actually visible / rendered (includes itself). */
    visibleNodeCount: number;

}

/**
 * Interface only for {@link IndexTreeModel}.
 * 
 * TRef: number[]
 */
export interface IIndexTreeModel<T, TFilter = void> extends ITreeModel<T, TFilter, number[]> {

    /**
     * Events when tree splice did happen.
     */
    onDidSplice: Register<ITreeModelSpliceEvent<T, TFilter>>;

    /**
     * To insert or delete items in the tree by given the location.
     * @param location The location representation of the node.
     * @param deleteCount number of deleted nodes after the given location.
     * @param itemsToInsert number of items to be inserted after the given location.
     * @param opts The option for splicing.
     */
    splice(location: number[], deleteCount: number, itemsToInsert: ITreeNodeItem<T>[], opts: ITreeModelSpliceOptions<T, TFilter>): void;

    getNodeLocation(node: ITreeNode<T, TFilter>): number[];
    getNodeListIndex(location: number[]): number;
    setCollapsible(location: number[], collapsible?: boolean): boolean;
    setCollapsed(location: number[], collapsed?: boolean, recursive?: boolean): boolean;
    setExpandTo(location: number[]): void;
    getRoot(): IIndexTreeNode<T, TFilter>;
}

/**
 * An {@link IndexTreeModel} is a type of {@link ITreeModel}. This is not the 
 * same data structure as Index Binary Tree (IBT).
 * 
 * The tree model represents a multiway tree-like structure. The prefix `index` 
 * means the tree node can be found by a series of indices.
 */
export class IndexTreeModel<T, TFilter = void> implements IIndexTreeModel<T, TFilter> {

    // [fields]

    public readonly root: number[] = [];

    /** Root does not refer to any specific tree node. */
    private _root: IIndexTreeNode<T, TFilter>;

    /** The corresponding list-like view component. */
    private _view: ISpliceable<ITreeNode<T, TFilter>>;

    /** Defaults to false */
    private _collapsedByDefault: boolean;

    // [constructor]

    constructor(
        rootData: T,
        view: ISpliceable<ITreeNode<T, TFilter>>,
        opt: IIndexTreeModelCreationOptions = {}
    ) {
        this._view = view;
        
        this._root = {
            data: rootData,
            parent: null,
            children: [],
            depth: 0,
            visible: true,
            collapsible: true,
            collapsed: false,
            visibleNodeCount: 0,
        };

        this._collapsedByDefault = false;

        // option assignment
        if (opt) {

            if (opt.collapsedByDefault) {
                this._collapsedByDefault = opt.collapsedByDefault;
            }

        }
    }

    // [events]

    private readonly _onDidSplice = new Emitter<ITreeModelSpliceEvent<T, TFilter>>();
	readonly onDidSplice = this._onDidSplice.registerListener;

    // [methods]
    
    public splice(
        location: number[], 
        deleteCount: number, 
        itemsToInsert: ITreeNodeItem<T>[],
        opts: ITreeModelSpliceOptions<T, TFilter> = {}
    ): void {
        // finds out the parent node and its listIndex.
        let { parent, listIndex, visible } = this.__getParentNodeWithListIndex(location, this._root);
        
        // 1st array will store all the new nodes including nested ones.
        // 2nd array only store the new nodes under the parent node.
        const treeNodeListToInsert: IIndexTreeNode<T, TFilter>[] = [];
        const treeNodeChildrenToInsert: IIndexTreeNode<T, TFilter>[] = [];
        let visibleNodeCountChange = 0;
        itemsToInsert.forEach(element => {
            const newChild = this.__createNode(element, parent, treeNodeListToInsert, opts.onDidCreateNode);
            treeNodeChildrenToInsert.push(newChild);
            visibleNodeCountChange += newChild.visibleNodeCount;
        });

        // splice new nodes which directly under the parent node.
        const prevParentHasChildren = parent.children.length > 0;
        const lastIndex = location[location.length - 1]!;
        const deletedChildren = parent.children.splice(lastIndex, deleteCount, ...treeNodeChildrenToInsert);
        
        let deletedVisibleNodeCount = 0;
        deletedChildren.forEach(child => {
            if (child.visible) {
                deletedVisibleNodeCount += child.visibleNodeCount;
            }
        });
        
        // update view and ancestors data.
        if (visible) {
            this.__updateAncestorsVisibleNodeCount(parent, visibleNodeCountChange - deletedVisibleNodeCount);
            this._view.splice(listIndex, deletedVisibleNodeCount, treeNodeListToInsert);
        }
        
        // update the ancestors' collapsible state
        const currParentHasChildren = parent.children.length > 0;
        if (prevParentHasChildren !== currParentHasChildren) {
            this.setCollapsible(location.slice(0, -1), currParentHasChildren);
        }

        // deletion callback
        if (opts.onDidDeleteNode) {
            deletedChildren.forEach(node => opts.onDidDeleteNode!(node));
            deletedChildren.forEach(node => node.children.forEach(child => opts.onDidDeleteNode!(child)));
        }

        // fire events
        this._onDidSplice.fire({
            inserted: treeNodeListToInsert,
            deleted: deletedChildren
        });
    }

    public hasNode(location: number[]): boolean {
        return this.__hasNode(location, this._root);
    }

    public getNode(location: number[]): IIndexTreeNode<T, TFilter> {
        const node = this.__getNode(location, this._root);
        
        if (node === undefined) {
            throw new Error('cannot find the node given the location.');
        }

        return node;
    }

    public getRoot(): IIndexTreeNode<T, TFilter> {
        return this._root;
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
        const {listIndex, visible} = this.__getNodeWithListIndex(location, this._root);
        return visible ? listIndex : -1;
    }
    
    public isCollapsible(location: number[]): boolean {
        const node = this.__getNode(location, this._root);
        
        if (node === undefined) {
            return false;
        }

        return node.collapsible;
    }

    public setCollapsible(location: number[], collapsible?: boolean): boolean {
        const node = this.getNode(location);

        // if not provided, we toggle the current state.
        if (typeof collapsible === 'undefined') {
            collapsible = !node.collapsible;
        }

        return this.__setCollapsible(location, collapsible);
    }

    public isCollapsed(location: number[]): boolean {
        const node = this.__getNode(location, this._root);
        
        if (node === undefined) {
            return false;
        }

        return node.collapsible && node.collapsed;
    }

    public setCollapsed(location: number[], collapsed?: boolean, recursive?: boolean): boolean  {
        const node = this.getNode(location);

        // if not provided, we toggle the current state.
        if (typeof collapsed === 'undefined') {
            collapsed = !node.collapsed;
        }

        return this.__setCollapsed(location, collapsed, recursive ? recursive : false);
    }

    public setExpandTo(location: number[]): void {
        // This methods expand the tree node from bottom to top.
        let node = this.getNode(location);
        while (node.parent) {
            node = node.parent;
            location = location.slice(0, location.length - 1);

            if (node.collapsed) {
                this.setCollapsed(location, false, false);
            }
        }
    }

    public rerender(location: number[]): void {
        
        /**
         * To achieve rerendering, we simply delete dn reinsert the same item 
         * into the same position.
         */

        if (location.length === 0) {
            throw new Error('invalid tree location');
        }
        
        const { node, listIndex, visible } = this.__getNodeWithListIndex(location, this._root);
        if (visible) {
            this._view.splice(listIndex, 1, [node]);
        }
    }

    // [private helper methods]

    /**
     * @description Check if the provided location is existed under the given node.
     * @param location The location representation of the node.
     * @param node The node to start with, default is the root.
     * @returns If the node exists.
     * 
     * @complexity O(h) - h: length of location
     */
    private __hasNode(location: number[], node: IIndexTreeNode<T, TFilter> = this._root): boolean 
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
     * @description Try to get an existed node from the provided the location 
     * under the given parent node.
     * @param location The location representation of the node.
     * @param node The node to start with, default is the root.
     * @returns Returns undefined if not found, returns {@link IIndexTreeNode} vice 
     * versa.
     * 
     * @complexity O(h) - h: length of location
     */
    private __getNode(location: number[], node: IIndexTreeNode<T, TFilter> = this._root): IIndexTreeNode<T, TFilter> | undefined 
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
     * @description Creates a new {@link IIndexTreeNode}.
     * @param element The provided {@link ITreeNodeItem<T>} for construction.
     * @param parent The parent of the new tree node.
     * @param toBeRendered To stores all the new created tree nodes which should
     * be rendered.
     * @param onDidCreateNode Callback after creating new tree node.
     */
    private __createNode(
        element: ITreeNodeItem<T>, 
        parent: IIndexTreeNode<T, TFilter>,
        toBeRendered: IIndexTreeNode<T, TFilter>[],
        onDidCreateNode?: (node: ITreeNode<T, TFilter>) => void
    ): IIndexTreeNode<T, TFilter> 
    {
        const collapsed = typeof element.collapsed === 'boolean' ? element.collapsed : this._collapsedByDefault;
        const collapsible = typeof element.collapsible === 'boolean' ? element.collapsible : collapsed;
        const visible = parent.visible ? !parent.collapsed : false;

        // construct the new node
        const newNode: IIndexTreeNode<T, TFilter> = {
            data: element.data,
            parent: parent,
            depth: parent.depth + 1,
            visible: visible,
            collapsible: collapsible,
            collapsed: collapsible ? collapsed : false,
            children: [],
            visibleNodeCount: 1
        };
        
        if (visible) {
            toBeRendered.push(newNode);
        }

        // construct the children nodes recursively
        let visibleNodeCount = 1;
        
        const childrenElements: ITreeNodeItem<T>[]  = element.children || [];
        childrenElements.forEach(element => {
            const child = this.__createNode(element, newNode, toBeRendered, onDidCreateNode);
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

        // callback
        if (onDidCreateNode) {
            onDidCreateNode(newNode);
        }

        return newNode;
    }

    /**
     * @description Rerturns the list index of the parent of the given location.
     * @param location The location representation of the node.
     * @param node The node to start with, default is the root.
     * 
     * @returns An object that contains three info:
     *  node: the corresponding node.
     *  listIndex: the index of the node in the tree when traversing in pre-order.
     *  visible: if the node is visible.
     * @warn If node is not found, an {@link Error} is thrown.
     * 
     * @complexity O(h) - h: length of location
     */
    private __getParentNodeWithListIndex(
        location: number[], 
        node: IIndexTreeNode<T, TFilter> = this._root
    ): {parent: IIndexTreeNode<T, TFilter>, listIndex: number, visible: boolean} 
    {
        let listIndex = 0;
        let visible = true;
        
        for (let i = 0; i < location.length; i++) {
            let index = location[i]!;
            
            if (index < 0 || index > node.children.length) {
                throw new Error('invalid location');
            }

            for (let j = 0; j < index; j++) {
                listIndex += node.children[j]!.visibleNodeCount;
            }
            
            visible = visible && node.visible;

            if (i === location.length - 1) {
                return {
                    parent: node,
                    listIndex: listIndex,
                    visible: visible
                };
            }

            node = node.children[index]!;
            listIndex++;
        }

        return {
            parent: node,
            listIndex: listIndex,
            visible: visible
        };
    }

    /**
     * @description Rerturns the list index of the given location.
     * @param location The location representation of the node.
     * @param node The node to start with, default is the root.
     * 
     * @returns An object that contains three info:
     *  node: the corresponding node.
     *  listIndex: the index of the node in the tree when traversing in pre-order.
     *  visible: if the node is visible.
     * @warn If node is not found, an {@link Error} is thrown.
     * 
     * @complexity O(h) - h: length of location
     */
    private __getNodeWithListIndex(
        location: number[], 
        node: IIndexTreeNode<T, TFilter> = this._root
    ): {node: IIndexTreeNode<T, TFilter>, listIndex: number, visible: boolean} 
    {
        if (location.length === 0) {
            return {
                node: this._root, 
                listIndex: -1,
                visible: false
            };
        }

        const {parent, listIndex, visible} = this.__getParentNodeWithListIndex(location, this._root);
        const lastIndex = location[location.length - 1]!;

        if (lastIndex < 0 || lastIndex > node.children.length) {
            throw new Error('invalid location');
        }

        const requiredNode = parent.children[lastIndex]!;
        return {
            node: requiredNode,
            listIndex: listIndex,
            visible: visible && requiredNode.visible
        };
    }

    /**
     * @description Updates `visibleNodeCount` of all the ancestors of the 
     * provided node.
     * @param node The provided parent tree node.
     * @param diff The difference to the new visibleNodeCount.
     * 
     * @note time complexity: O(h) - h: height of the node
     */
    private __updateAncestorsVisibleNodeCount(node: IIndexTreeNode<T, TFilter> | null, diff: number): void {
        if (diff === 0) {
            return;
        }

        while (node !== null) {
            node.visibleNodeCount += diff;
            node = node.parent;
        }
    }

    /**
     * @description Sets the provided collapsed state to the given location.
     * @param location The location representation of the node.
     * @param collapsed The new collapsed state.
     * @param recursive Determines if the operation is recursive.
     * 
     * @returns if the collapsed state changed.
     */
    private __setCollapsed(location: number[], collapsed: boolean, recursive: boolean): boolean {
        const { node, listIndex } = this.__getNodeWithListIndex(location, this._root);

        // we try to update the tree node state first
        const changed = this.__setTreeNodeCollapsed(node, collapsed, recursive);

        // if the state changed, we need to update other nodes.
        if (changed && node.visible) {

            const prevVisibleNodeCount = node.visibleNodeCount;

            // update visibleRenderCount of its children and ancestors.
            const visibleNodes = this.__updateTreeNodeAfterCollapsed(node);

            // also updates the list node state.
            this.__updateListNodeCollapsed(listIndex, prevVisibleNodeCount, visibleNodes);

            return true;
        }

        return false;
    }

    /**
     * @description Sets the given tree node to the provided collapsed state.
     * @param node The provided tree node.
     * @param collapsed The provided collapsed state.
     * @param recursive If the operation is recursive.
     * 
     * @returns if the collapsed state changed.
     */
    private __setTreeNodeCollapsed(node: IIndexTreeNode<T, TFilter>, collapsed: boolean, recursive: boolean): boolean {

        let changed = false;

        // if node is not even collapsible, we skip it.
        if (node.collapsible === false) {
            return false;
        }

        // the actual collapsed state update
        changed = (node.collapsed !== collapsed);
        node.collapsed = collapsed;

        // update children
        if (recursive) {
            for (const child of node.children) {
                changed = this.__setTreeNodeCollapsed(child, collapsed, recursive) || changed;
            }
        }

        return changed;
    }

    /**
     * @description Updates the visibleRenderCount of children and ancestors 
     * when the collapsed state of the given tree node has changed.
     * @param node The given tree node.
     * 
     * @note only be called when `__setTreeNodeCollapsed` returns true.
     */
    private __updateTreeNodeAfterCollapsed(node: IIndexTreeNode<T, TFilter>): IIndexTreeNode<T, TFilter>[] {
        const previousRenderNodeCount = node.visibleNodeCount;
		
        const visibleNodes: IIndexTreeNode<T, TFilter>[] = [];
		this.__updateChildrenVNCAfterCollapsed(node, visibleNodes);
        this.__updateAncestorsVisibleNodeCount(node.parent, visibleNodes.length - previousRenderNodeCount); // __updateAncestorVNCAfterCollapsed()

		return visibleNodes;
    }

    /**
     * @description Updates the list node after the node with the given listIndex 
     * is collapsed.
     * @param listIndex The list index of the provided tree node.
     * @param prevVisibleNodeCount The previous VNC of the tree node.
     * @param visibleNodes The array which stores all the visible nodes.
     * 
     * @note only be called when `__setTreeNodeCollapsed` returns true.
     */
    private __updateListNodeCollapsed(listIndex: number, prevVisibleNodeCount: number, visibleNodes: IIndexTreeNode<T, TFilter>[]): void {
        const deleteCount = prevVisibleNodeCount - (listIndex === -1 ? 0 : 1);
        this._view.splice(listIndex + 1, deleteCount, visibleNodes.slice(1));
    }

    /**
     * @description Updates the visibleNodeCount of all the nested children 
     * (include the provided node) after the provided tree node has changed its 
     * collapsed state.
     * @param node The provided tree node.
     * @param visibleNodes Will stores all the visible tree node into this array
     *                     for later rendering.
     */
    private __updateChildrenVNCAfterCollapsed(node: IIndexTreeNode<T, TFilter>, visibleNodes: IIndexTreeNode<T, TFilter>[]): void {

        const visited = new Set();
        const stack = [node];

        while (stack.length > 0) {
            const node = stack[stack.length - 1]!;
            
            if (node.parent) {
                if (!node.parent.visible || (node.parent.collapsible && node.parent.collapsed)) {
                    node.visible = false;
                    node.visibleNodeCount = 0;
                }
                if (node.parent.visible && (node.parent.collapsible && !node.parent.collapsed)) {
                    node.visible = true;
                }
            }

            if (node.visible === false) {
                stack.pop();
                continue;
            }

            if (visited.has(node)) {
                visibleNodes.push(node);
                if (node.collapsed === false) {
                    node.visibleNodeCount += node.children.reduce((vnc, node) => vnc + node.visibleNodeCount, 0);
                }
                stack.pop();
            } else {
                visited.add(node);
                node.visibleNodeCount = 1;

                for (const child of node.children) {
                    stack.push(child);
                }
            }
        }

        visibleNodes.reverse();
    }

    /**
     * @description Sets the provided collapsible state to the given location.
     * @param location The location representation of the node.
     * @param collapsible The new collapsible state.
     * 
     * @complexity O(h) - h: length of location
     */
    private __setCollapsible(location: number[], collapsible: boolean): boolean {

        let node: IIndexTreeNode<T, TFilter> | undefined = this._root;
        let changed = false;

        for (let i = 0; i < location.length; i++) {
            const index = location[i]!;
            node = node.children[index];
            if (node === undefined) {
                throw new Error('invalid location');
            }

            changed = changed || (node.collapsible !== collapsible);
            if (i === location.length - 1) {
                node.collapsible = collapsible;
            }
        }

        return changed;
    }

}