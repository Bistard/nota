
/*******************************************************************************
 * A simple file for common and useful interfaces relates to tree.
 ******************************************************************************/

/**
 * An enumeration for tree node visibility.
 */
export const enum TreeNodeVisibility {

    /** The tree node should be visible in the tree display. */
    Visible,

    /** The tree node should be hidden in the tree display. */
    Hidden,

}

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
    visibility: TreeNodeVisibility;

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
 * The actual tree-like data structure representing the Model part in MVVM which
 * mainly handling the data behaviours.
 * 
 * T: represents the type of data is stored inside the node.
 * TFilter: represents the type of data for matching purpose, eg. {@link FuzzyScore}.
 * TRef: represents the equivalent way representing node in the tree, default is 
 *       {@type number[]} which representing the location of a node.
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
     * @returns Returns undefined if not found, returns {@type ITreeNode} if found.
     */
    getNode(location: TRef): ITreeNode<T, TFilter> | undefined;

    /**
     * Returns the location corresponding to the given {@type ITreeNode}.
     * @param node The provided tree node.
     * @returns The location of the given tree node.
     */
    getNodeLocation(node: ITreeNode<T, TFilter>): TRef;

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