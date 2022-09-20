import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListWidget, ITraitChangeEvent } from "src/base/browser/secondary/listWidget/listWidget";
import { AsyncTreeModel, IChildrenProvider, IAsyncTreeModel } from "src/base/browser/secondary/tree/asyncTreeModel";
import { ITreeModelSpliceOptions } from "src/base/browser/secondary/tree/indexTreeModel";
import { FlexMultiTree, IMultiTreeOptions, MultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeNode, ITreeModel, ITreeCollapseStateChangeEvent, ITreeMouseEvent, ITreeTouchEvent, ITreeContextmenuEvent, ITreeSpliceEvent, IFlexNode } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { Disposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { Register } from "src/base/common/event";
import { IStandardKeyboardEvent } from "src/base/common/keyboard";
import { IScrollEvent } from "src/base/common/scrollable";

/**
 * @internal
 * The internal tree node structure used to extend the functionalities of the 
 * internal {@link IFlexNode}.
 * 
 * @implements
 * This helps us to tree the internal tree node with extra fields to avoid 
 * constructing extra object as a tree node to be nested inside {@link MultiTree}. 
 * Results a faster and less memory costing. 
 */
export interface IAsyncNode<T, TFilter> extends IFlexNode<T, TFilter> {
    
    /** Determines if the current node is during the refreshing. */
    refreshing?: Promise<void>;
}

/**
 * An interface only for {@link AsyncTree}.
 */
export interface IAsyncTree<T, TFilter> extends Disposable {

    /**
     * The container of the whole tree.
     */
    readonly DOMElement: HTMLElement;

    /**
     * The root data of the tree.
     */
    readonly root: T;

    /**
     * Events when tree splice happened.
     */
    get onDidSplice(): Register<ITreeSpliceEvent<T, TFilter>>;

    /**
     * Fires when the tree node collapse state changed.
     */
    get onDidChangeCollapseState(): Register<ITreeCollapseStateChangeEvent<T, TFilter>>;

    /**
     * Fires when the {@link IAsyncMultiTree} is scrolling.
     */
    get onDidScroll(): Register<IScrollEvent>;

    /**
     * Fires when the {@link IAsyncMultiTree} itself is blured or focused.
     */
    get onDidChangeFocus(): Register<boolean>;
    
    /**
     * Fires when the focused tree nodes in the {@link IAsyncMultiTree} is changed.
     */
    get onDidChangeItemFocus(): Register<ITraitChangeEvent>;
    
    /**
     * Fires when the selected tree nodes in the {@link IAsyncMultiTree} is changed.
     */
    get onDidChangeItemSelection(): Register<ITraitChangeEvent>;
    
    /**
     * Fires when the tree node in the {@link IAsyncMultiTree} is clicked.
     */
    get onClick(): Register<ITreeMouseEvent<T>>;
    
    /**
     * Fires when the tree node in the {@link IAsyncMultiTree} is double clicked.
     */
    get onDoubleclick(): Register<ITreeMouseEvent<T>>;

    /** 
     * An event sent when the state of contacts with a touch-sensitive surface 
     * changes. This surface can be a touch screen or trackpad.
     */
    get onTouchstart(): Register<ITreeTouchEvent<T>>;

    /**
     * Fires when the {@link IAsyncMultiTree} is keydowned.
     */
    get onKeydown(): Register<IStandardKeyboardEvent>;
    
    /** 
     * Fires when the {@link IAsyncMultiTree} is keyup. 
     */
    get onKeyup(): Register<IStandardKeyboardEvent>;

     /** 
      * Fires when the {@link IAsyncMultiTree} is keypress. 
      */
    get onKeypress(): Register<IStandardKeyboardEvent>;

    /** 
     * Fires when the user attempts to open a context menu {@link IAsyncMultiTree}. 
     * This event is typically triggered by:
     *      - clicking the right mouse button
     *      - pressing the context menu key
     *      - Shift F10
     */
    get onContextmenu(): Register<ITreeContextmenuEvent<T>>;

    // [public method]
    
    /**
     * @description Given the data, re-acquires the stat of the the corresponding 
     * tree node and then its descendants asynchronously. The view will be 
     * rerendered after all the tree nodes get refreshed.
     * @param data The provided client data. Defaults to the root.
     */
    refresh(data?: T): Promise<void>;

    /**
     * @description Filters the whole tree by the provided {@link ITreeFilter}
     * in the constructor.
     * @param visibleOnly If only consider the visible tree nodes. Default to 
     *                    true.
     */
    filter(visibleOnly?: boolean): void;

    /**
     * @description Try to get an existed node given the corresponding data.
     * @param data The corresponding data.
     * @returns Returns the expected tree node.
     */
    getNode(data: T): ITreeNode<T, TFilter>;

    /**
     * @description Check if the given node is existed.
     * @param data The corresponding data.
     * @returns If the node exists.
     */
    hasNode(data: T): boolean;

    /**
     * @description Determines if the corresponding node of the given data is 
     * collapsible.
     * @param data The corresponding data.
     * @returns If it is collapsible.
     * 
     * @throws If the location is not found, an error is thrown.
     */
    isCollapsible(data: T): boolean;

    /**
     * @description Determines if the corresponding node of the given data is 
     * collapsed.
     * @param data The corresponding data.
     * @returns If it is collapsed.
     * 
     * @throws If the location is not found, an error is thrown.
     */
    isCollapsed(data: T): boolean;

    /**
     * @description Collapses to the tree node with the given data.
     * @param data The data representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     * @returns If the operation successed.
     */
    collapse(data: T, recursive: boolean): boolean;

    /**
     * @description Expands to the tree node with the given data.
     * @param data The data representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     * @returns If the operation successed.
     * 
     * @note Since expanding meaning refreshing to the newest children nodes,
     * asynchronous is required.
     */
    expand(data: T, recursive: boolean): Promise<boolean>;
     
    /**
     * @description Toggles the state of collapse or expand to the tree node with
     * the given data.
     * @param data The data representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     * @returns If the operation successed.
     */
    toggleCollapseOrExpand(data: T, recursive: boolean): Promise<boolean>;
     
    /**
     * @description Collapses all the tree nodes.
     */
    collapseAll(): void;
    
    /**
     * @description Expands all the tree nodes.
     */
    expandAll(): void;

    /**
     * @description Sets the given item as the anchor.
     */
    setAnchor(item: T): void;

    /**
     * @description Returns the focused item.
     */
    getAnchor(): T | null;

    /**
     * @description Sets the given item as focused.
     */
    setFocus(item: T): void;

    /**
     * @description Returns the focused item.
     */
    getFocus(): T | null;

    /**
     * @description Sets the given a series of items as selected.
     */
    setSelections(items: T[]): void;

    /**
     * @description Returns the selected items.
     */
    getSelections(): T[];

    /**
     * @description Sets the current view as focused in DOM tree.
     */
    setDomFocus(): void;

    /**
     * @description Given the height, re-layouts the height of the whole view.
     * @param height The given height.
     * 
     * @note If no values are provided, it will sets to the height of the 
     * corresponding DOM element of the view.
     */
    layout(height?: number): void;
    
    /**
     * @description Rerenders the whole view.
     */
    rerender(data: T): void;

    /**
     * @description Returns the number of nodes in the tree.
     */
    size(): number;
}

/**
 * Constructor options for {@link AsyncTree}.
 * 
 * @implements The reason to omit all these fields is because {@link AsyncTree} 
 * wraps a {@link IAsyncNode} over each client data. On the client side, 
 * their provider should has generic type `T` instead of `IAsyncNode<T>`. 
 * The conversion between different types will be handled inside the 
 * {@link AsyncTree}.
 */
export interface IAsyncTreeOptions<T, TFilter> extends IMultiTreeOptions<T, TFilter>, ITreeModelSpliceOptions<T, TFilter> {
    
    /**
     * Provides functionality to determine the children stat of the given data.
     */
    readonly childrenProvider: IChildrenProvider<T>;
}

/**
 * @internal
 * @class A {@link AsyncMultiTree} extends all the abilities from {@link MultiTree}
 * and creates its own model {@link AsyncTreeModel} which contains the core
 * business logic for asynchronous functionalities.
 * 
 * @implements Extends {@link multiTree} means there will only has one model to
 * exist (one tree structure for maintaining purpose).
 * 
 * The biggest difference is that instead of storing the client data with type 
 * `T` directly into each {@link ITreeNode} in {@link MultiTree}. Instead, it 
 * wraps each client data with a {@link IAsyncNode<T>}. See more detailed 
 * implementations in {@link AsyncTreeModel}.
 */
class AsyncMultiTree<T, TFilter> extends FlexMultiTree<T, TFilter> {

    declare protected readonly _model: IAsyncTreeModel<T, TFilter>;
    private readonly _childrenProvider: IChildrenProvider<T>;

    // [constructor]

    constructor(
        container: HTMLElement,
        rootData: T,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IAsyncTreeOptions<T, TFilter>
    ) {
        super(container, rootData, renderers, itemProvider, opts);
        this._childrenProvider = opts.childrenProvider;
    }

    // [protected override method]

    protected override createModel(
        rootData: T, 
        view: IListWidget<ITreeNode<T, TFilter>>, 
        opts: IMultiTreeOptions<T, TFilter>,
        ): ITreeModel<T, TFilter, T> 
    {
        return new AsyncTreeModel(
            rootData, 
            view, 
            {
                collapsedByDefault: opts.collapsedByDefault,
                filter: opts.filter,
                childrenProvider: (<any>opts).childrenProvider, // TODO
            }
        );
    }

    // [getter]

    get root(): T {
        return this._model.root;
    }

    get rootNode(): ITreeNode<T, TFilter> {
        return this._model.rootNode;
    }

    // [public methods]

    public refreshNode(node: ITreeNode<T, TFilter>): Promise<void> {
        return this._model.refreshNode(node);
    }

    public shouldRefreshNodeWhenExpand(node: T): boolean {
        if (this._childrenProvider.shouldRefreshChildren) {
            return this._childrenProvider.shouldRefreshChildren(node);
        }
        return true;
    }

    public setCollapsed(node: T, collapsed?: boolean, recursive?: boolean): boolean {
        if (collapsed) {
            return this.collapse(node, recursive ?? false);
        } else {
            return this.expand(node, recursive ?? false);
        };
    }
}

/**
 * @class A {@link AsyncTree} Builts on top of {@link MultiTree}. Different from
 * any other tree-like structures, the children of each node is NOT decided by 
 * the client, instead, client needs to provide a {@link IChildrenProvider} 
 * which has the actual ability to determine the children of each node after 
 * each refresh.
 * 
 * Since the client cannot decide the structure of the tree, once the root data 
 * is given, the {@link AsyncTree} will build the whole tree under the provided 
 * {@link IChildrenProvider}, and the whole process is implemented 
 * asynchronously.
 * 
 * @note `RootData` is not counted as the part of the tree.
 * @note The subtree will be refreshed automatically once the collapse state of 
 * the tree node is changed.
 * 
 * @implements 
 * The tree is wrapping a {@link AsyncMultiTree} which extends {@link MultiTree} 
 * and the reason for this is to avoid having same property names.
 * 
 * The idea of {@link AsyncTree} is inspired by a class named `AsyncDataTree` in
 * Visual Studio Code. They maintains two isomorphismic tree structures to avoid 
 * excessive rerendering. The {@link AsyncTree} goes one step further, it 
 * elimates another tree structure which causes less memory usage and runs 
 * faster.
 */
export class AsyncTree<T, TFilter> extends Disposable implements IAsyncTree<T, TFilter> {

    // [field]

    private readonly _tree: AsyncMultiTree<T, TFilter>;

    private _onDidCreateNode?: (node: ITreeNode<T, TFilter>) => void;
    private _onDidDeleteNode?: (node: ITreeNode<T, TFilter>) => void;

    // [constructor]

    constructor(
        container: HTMLElement,
        rootData: T,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IAsyncTreeOptions<T, TFilter>,
    ) {
        super();
        
        this._tree = new AsyncMultiTree(
            container, 
            rootData,
            renderers, 
            itemProvider, 
            opts,
        );

        this._onDidCreateNode = opts.onDidCreateNode;
        this._onDidDeleteNode = opts.onDidDeleteNode;

        // presetting behaviours on collapse state change
        this.__register(this._tree.onDidChangeCollapseState(e => this.__internalOnDidChangeCollapseState(e)));
    }

    // [event]

    get onDidSplice(): Register<ITreeSpliceEvent<T, TFilter>> { return this._tree.onDidSplice; }
    get onDidChangeCollapseState(): Register<ITreeCollapseStateChangeEvent<T, TFilter>> { return this._tree.onDidChangeCollapseState; }

    get onDidScroll(): Register<IScrollEvent> { return this._tree.onDidScroll; }
    get onDidChangeFocus(): Register<boolean> { return this._tree.onDidChangeFocus; }
    get onDidChangeItemFocus(): Register<ITraitChangeEvent> { return this._tree.onDidChangeItemFocus; }
    get onDidChangeItemSelection(): Register<ITraitChangeEvent> { return this._tree.onDidChangeItemSelection; }
    
    get onClick(): Register<ITreeMouseEvent<T>> { return this._tree.onClick; }
    get onDoubleclick(): Register<ITreeMouseEvent<T>> { return this._tree.onDoubleclick; }
    
    get onTouchstart(): Register<ITreeTouchEvent<T>> { return this._tree.onTouchstart; }
    get onKeydown(): Register<IStandardKeyboardEvent> { return this._tree.onKeydown; }
    get onKeyup(): Register<IStandardKeyboardEvent> { return this._tree.onKeyup; }
    get onKeypress(): Register<IStandardKeyboardEvent> { return this._tree.onKeypress; }
    get onContextmenu(): Register<ITreeContextmenuEvent<T>> { return this._tree.onContextmenu; }

    // [getter]

    get DOMElement(): HTMLElement { return this._tree.DOMElement; }

    get root(): T { return this._tree.root; }

    // [public methods]

    public async refresh(data: T = this._tree.root): Promise<void> {
        
        const asyncNode: IAsyncNode<T, TFilter> = this._tree.getNode(data);

        // wait until nothing is refreshing
        if (asyncNode.refreshing) {
            await asyncNode.refreshing;
        }

        // wait until refreshing the node and its descendants
        await this._tree.refreshNode(asyncNode);

        // renders the whole view
        this.__render(asyncNode);
    }

    public filter(visibleOnly?: boolean): void {
        this._tree.filter(visibleOnly);
    }

    public getNode(data: T): ITreeNode<T, TFilter> {
        return this._tree.getNode(data);
    }

    public hasNode(data: T): boolean {
        try {
            return this._tree.hasNode(data);
        } catch {
            return false;
        }
    }

    public isCollapsible(data: T): boolean {
        return this._tree.isCollapsible(data);
    }

    public isCollapsed(data: T): boolean {
        return this._tree.isCollapsed(data);
    }

    public collapse(data: T, recursive: boolean): boolean {
        return this._tree.setCollapsed(data, true, recursive);
    }

    public async expand(data: T, recursive: boolean): Promise<boolean> {

        const root: IAsyncNode<T, TFilter> = this._tree.rootNode;
        if (root.refreshing) {
            await root.refreshing;
        }
        
        if (this._tree.hasNode(data) && !this._tree.isCollapsible(data)) {
            return false;
        }

        const asyncNode: IAsyncNode<T, TFilter> = this._tree.getNode(data);
        if (asyncNode.refreshing) {
            await asyncNode.refreshing;
        }

        if (asyncNode !== root && !asyncNode.refreshing && !this._tree.isCollapsed(data)) {
            return false;
        }

        const successOrNot = this._tree.setCollapsed(data, false, recursive);
        if (asyncNode.refreshing) {
            await asyncNode.refreshing;
        }

        return successOrNot;
    }

    public async toggleCollapseOrExpand(data: T, recursive: boolean): Promise<boolean> {
        const root: IAsyncNode<T, TFilter> = this._tree.rootNode;

        if (root.refreshing) {
            await root.refreshing;
        }
        
        if (this._tree.hasNode(data) && this._tree.isCollapsible(data) === false) {
            return false;
        }

        const asyncNode: IAsyncNode<T, TFilter> = this._tree.getNode(data);
        if (asyncNode.refreshing) {
            await asyncNode.refreshing;
        }

        const successOrNot = this._tree.toggleCollapseOrExpand(data, recursive);
        if (asyncNode.refreshing) {
            await asyncNode.refreshing;
        }

        return successOrNot;
    }

    public collapseAll(): void {
        this._tree.collapseAll();
    }

    public expandAll(): void {
        this._tree.expandAll();
    }

    public setAnchor(item: T): void {
        this._tree.setAnchor(item);
    }

    public getAnchor(): T | null {
        return this._tree.getAnchor();
    }

    public setFocus(item: T): void {
        this._tree.setFocus(item);
    }

    public getFocus(): T | null {
        return this._tree.getFocus();
    }

    public setSelections(items: T[]): void {
        this._tree.setSelections(items);
    }

    public getSelections(): T[] {
        return this._tree.getSelections();
    }

    public setDomFocus(): void {
        this._tree.setDomFocus();
    }

    public layout(height?: number): void {
        this._tree.layout(height);
    }

    public rerender(data: T): void {
        this._tree.rerender(data);
    }

    public size(): number {
        return this._tree.size();
    }

    // [private helper methods]

    private __render(node: ITreeNode<T, TFilter>): void {
        this._tree.refresh(
            node,
            {
                onDidCreateNode: this._onDidCreateNode,
                onDidDeleteNode: this._onDidDeleteNode,
            },
        );
    }

    /**
     * @description Presets the behaviours when the collapsing state inside the
     * {@link MultiTree} is changed.
     */
    private async __internalOnDidChangeCollapseState(e: ITreeCollapseStateChangeEvent<T, TFilter>): Promise<void> {
        
        const node: IAsyncNode<T, TFilter> = e.node;
        if (node === this._tree.rootNode) {
            return;
        }

        /**
         * Skip the refresh operation since there is no reasons to get the 
         * updated children of the current node if it is collapsed.
         */
        if (node.collapsed) {
            return;
        }

        /**
         * An optional optimization that client may prevent the refresh operation
         * when expanding.
         */
        if (this._tree.shouldRefreshNodeWhenExpand(node.data) === false) {
            return;
        }

        /**
         * Refresh the given node and its descendants with the updated stats and
         * rerender the whole tree view.
         */
        try {

            // get the updated tree structure into the model
            await this._tree.refreshNode(node);

            /**
             * Sets the updated tree structure from the model to the old one in
             * the {@link MultiTree} and rerender it.
             */
            this.__render(node);
        } 

        /**
         * Tree rendering process should not expect any errors. Forward it to 
         * the global.
         */
        catch (error) {
            ErrorHandler.onUnexpectedError(error);
        }
    }
}
