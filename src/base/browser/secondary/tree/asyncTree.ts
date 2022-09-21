import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListWidget, ITraitChangeEvent } from "src/base/browser/secondary/listWidget/listWidget";
import { AsyncTreeModel, IChildrenProvider, IAsyncTreeModel } from "src/base/browser/secondary/tree/asyncTreeModel";
import { ITreeModelSpliceOptions } from "src/base/browser/secondary/tree/indexTreeModel";
import { FlexMultiTree, IMultiTreeBase, IMultiTreeOptions } from "src/base/browser/secondary/tree/multiTree";
import { ITreeNode, ITreeModel, ITreeCollapseStateChangeEvent, ITreeMouseEvent, ITreeTouchEvent, ITreeContextmenuEvent, ITreeSpliceEvent, IFlexNode } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { Disposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { Register } from "src/base/common/event";
import { IStandardKeyboardEvent } from "src/base/common/keyboard";
import { IScrollEvent } from "src/base/common/scrollable";
import { Blocker } from "src/base/common/util/async";

/**
 * @internal
 * The internal tree node structure used to extend the functionalities of the 
 * internal {@link IFlexNode}.
 */
export interface IAsyncNode<T, TFilter> extends IFlexNode<T, TFilter> {
    
    /** Determines if the current node is during the refreshing. */
    refreshing?: Promise<void>;
}

/**
 * An interface only for {@link AsyncTree}.
 */
export interface IAsyncTree<T, TFilter> extends Omit<IMultiTreeBase<T, TFilter>, 'expand' | 'toggleCollapseOrExpand'> {
    
    /**
     * @description Given the data, re-acquires the stat of the the corresponding 
     * tree node and then its descendants asynchronously. The view will be 
     * rerendered after all the tree nodes get refreshed.
     * @param data The provided client data. Defaults to the root.
     */
    refresh(data?: T): Promise<void>;

    /**
     * @description Expands to the tree node with the given data.
     * @param data The data representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     * @returns If the operation successed.
     * 
     * @note Since expanding meaning refreshing to the updated children nodes,
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
     * 
     * @note Since expanding meaning refreshing to the updated children nodes,
     * asynchronous is required.
     */
    toggleCollapseOrExpand(data: T, recursive: boolean): Promise<boolean>;
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
 * @class A {@link AsyncMultiTree} extends all the abilities from a 
 * {@link FlexMultiTree} and creates its own model {@link AsyncTreeModel} which 
 * also extends {@link FlexMultiTreeModel} that contains the core business logic 
 * for asynchronous functionalities.
 */
class AsyncMultiTree<T, TFilter> extends FlexMultiTree<T, TFilter> {

    // [field]

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
 * @class A {@link AsyncTree} is different from any other tree-like structures, 
 * the children of each node is NOT decided by the client, instead, client needs 
 * to provide a {@link IChildrenProvider} which has the actual ability to 
 * determine the children of each node after each refresh.
 * 
 * Since the client cannot decide the structure of the tree, once the root data 
 * is given, the {@link AsyncTree} will build the whole tree under the provided 
 * {@link IChildrenProvider}, and the whole process is implemented asynchronously.
 * 
 * @note `RootData` is not counted as the part of the tree.
 * @note The subtree will be refreshed automatically once the collapse state of 
 * the tree node is changed.
 * 
 * @warn If data type `T` is a primitive type, the `size()` function will not 
 * work properly since it cannot decide which is which when mapping client data 
 * to tree node.
 * 
 * @implements 
 * The tree is wrapping a {@link AsyncMultiTree} and the reason for this is to 
 * avoid having same property names.
 * 
 * The idea of {@link AsyncTree} is inspired by a class named `AsyncDataTree` in
 * Visual Studio Code. They maintain two isomorphismic tree structures to avoid 
 * excessive rerendering.
 * 
 * The {@link AsyncTree} goes one step further, it elimates another tree 
 * structure and only maintaining one tree which causes less memory usage and 
 * runs faster.
 * 
 * The {@link AsyncMultiTree} builds on top of {@link FlexMultiTree} which does
 * all the tricks.
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

    public getNodeLocation(node: ITreeNode<T, TFilter>): T {
        return this._tree.getNodeLocation(node);
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

    /**
     * @description Only rerenders the subtree of the given tree node.
     * @param node The given tree node.
     */
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
     * Indicates if any tree nodes is collapse changing, prevent parallel 
     * collapse changings.
     */
    private _collapseChanging?: Promise<void>;

    /**
     * @description Presets the behaviours when the collapsing state is changed.
     */
    private async __internalOnDidChangeCollapseState(e: ITreeCollapseStateChangeEvent<T, TFilter>): Promise<void> {

        // ignores the root node
        const node: IAsyncNode<T, TFilter> = e.node;
        if (node === this._tree.rootNode) {
            return;
        }

        // if any current node is collapse changing, wait for it.
        if (this._collapseChanging) {
            await this._collapseChanging;
        }

        // mark the current node as collapse changing
        const blocker = new Blocker<void>();
        this._collapseChanging = blocker.waiting();
        this._collapseChanging.finally(() => this._collapseChanging = undefined);

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
             * the {@link FlexMultiTree} and rerender it.
             */
            this.__render(node);
            
            // mark as completed
            blocker.resolve();
        } 

        /**
         * Tree rendering process should not expect any errors. Forward it to 
         * the global.
         */
        catch (error) {
            blocker.reject();
            ErrorHandler.onUnexpectedError(error);
        }
    }
}
