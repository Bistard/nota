
/*******************************************************************************
 * A simple file for common and useful interfaces relates to tree.
 ******************************************************************************/

/**
 * An internal data structure for {@link ITreeModel}. Represents each tree node
 * in a tree-like structure.
 * 
 * T: represents the type of data is stored inside the node.
 * TFilter: represents the type of data for matching purpose, eg. {@link FuzzyScore}.
 */
export interface ITreeNode<T, TFilter = void> {

    /** The corresponding stored user-defined data. */
    data: T | null;

    /** The parent of the tree node. */
    parent: ITreeNode<T, TFilter> | null;

    /** The childrens of the tree node. */
    children: ITreeNode<T, TFilter>[];

    /** The depth of the tree node in the whole tree structure. */
    depth: number;

    /** Determines if the tree node is visible. */
    visible: boolean;

    /** 
     * Determines if the tree node is collapsible. eg. the folder is 
     * collapsible and a file vice versa. 
     */
    collapsible: boolean;

    /** 
     * Determines if the tree node is collapsed. 
     * @warn If it's not collapsible, accessing this member is undefined behaviour. 
     */
    collapsed: boolean;
}

/**
 * A user-side created object as input for splicing elements into the tree-like 
 * structure. Allows users to splice nested tree nodes.
 */
export interface ITreeNodeElement<T> {
    
    /** The corresponding stored user-defined data. */
    data: T;

    /** 
     * Determines if the tree node is collapsible. eg. the folder is 
     * collapsible and a file vice versa. 
     * @default false
     */
    collapsible?: boolean;

    /** 
     * Determines if the tree node is collapsed. 
     * @warn If it's not collapsible, this member does not mean anything.
     */
    collapsed?: boolean;

    /** 
     * The children of the current element. 
     * @default empty
     */
    children?: ITreeNodeElement<T>[];
}

/**
 * The actual tree-like data structure representing the Model part in MVVM which
 * mainly handling the data behaviours.
 * 
 * T: represents the type of data is stored inside the node.
 * TFilter: represents the type of data for matching purpose, eg. {@link FuzzyScore}.
 * TRef: represents the equivalent way representing node in the tree, default is 
 *       {@link number[]} which representing the location of a node.
 */
export interface ITreeModel<T, TFilter = void, TRef = number[]> {

    /**
     * Check if the given node is existed.
     * @param location The location representation of the node.
     * @returns If the node exists.
     */
    hasNode(location: TRef): boolean;
    
    /**
     * Try to get an existed node given the location of the node.
     * @param location The location representation of the node.
     * @returns Returns undefined if not found, returns {@link ITreeNode} vice 
     * versa.
     */
    getNode(location: TRef): ITreeNode<T, TFilter> | undefined;

    /**
     * Returns the location corresponding to the given {@link ITreeNode}.
     * @param node The provided tree node.
     * @returns The location of the given tree node.
     */
    getNodeLocation(node: ITreeNode<T, TFilter>): TRef;

    /**
     * Returns the index of the node in the tree when traversing in pre-order.
     * @param location The location representation of the node.
     * @warn If node is not found, an {@link Error} is thrown.
     */
    getNodeListIndex(location: TRef): number;

    // TODO...

    /**
     * Determines if the given location of a node is collapsible.
     * @param location The location representation of the node.
     * @returns If it is collapsible. If the location is not found, false is 
     *          returned.
     */
    isCollapsible(location: TRef): boolean;

    /**
     * Determines if the given location of a node is collapsed.
     * @param location The location representation of the node.
     * @returns If it is collapsed. If the location is not found, false is 
     *          returned.
     */
    isCollapsed(location: TRef): boolean;


}