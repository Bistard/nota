import { ITreeModel, ITreeSpliceEvent, ITreeNode, ITreeNodeItem, ITreeCollapseStateChangeEvent, IFlexNode } from "src/base/browser/secondary/tree/tree";
import { ITreeFilterProvider } from "src/base/browser/secondary/tree/treeFilter";
import { Disposable } from "src/base/common/dispose";
import { DelayableEmitter, Emitter } from "src/base/common/event";
import { ISpliceable } from "src/base/common/structures/range";
import { Arrays } from "src/base/common/utilities/array";
import { panic } from "src/base/common/utilities/panic";

const INVALID_INDEX = -1;

/**
 * Option type for {@link IIndexTreeModel["splice"]}.
 */
export interface ITreeModelSpliceOptions<T, TFilter> {
    
    /**
     * Invokes when the tree node is created.
     */
    onDidCreateNode?: (node: ITreeNode<T, TFilter>) => void;

    /**
     * Invokes when the tree data is deleted.
     */
    onDidDeleteData?: (node: T) => void;
}

/**
 * An constructor option for {@link IndexTreeModel}.
 */
export interface IIndexTreeModelOptions<T, TFilter> {
    
    /** 
     * If the tree node should be collapsed when constructing a new one by 
     * default. Which means if {@link ITreeNodeItem["collapsed"]} is not defined,
     * this will be applied.
     * @default false
     */
    readonly collapsedByDefault?: boolean;

    /**
     * The filter provider that can determine whether the provided item is 
     * filtered.
     */
    readonly filter?: ITreeFilterProvider<T, TFilter>;
}

/**
 * An interface only for {@link IndexTreeModelBase}.
 */
export interface IIndexTreeModelBase<T, TFilter> extends ITreeModel<T, TFilter, number[]> {
    
    /**
     * @description Returns the total number of nodes in the tree model.
     * @complexity O(n)
     */
    size(): number;
}

/**
 * An interface only for {@link IndexTreeModel}.
 */
export interface IIndexTreeModel<T, TFilter> extends IIndexTreeModelBase<T, TFilter> {
    /**
     * To insert or delete items in the tree by the given location.
     * @param location The location representation of the node.
     * @param deleteCount number of deleted nodes after the given location.
     * @param itemsToInsert number of items to be inserted after the given location.
     * @param opts The option for splicing.
     */
    splice(location: number[], deleteCount: number, itemsToInsert: ITreeNodeItem<T>[], opts?: ITreeModelSpliceOptions<T, TFilter>): void;
}

/**
 * An interface only for {@link FlexIndexTreeModel}. 
 * @note An optimization of {@link IIndexTreeModel}.
 */
export interface IFlexIndexTreeModel<T, TFilter> extends IIndexTreeModelBase<T, TFilter> {
    
    /**
     * @description Refresh the subtree of the given tree node.
     * The tree model will rebuild and recalculate all the metadata of the 
     * subtree of the given tree node automatically if the client modify the 
     * tree node correctly.
     * @param node The given node. Defaults to root.
     * @param opts The option for splicing.
     */
    refresh(node?: IFlexNode<T, TFilter>, opts?: ITreeModelSpliceOptions<T, TFilter>): void;

    /**
     * @description Fires the `onDidSplice` event without actual refreshing. 
     * Having this method is useful for some possible optimizations. This can 
     * avoid the actual refreshing step but still pretend to be refreshed.
     * @param event The event to be fired.
     */
    triggerOnDidSplice(event: ITreeSpliceEvent<T, TFilter>): void;
}

/**
 * @class The base class of {@link IndexTreeModel} and {@link FlexIndexTreeModel}.
 * Integrated all the functionalities except modifying the tree structure (
 * `splice` or `refresh` methods).
 */
abstract class IndexTreeModelBase<T, TFilter> extends Disposable implements IIndexTreeModelBase<T, TFilter> {
    
    // [fields]

    public readonly root: number[] = [];

    /** Root does not refer to any specific tree node. */
    protected readonly _root: ITreeNode<T, TFilter>;

    /** The corresponding list-like view component. */
    protected readonly _view: ISpliceable<ITreeNode<T, TFilter>>;

    protected readonly _collapsedByDefault: boolean;
    protected readonly _filter?: ITreeFilterProvider<T, TFilter>;

    // [constructor]

