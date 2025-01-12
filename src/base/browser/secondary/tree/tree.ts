import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";

/**
 * Fires when the tree is about to refresh.
 */
export interface ITreeRefreshEvent<T, TFilter> {
    
    /** The corresponding tree node. */
    readonly node: ITreeNode<T, TFilter>;
}

/**
 * Type of event when the {@link IIndexTreeModelBase} splice did happen.
 */
export interface ITreeSpliceEvent<T, TFilter> {
    
    /** Inserted nodes */
    readonly inserted: ITreeNode<T, TFilter>[];
}

/**
 * Fires when the collapse state of the tree node is changed.
 */
export interface ITreeCollapseStateChangeEvent<T, TFilter> {
    
    /** The corresponding tree node. */
    readonly node: ITreeNode<T, TFilter>;
}

/**
 * An internal data structure for {@link ITreeModel}. Represents each tree node
 * in a tree-like structure.
 * 
 * T: represents the type of data is stored inside the node.
 * TFilter: represents the type of data for matching purpose, eg. {@link FuzzyScore}.
 */
export interface ITreeNode<T, TFilter = void> extends ITreeNodeItem<T> {
    
    /** The corresponding stored user-defined data. */
    data: T;

    /** The parent of the tree node. */
    parent: this | null;

    /** The children of the tree node. */
    children: this[];

    /** counts how many nodes are actually visible / rendered (includes itself). */
    visibleNodeCount: number;

    /** 
     * The depth of the tree node in the whole tree structure. First level is 1
     * and root of the tree is 0.
     */
    depth: number;

    /** Determines if the tree node is visible. */
    visible: boolean;

    /** 
     * Determines if the tree node is collapsible. eg. the folder is collapsible 
     * and a file vice versa. 
     */
    collapsible: boolean;

    /** 
     * Determines if the tree node is collapsed.
     */
    collapsed: boolean;

    /**
     * Metadata gets forwarded to the renderer after each filter operation.
     * `undefined` means the item is not filtered.
     */
    rendererMetadata?: TFilter;
}

/**
 * A user-side created object as input for splicing elements into the tree-like 
 * structure. Allows users to splice nested tree nodes.
 */
export interface ITreeNodeItem<T> {
    
    /** The corresponding stored user-defined data. */
    data: T;

    /** 
     * Determines if the tree node is collapsible. eg. the folder is collapsible 
     * and a file vice versa.
     */
    collapsible?: boolean;

    /** 
     * Determines if the tree node is collapsed. 
     */
    collapsed?: boolean;

    /** 
     * The children of the current element.
     */
    children?: this[];
}

/**
 * An optimization of {@link ITreeNode} used for fast splicing. Instead of 
 * creating nested {@link ITreeNodeItem} to represent the updated tree-like
 * structures, the client may modify the existing tree structure for better 
 * memory and speed performance.
 */
export interface IFlexNode<T, TFilter = void> extends ITreeNode<T, TFilter> {

    /**
     * If the current tree node is staled and should be refreshed in the view
     * perspective.
     */
    stale?: boolean;

    /**
     * Before every refreshing, the old children data will be stored here. It is
     * useful in the 'IndexTreeModel' stage and will be clean at that point.
     */
    toDeleted?: T[];
}

/**
 * The actual tree-like data structure representing the Model part in MVVM which
 * mainly handling the data behaviors.
 * 
 * T: represents the type of data is stored inside the node.
 * TFilter: represents the type of data for matching purpose.
 * TRef: represents the equivalent way representing node in the tree, default is
 *       `number[]` which representing the location of a node.
 */
export interface ITreeModel<T, TFilter, TRef = number[]> extends IDisposable {

    /**
     * Represents the root of the tree.
     */
    readonly root: TRef;

    /**
     * Returns the root tree node of the tree model.
     */
    readonly rootNode: ITreeNode<T, TFilter>;

    /**
     * Events when tree splice happened.
     */
    readonly onDidSplice: Register<ITreeSpliceEvent<T, TFilter>>;

    /**
     * Fires when the tree node collapse state changed.
     */
    readonly onDidChangeCollapseState: Register<ITreeCollapseStateChangeEvent<T, TFilter>>;