    constructor(
        rootData: T,
        view: ISpliceable<ITreeNode<T, TFilter>>,
        opt: IIndexTreeModelOptions<T, TFilter> = {}
    ) {
        super();
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

        this._collapsedByDefault = opt?.collapsedByDefault ?? false;
        this._filter = opt.filter;
    }

    // [events]

    protected readonly _onDidSplice = this.__register(new Emitter<ITreeSpliceEvent<T, TFilter>>());
	public readonly onDidSplice = this._onDidSplice.registerListener;

    /**
     * During the process of updating collapse state, we wish to fire the event
     * once all the recursive nodes are updated.
     */
    protected readonly _onDidChangeCollapseState = this.__register(new DelayableEmitter<ITreeCollapseStateChangeEvent<T, TFilter>>());
    public readonly onDidChangeCollapseState = this._onDidChangeCollapseState.registerListener;

    // [getters]

    get rootNode() { return this._root; }

    // [methods]

    public size(): number {
        let count = 0;

        const dfs = (node: ITreeNode<T, TFilter>) => {
            count++;

            if (!node.children) {
                return;
            }

            for (const child of node.children) {
                dfs(child);
            }
        };
        dfs(this._root);

        return count;
    }

    public hasNode(location: readonly number[]): boolean {
        return this.__hasNode(location, this._root);
    }

    public getNode(location: readonly number[]): ITreeNode<T, TFilter> {
        const node = this.__getNode(location, this._root);
        
        if (!node) {
            panic('cannot find the node given the location.');
        }

        return node;
    }

    public getNodeLocation(node: ITreeNode<T, TFilter>): number[] {
        const location: number[] = [];
        
        for (let i = node.depth - 1; i >= 0; i--) {
            location[i] = node.parent!.children.indexOf(node);
            node = node.parent!;
        }

        return location;
    }

    public getNodeListIndex(location: number[]): number {
        const { listIndex, visible } = this.__getNodeWithListIndex(location);
        return visible ? listIndex : INVALID_INDEX;
    }
    
    public isCollapsible(location: number[]): boolean {
        const node = this.__getNode(location, this._root);
        
        if (!node) {
            panic(`tree node not found at: ${location}`);
        }

        return node.collapsible;
    }

    public setCollapsible(location: readonly number[], collapsible?: boolean): boolean {
        const node = this.getNode(location);

        // if not provided, we toggle the current state.
        if (typeof collapsible === 'undefined') {
            collapsible = !node.collapsible;
        }

        return this.__setCollapsible(location, collapsible);
    }

    public isCollapsed(location: number[]): boolean {
        const node = this.__getNode(location, this._root);
        
        if (!node) {
            panic(`tree node not found at: ${location}`);
        }

        if (!node.collapsible) {
            panic(`tree node is not collapsible at: ${location}`);
        }

        return node.collapsed;
    }

    public setCollapsed(location: number[], collapsed?: boolean, recursive?: boolean): boolean  {
        const node = this.getNode(location);

        // if not provided, we toggle the current state.
        if (typeof collapsed === 'undefined') {
            collapsed = !node.collapsed;
        }

        this._onDidChangeCollapseState.pause();
        const changed = this.__setCollapsed(location, collapsed, recursive ? recursive : false);
        this._onDidChangeCollapseState.resume();
        
        return changed;
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
         * To achieve rerendering, we simply delete and re-insert the same items
         * into the same position. The {@link ListWidget} will do the rest
         * of the jobs for us.
         */

        if (location.length === 0) {
            panic('invalid tree location');
        }
        
        const { node, listIndex, visible } = this.__getNodeWithListIndex(location);
        if (visible) {
            this._view.splice(listIndex, 1, [node]);
        }
    }

    public filter(visibleOnly: boolean = true): void {
        // no filters provided, noop.
        if (!this._filter) {
            return;
        }
        
        const prevVisibleCount = this._root.visibleNodeCount;
        const filtered: ITreeNode<T, TFilter>[] = [];
        const expandLocations: number[][] = [];

        this.__filter(this._root, filtered, visibleOnly, this._root.collapsed, [], expandLocations);

        for (const loc of expandLocations) {
            this.setExpandTo(loc);
        }

        this._view.splice(0, prevVisibleCount + expandLocations.length, filtered);
    }

    // [private helper methods]

    /**
     * @description Iterates all the nodes of the given node and filter each 
     * node by the provided filterProvider and push the filtered ones into the 
     * filtered array.
     * @param node The node to be filtered first.
     * @param filtered An array to store all the filtered nodes.
     * @param visibleOnly Whether only filters the visible nodes.
     * @param isParentCollapsed Determines if any parent nodes is collapsed.
     * @param location Current location of the node.
     * @param expandLocations An array to store all the nodes that require to
     *                        expanded. Only useful when `visibleOnly` if on.
     * @returns A boolean if the current node will be expand.
     */
    private __filter(
        node: ITreeNode<T, TFilter>, 
        filtered: ITreeNode<T, TFilter>[], 
        visibleOnly: boolean, 
        isParentCollapsed: boolean, 
        location: number[],
        expandLocations: number[][]): boolean {
        
        // filters the node except it is root
        if (node.depth > 0) {
            this.__filterNode(node);
            
            // we stop since the filter tells us it should be invisible
            if (!node.visible) {
                node.visibleNodeCount = 1;
                return false;
            }

            // if the node is visible and filtered
            if (node.rendererMetadata !== undefined) {
                filtered.push(node);
            }
        }

        const prevFilteredCount = ((node.depth > 0) ? 1 : 0) + filtered.length;
        let anyChildNeedExpand = false;
        
        // filter each child
        if (!(visibleOnly && node.collapsed)) {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i]!;

                if (visibleOnly && !child.visible) {
                    continue;
                }
                
                location.push(i);
                anyChildNeedExpand = (this.__filter(
                        child, 
                        filtered, 
                        visibleOnly, 
                        isParentCollapsed || node.collapsed, 
                        location, 
                        expandLocations
                    ) || anyChildNeedExpand
                );
                location.pop();
            }
        }
        
        if (!visibleOnly) {
            /**
             * Only expand to node if and only if the current node is 
             * filtered and the parent is collapsed and no children 
             * requires expand.
             */
            if (node.rendererMetadata !== undefined && isParentCollapsed && !anyChildNeedExpand) {
                expandLocations.push([...location]);
                anyChildNeedExpand = true;
            }
        }

        node.visibleNodeCount = filtered.length - prevFilteredCount;
        return anyChildNeedExpand;
    }
    
    /**
     * @description Try to filters the given node and updates its `visibility` 
     * and `rendererMetadata`.
     * @param node The given node.
     * @throws An exception will be thrown if the filter is not provided.
     */
    private __filterNode(node: ITreeNode<T, TFilter>): void {
        
        const filterResult = this._filter!.filter(node.data);
        node.rendererMetadata = filterResult.filterMetadata;
        node.visible = filterResult.visibility;
    }

    /**
     * @description Check if the provided location is existed under the given node.
     * @param location The location representation of the node.
     * @param node The node to start with, default is the root.
     * @returns If the node exists.
     * 
     * @complexity O(h) - h: length of location
     */
    private __hasNode(location: readonly number[], node: ITreeNode<T, TFilter> = this._root): boolean 
    {
        for (let i = 0; i < location.length; i++) {
            const index = location[i]!;
            
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
     * @returns Returns undefined if not found, returns {@link ITreeNode} vice 
     * versa.
     * 
     * @complexity O(h) - h: length of location
     */
    private __getNode(location: readonly number[], node: ITreeNode<T, TFilter> = this._root): ITreeNode<T, TFilter> | undefined 
    {
        for (let i = 0; i < location.length; i++) {
            const index = location[i]!;
            
            if (index < 0 || index >= node.children.length) {
                return undefined;
            }

            node = node.children[index]!;
        }

        return node;
    }

    /**
     * @description Returns the list index of the parent of the given location.
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
    protected __getParentNodeWithListIndex(
        location: readonly number[], 
        node: ITreeNode<T, TFilter> = this._root,
    ): { parent: ITreeNode<T, TFilter>, listIndex: number, visible: boolean } 
    {
        let listIndex = 0;
        let visible = true;
        
        for (let i = 0; i < location.length; i++) {
            const index = location[i]!;
            
            if (index < 0 || index > node.children.length) {
                panic('invalid location');
            }

            for (let j = 0; j < index; j++) {
                listIndex += node.children[j]!.visibleNodeCount;
            }
            
            visible &&= node.visible;

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
     * @description Returns the list index of the given location.
     * @param location The location representation of the node.
     * 
     * @returns An object that contains three info:
     *  node: the corresponding node.
     *  listIndex: the index of the node in the tree when traversing in pre-order.
     *  visible: if the node is visible.
     * @warn If node is not found, an {@link Error} is thrown.
     * 
     * @complexity O(h) - h: length of location
     */
    protected __getNodeWithListIndex(location: readonly number[]): { node: ITreeNode<T, TFilter>, listIndex: number, visible: boolean } 
    {
        if (!location.length) {
            return {
                node: this._root, 
                listIndex: 0,
                visible: true
            };
        }

        const {parent, listIndex, visible} = this.__getParentNodeWithListIndex(location, this._root);
        const lastIndex = location[location.length - 1]!;
        
        if (lastIndex < 0 || lastIndex > parent.children.length) {
            panic('invalid location');
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
    protected __updateAncestorsVisibleNodeCount(node: ITreeNode<T, TFilter> | null, diff: number): void {
        if (diff === 0) {
            return;
        }

        while (node) {
            node.visibleNodeCount += diff;
            node = node.parent;
        }
    }

    /**
     * @description Sets the provided collapsed state to the given location.
     * @param location The location representation of the node.
     * @param collapsed The new collapsed state.
     * @param recursive Determines if the operation is recursive.
     * @returns if the collapsed state changed.
     */
    private __setCollapsed(location: readonly number[], collapsed: boolean, recursive: boolean): boolean {
        const { node, listIndex } = this.__getNodeWithListIndex(location);

        // we try to update the tree node state first
        const changed = this.__setTreeNodeCollapsed(node, collapsed, recursive);

        // if the state changed, we need to update other nodes.
        if (changed && node.visible) {
            const prevVisibleNodeCount = node.visibleNodeCount;

            // update visibleRenderCount of its children and ancestors
            const visibleNodes = this.__updateTreeNodeAfterCollapsed(node);
            visibleNodes.splice(0, 1);

            /**
             * Rerenders the view (only if `deleteCount` > 0 and `visibleNodes` 
             * are not empty).
             */
            const deleteCount = prevVisibleNodeCount - (listIndex === INVALID_INDEX ? 0 : 1);
            this._view.splice(listIndex + 1, deleteCount, visibleNodes);

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
    private __setTreeNodeCollapsed(node: ITreeNode<T, TFilter>, collapsed: boolean, recursive: boolean): boolean {

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

        // fires the event
        if (changed) {
            this._onDidChangeCollapseState.fire({ node });
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
    private __updateTreeNodeAfterCollapsed(node: ITreeNode<T, TFilter>): ITreeNode<T, TFilter>[] {
        const previousRenderNodeCount = node.visibleNodeCount;
		
        const visibleNodes: ITreeNode<T, TFilter>[] = [];
		this.__updateChildrenVNCAfterCollapsed(node, visibleNodes);
        this.__updateAncestorsVisibleNodeCount(node.parent, visibleNodes.length - previousRenderNodeCount); // __updateAncestorVNCAfterCollapsed()

		return visibleNodes;
    }

    /**
     * @description Updates the visibleNodeCount of all the nested children 
     * (include the provided node) after the provided tree node has changed its 
     * collapsed state.
     * @param node The provided tree node.
     * @param visibleNodes Will stores all the visible tree node into this array
     *                     for later rendering.
     */
    private __updateChildrenVNCAfterCollapsed(node: ITreeNode<T, TFilter>, visibleNodes: ITreeNode<T, TFilter>[]): void {

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
    private __setCollapsible(location: readonly number[], collapsible: boolean): boolean {

        let node: ITreeNode<T, TFilter> | undefined = this._root;
        let changed = false;

        for (let i = 0; i < location.length; i++) {
            const index = location[i]!;
            node = node.children[index];
            if (!node) {
                panic('invalid location');
            }

            changed = changed || (node.collapsible !== collapsible);
            if (i === location.length - 1) {
                node.collapsible = collapsible;
            }
        }

        return changed;
    }
}

/**
 * An {@link IndexTreeModel} is a type of {@link ITreeModel}. This is not the 
 * same data structure as Index Binary Tree (IBT).
 * 
 * The tree model represents a multi-way tree-like structure. The prefix `index` 
 * means the tree node can be found by a series of indices.
 * 
 * Client may provide a new tree-like structure using {@link ITreeNodeItem} that
 * updates the existed tree structure using method {@link IIndexTreeModel.splice}.
 */
export class IndexTreeModel<T, TFilter> extends IndexTreeModelBase<T, TFilter> implements IIndexTreeModel<T, TFilter> {

    // [methods]
    
    public splice(
        location: number[], 
        deleteCount: number, 
        itemsToInsert: ITreeNodeItem<T>[],
        opts: ITreeModelSpliceOptions<T, TFilter> = {}
    ): void {
        // finds out the parent node and its listIndex.
        const { parent, listIndex, visible } = this.__getParentNodeWithListIndex(location, this._root);
        
        // 1st array will store all the new nodes including nested ones.
        // 2nd array only store the new nodes under the parent node.
        const treeNodeListToBeRendered: ITreeNode<T, TFilter>[] = [];
        const treeNodeChildrenToInsert: ITreeNode<T, TFilter>[] = [];
        let newVisibleCount = 0;
        
        for (const element of itemsToInsert) {
            const newChild = this.__createNode(element, parent, treeNodeListToBeRendered, opts.onDidCreateNode);
            treeNodeChildrenToInsert.push(newChild);
            newVisibleCount += newChild.visibleNodeCount;
        }

        // splice new nodes which directly under the parent node.
        const prevParentHasChildren = parent.children.length > 0;
        const lastIndex = location[location.length - 1]!;
        const deletedChildren = parent.children.splice(lastIndex, deleteCount, ...treeNodeChildrenToInsert);
        
        // update view
        if (visible) {

            // calculate the old visible children node count
            let oldVisibleCount = 0;
            for (const child of deletedChildren) {
                if (child.visible) {
                    oldVisibleCount += child.visibleNodeCount;
                }
            }
            this.__updateAncestorsVisibleNodeCount(parent, newVisibleCount - oldVisibleCount);

            // update the view
            this._view.splice(listIndex, oldVisibleCount, treeNodeListToBeRendered);
        }
        
        // update the ancestors collapsible state
        const currParentHasChildren = parent.children.length > 0;
        if (prevParentHasChildren !== currParentHasChildren) {
            this.setCollapsible(location.slice(0, -1), currParentHasChildren);
        }

        // deletion callback
        if (opts.onDidDeleteData && deletedChildren.length > 0) {
            Arrays.dfs(deletedChildren, node => { opts.onDidDeleteData?.(node.data); }, node => node.children);
        }

        // fire events
        this._onDidSplice.fire({ inserted: treeNodeListToBeRendered });
    }

    // [private helper methods]

    private __createNode(
        element: ITreeNodeItem<T>, 
        parent: ITreeNode<T, TFilter>,
        toBeRendered: ITreeNode<T, TFilter>[],
        onDidCreateNode?: (node: ITreeNode<T, TFilter>) => void,
    ): ITreeNode<T, TFilter> 
    {
        const ifSetCollapsed = typeof element.collapsed !== 'undefined';
        const ifSetCollapsible = typeof element.collapsible !== 'undefined';

        // If the element collapsed is not provided, we set it to default.
        const collapsed = ifSetCollapsed ? element.collapsed : this._collapsedByDefault;
        
        // If the element collapsible is not provided, we follow if it is collapsed by hint.
        const collapsible = ifSetCollapsible ? element.collapsible : ifSetCollapsed;
        
        // construct the new node
        const newNode: ITreeNode<T, TFilter> = {
            data: element.data,
            parent: parent,
            depth: parent.depth + 1,
            visible: true,
            collapsible: collapsible!,
            collapsed: collapsed!,
            children: [],
            visibleNodeCount: 1
        };
        
        newNode.visible = parent.visible ? !parent.collapsed : false;
        
        // TODO
        // the visibility should determined by the filter provider.
        // if (parent.visible && this._filter) {
        //     this.__filterNode(newNode);
        // }

        if (newNode.visible) {
            toBeRendered.push(newNode);
        }

        // construct the children nodes recursively
        let visibleNodeCount = 1;
        
        const childrenElements: ITreeNodeItem<T>[]  = element.children || [];
        for (const element of childrenElements) {
            const child = this.__createNode(element, newNode, toBeRendered, onDidCreateNode);
            newNode.children.push(child);
            
            visibleNodeCount += child.visibleNodeCount;
        }
        
        // If the collapsible setting somehow sets to false, we may correct it here.
        newNode.collapsible = newNode.collapsible || newNode.children.length > 0;
        
        if (!newNode.visible) {
            newNode.visibleNodeCount = 0;
        } else if (!newNode.collapsed) {
            newNode.visibleNodeCount = visibleNodeCount;
        }

        // callback
        if (onDidCreateNode) {
            onDidCreateNode(newNode);
        }

        return newNode;
    }
}

/**
 * @class An optimization data structure different than {@link IndexTreeModel}.
 * Instead of letting client provide a new tree-like structure, client modify
 * the existed one and the model will rebuild the tree structure automatically
 * after calling the method {@link IFlexIndexTreeModel.splice}.
 */
export class FlexIndexTreeModel<T, TFilter> extends IndexTreeModelBase<T, TFilter> implements IFlexIndexTreeModel<T, TFilter> {

    // [methods]

    public refresh(
        node: IFlexNode<T, TFilter> = this._root, 
        opts: ITreeModelSpliceOptions<T, TFilter> = {},
    ): void {
        // finds out the parent node and its listIndex.
        const location = this.getNodeLocation(node);
        const { listIndex, visible } = this.__getNodeWithListIndex(location);
        
        // no changes to the current tree, we ignore the request.
        if (!node.stale) {
            return;
        }
        
        // 1st array will store all the new visible nodes including nested ones.
        // 2nd array only store the new nodes under the parent node.
        const treeNodeListToBeRendered: IFlexNode<T, TFilter>[] = [];
        const treeNodeChildrenToInsert: IFlexNode<T, TFilter>[] = [];
        if (node.parent) {
            treeNodeListToBeRendered.push(node);
            treeNodeChildrenToInsert.push(node);
        }

        // recalculate the visible node count
        const oldVisibleCount = node.visibleNodeCount;
        let newVisibleCount = 1;
        for (const element of node.children) {
            this.__refreshNode(element, node, treeNodeListToBeRendered, opts.onDidCreateNode);
            treeNodeChildrenToInsert.push(element);
            newVisibleCount += element.visibleNodeCount;
        }

        const prevHasChildrenState = oldVisibleCount > 1;
        const currHasChildrenState = node.children.length > 0;

        // update view
        if (visible) {
            const changedVisibleCount = newVisibleCount - oldVisibleCount;
            this.__updateAncestorsVisibleNodeCount(node, changedVisibleCount);
            this._view.splice(listIndex, oldVisibleCount, treeNodeListToBeRendered);
        }

        // update the ancestors collapsible state
        if (prevHasChildrenState !== currHasChildrenState) {
            this.setCollapsible(location, currHasChildrenState);
        }
        
        const deletedChildren = node.toDeleted ?? [];
        if (opts.onDidDeleteData && deletedChildren.length > 0) {
            deletedChildren.forEach(data => opts.onDidDeleteData!(data));
        }
        
        // state reset
        node.stale = false;
        node.toDeleted = [];

        // fire events
        this._onDidSplice.fire({ inserted: treeNodeListToBeRendered });
    }

    public triggerOnDidSplice(event: ITreeSpliceEvent<T, TFilter>): void {
        this._onDidSplice.fire(event);
    }

    // [private helper methods]

    private __refreshNode(
        node: IFlexNode<T, TFilter>, 
        parent: IFlexNode<T, TFilter>, 
        toBeRendered: IFlexNode<T, TFilter>[],
        onDidCreateNode?: (node: ITreeNode<T, TFilter>) => void,
    ): void {
        node.stale = false;
        node.depth = parent.depth + 1;
        
        // If the collapsible setting somehow sets to false, we may correct it here.
        node.collapsible ||= node.children.length > 0;
        
        // If collapse never set by the client, we use the default setting.
        node.collapsed ??= this._collapsedByDefault;

        node.visible = parent.visible ? !parent.collapsed : false;
        if (node.visible) {
            toBeRendered.push(node);
        }

        // TODO
        // the visibility should determined by the filter provider.
        // if (parent.visible && this._filter) {
        //     this.__filterNode(newNode);
        // }

        let newVisibleCount = 1;
        for (const child of node.children) {
            this.__refreshNode(child, node, toBeRendered, onDidCreateNode);
            newVisibleCount += child.visibleNodeCount;
        }

        node.visibleNodeCount = node.visible ? newVisibleCount : 0;

        // treats refreshed node as new created node
        if (onDidCreateNode) {
            onDidCreateNode(node);
        }
    }
}