    /**
     * @description Check if the given node is existed.
     * @param location The location representation of the node.
     * @returns If the node exists.
     */
    hasNode(location: TRef): boolean;
    
    /**
     * @description Try to get an existed node given the location of the node.
     * @param location The location representation of the node.
     * @returns Returns the expected tree node.
     * 
     * @throws An exception throws if the node is not found.
     */
    getNode(location: TRef): ITreeNode<T, TFilter>;

    /**
     * @description Returns the location corresponding to the given {@link ITreeNode}.
     * @param node The provided tree node.
     * @returns The location of the given tree node.
     */
    getNodeLocation(node: ITreeNode<T, TFilter>): TRef;

    /**
     * @description Returns the index of the node in the tree when traversing in 
     * pre-order. If node is invisible, returns -1.
     * @param location The location representation of the node.
     * @warn If node is not found, an {@link Error} is thrown.
     */
    getNodeListIndex(location: TRef): number;

    /**
     * @description Determines if the given location of a node is collapsible.
     * @param location The location representation of the node.
     * @returns If it is collapsible.
     * 
     * @throws @throws If the location is not found, an error is thrown.
     */
    isCollapsible(location: TRef): boolean;

    /**
     * @description Sets the given location of a node to a provided collapsible state.
     * @param location The location representation of the node.
     * @param collapsible The collapsible state, if not provided, toggles the 
     *                    current state of the node.
     * @returns If the operation was made.
     */
    setCollapsible(location: TRef, collapsible?: boolean): boolean;

    /**
     * @description Determines if the given location of a node is collapsed.
     * @param location The location representation of the node.
     * @returns If it is collapsed. 
     * 
     * @panic If the location is not found or the location is not collapsible.
     */
    isCollapsed(location: TRef): boolean;

    /**
     * @description Sets the given location of a node to a provided collapsed state.
     * @param location The location representation of the node.
     * @param collapsed The collapsed state, if not provided, toggles the 
     *                  current state of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     * @returns If the operation was made.
     * 
     * @note Recursive meaning all the nested the children will also be collapsed / expanded.
     */
    setCollapsed(location: TRef, collapsed?: boolean, recursive?: boolean): boolean;

    /**
     * @description Expands to the tree node with the given location.
     * @param location The location representation of the node.
     */
    setExpandTo(location: TRef): void;

    /**
     * @description Rerenders the corresponding node with the given location.
     * @param location The location representation of the node.
     */
    rerender(location: TRef): void;

    /**
     * @description Filters the whole tree by the provided {@link ITreeFilter}
     * in the constructor.
     * @param visibleOnly If only consider the visible tree nodes. Default to 
     *                    true.
     */
    filter(visibleOnly?: boolean): void;

    /**
     * @description Returns the total number of nodes in the tree.
     */
    size(): number;
}

/**
 * An tree mouse event type relates to {@link IAbstractTree} or any inheritances.
 */
export interface ITreeMouseEvent<T> {
    
    /** Original browser event. */
    browserEvent: MouseEvent;

    /** The mouse event related data. */
    data: T | null;

    /** The parent data. */
    parent: T | null;

    /** The children data. */
    children: T[] | null;

    /** The depth of the data in the tree. */
    depth: number | null;
}

export interface ITreeTouchEvent<T> {
    
    /** Original browser event. */
    browserEvent: TouchEvent;

    /** The mouse event related data. */
    data: T | null;

    /** The parent data. */
    parent: T | null;

    /** The children data. */
    children: T[] | null;

    /** The depth of the data in the tree. */
    depth: number | null;
}

export interface ITreeContextmenuEvent<T> {
    /** Original browser event. */
    browserEvent: UIEvent;

    /** The mouse event related data. */
    data: T | null;

    /** The parent data. */
    parent: T | null;

    /** The children data. */
    children: T[] | null;

    /** The depth of the data in the tree. */
    depth: number | null;

    /** The browser position of the contextmenu event. */
	position: { x: number; y: number } | undefined;

    /** The browser target of the contextmenu if any. */
    target: HTMLElement | undefined;
}

export interface ITreeTraitChangeEvent<T> {

    /** The items which the corresponding trait has changed */
    data: T[];
}