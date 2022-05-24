import { AsyncTreeRenderer } from "src/base/browser/secondary/tree/asyncTreeRenderer";
import { IMultiTree, IMultiTreeOptions, MultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { composedItemProvider, IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListTraitEvent } from "src/base/browser/secondary/listWidget/listTrait";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { Event, Register } from "src/base/common/event";
import { Weakmap } from "src/base/common/map";
import { IScrollEvent } from "src/base/common/scrollable";
import { ITreeCollapseStateChangeEvent, ITreeMouseEvent, ITreeNode, ITreeNodeItem, ITreeSpliceEvent } from "src/base/browser/secondary/tree/tree";
import { AsyncMultiTreeModel, IAsyncMultiTreeModel } from "src/base/browser/secondary/tree/asyncMultiTreeModel";
import { Iterable } from "src/base/common/iterable";
import { ITreeModelSpliceOptions } from "src/base/browser/secondary/tree/indexTreeModel";
import { Pair } from "src/base/common/type";

/**
 * Provides functionality to determine the children stat of the given data.
 */
export interface IAsyncChildrenProvider<T> {

    /**
     * @description Check if the given data has children.
     */
    hasChildren(data: T): boolean | Promise<boolean>;

    /**
     * @description Get the children from the given data.
     */
    getChildren(data: T): T[] | Promise<T[]>;

    /**
     * @description Determines if the given data should be collapsed when 
     * constructing.
     */
    collapseByDefault?: (data: T) => boolean;

}

/**
 * An internal data structure used in {@link AsyncMultiTree}.
 */
export interface IAsyncTreeNode<T> {
    
    /** The user-data. */
    data: T;

    /** The parent of the current node. */
    parent: IAsyncTreeNode<T> | null;

    /** The children nodes of the current node. */
    children: IAsyncTreeNode<T>[];

    /** Determines if the current node is during the refreshing. */
    refreshing: Promise<void> | null;

    /** 
     * If the tree should be collapsed by default. 
     * @default false
     */
    collapsed: boolean;
}

/**
 * Since {@link AsyncMultiTree} built upon a {@link MultiTree}, the internal
 * tree has the type {@link IMultiTree<IAsyncTreeNode<T>>}. It represents any 
 * APIs will return a node with type {@link ITreeNode<IAsyncTreeNode<T>>} which
 * is not expected. To convert the return type to the {@link ITreeNode<T>}, this
 * will work just like a wrapper under a {@link Weakmap}.
 */
export class AsyncNodeConverter<T, TFilter> implements ITreeNode<T, TFilter> {

    constructor(private readonly _node: ITreeNode<IAsyncTreeNode<T> | null, TFilter>) {}

    get data(): T { return this._node.data!.data; }
    get parent(): ITreeNode<T, TFilter> | null { return this._node.parent?.data ? new AsyncNodeConverter(this._node.parent) : null; }
    get children(): ITreeNode<T, TFilter>[] { return this._node.children.map(child => new AsyncNodeConverter(child)); }
    get visibleNodeCount(): number { return this._node.visibleNodeCount; }
    get depth(): number { return this._node.depth; }
    get visible(): boolean { return this._node.visible; }
    get collapsible(): boolean { return this._node.collapsible; }
    get collapsed(): boolean { return this._node.collapsed; }

}

/**
 * Only interface for {@link AsyncMultiTree}.
 */
export interface IAsyncMultiTree<T, TFilter> {

    /**
     * The container of the whole tree.
     */
    DOMElement: HTMLElement;

    // [event]
    
    /**
     * Events when tree splice happened.
     */
    get onDidSplice(): Register<ITreeSpliceEvent<IAsyncTreeNode<T> | null, TFilter>>;

    /**
     * Fires when the tree node collapse state changed.
     */
    get onDidChangeCollapseStateChange(): Register<ITreeCollapseStateChangeEvent<IAsyncTreeNode<T> | null, TFilter>>;

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
    get onDidChangeItemFocus(): Register<IListTraitEvent>;
    
    /**
     * Fires when the selected tree nodes in the {@link IAsyncMultiTree} is changed.
     */
    get onDidChangeItemSelection(): Register<IListTraitEvent>;
    
    /**
     * Fires when the tree node in the {@link IAsyncMultiTree} is clicked.
     */
    get onClick(): Register<ITreeMouseEvent<T>>;
    
    /**
     * Fires when the tree node in the {@link IAsyncMultiTree} is double clicked.
     */
    get onDoubleclick(): Register<ITreeMouseEvent<T>>;
    
    // [public method]

    /**
     * @description Disposes the whole tree (including view).
     */
    dispose(): void;

    /**
     * @description Returns the root data of the tree.
     */
    root(): T;
    
    /**
     * @description Given the data, re-acquires the stat of the the corresponding 
     * tree node and then its descendants asynchronously. The view will be 
     * rerendered after all the tree nodes get refreshed.
     * @param data The provided data with type `T`. Default is the root.
     */
    refresh(data?: T): Promise<void>;

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
     * @returns If it is collapsible. If the data is not found, false is returned.
     */
    isCollapsible(data: T): boolean;

    /**
     * @description Determines if the corresponding node of the given data is 
     * collapsed.
     * @param data The corresponding data.
     * @returns If it is collapsed. If the data is not found, false is returned.
     */
    isCollapsed(data: T): boolean;

    /**
     * @description Collapses to the tree node with the given data.
     * @param data The data representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     */
    collapse(data: T, recursive: boolean): boolean;

    /**
     * @description Expands to the tree node with the given data.
     * @param data The data representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     */
    expand(data: T, recursive: boolean): boolean;
     
    /**
     * @description Toggles the state of collapse or expand to the tree node with
     * the given data.
     * @param data The data representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     */
    toggleCollapseOrExpand(data: T, recursive: boolean): boolean;
     
    /**
     * @description Collapses all the tree nodes.
     */
    collapseAll(): void;
    
    /**
     * @description Expands all the tree nodes.
     */
    expandAll(): void;

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

/** EXPORT FOR OTHER MODULES USAGE, DO NOT USE DIRECTLY. */
export type AsyncWeakMap<T, TFilter> = Weakmap<ITreeNode<IAsyncTreeNode<T> | null, TFilter>, ITreeNode<T, TFilter>>;

/**
 * {@link AsyncMultiTree} Constructor option.
 */
export interface IAsyncMultiTreeOptions<T, TFilter> extends IMultiTreeOptions<T>, ITreeModelSpliceOptions<IAsyncTreeNode<T>, TFilter> {

}

/**
 * @class Built upon a {@link IMultiTree} and {@link IAsyncMultiTreeModel}.
 * 
 * Different from {@link IMultiTree} and any other tree-like structure, children 
 * of each node is NOT decided by the caller, instead, caller needs to provider 
 * a {@link IAsyncChildrenProvider} which is the one that has ability to 
 * determine the children of each node.
 * 
 * Since the caller cannot decide the structrue of the tree, once the root data 
 * is given, the {@link AsyncMultiTree} will build the whole tree under the
 * provided {@link IAsyncChildrenProvider}, and the whole process is implemented
 * asynchronously.
 * 
 * RootData is not counted as the part of the tree.
 * 
 * Constructor is private, use {@link AsyncMultiTree.create} instead.
 */
export class AsyncMultiTree<T, TFilter = void> implements IAsyncMultiTree<T, TFilter>, IDisposable {

    // [field]

    private readonly _disposables: DisposableManager;

    protected readonly _tree: IMultiTree<IAsyncTreeNode<T>, TFilter>;
    protected readonly _model: IAsyncMultiTreeModel<T, TFilter>;

    private _onDidCreateNode?: (node: ITreeNode<IAsyncTreeNode<T>, TFilter>) => void;
    private _onDidDeleteNode?: (node: ITreeNode<IAsyncTreeNode<T>, TFilter>) => void;
    
    // [constructor]

    private constructor(
        container: HTMLElement,
        rootData: T,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        childrenProvider: IAsyncChildrenProvider<T>,
        opts: IAsyncMultiTreeOptions<T, TFilter> = {},
    ) {
        this._disposables = new DisposableManager();

        const unwrapper: AsyncWeakMap<T, TFilter> = new Weakmap(node => new AsyncNodeConverter(node));

        this._tree = this.__createTree(container, renderers, itemProvider, unwrapper);
        this._model = this.__createModel(rootData, this._tree, childrenProvider, unwrapper);

        // update options
        
        this._onDidCreateNode = opts.onDidCreateNode;
        this._onDidDeleteNode = opts.onDidDeleteNode;
    }

    // [static method]

    /**
     * @description Creates an instance of {@link AsyncMultiTree}. The only 
     * difference is that the method will call the `refresh()` immediately.
     */
    public static create<T, TFilter = void>(
        container: HTMLElement, 
        rootData: T, 
        renderers: ITreeListRenderer<T, TFilter, any>[], 
        itemProvider: IListItemProvider<T>, 
        childrenProvider: IAsyncChildrenProvider<T>,
        opts: IAsyncMultiTreeOptions<T, TFilter> = {}
    ): Pair<AsyncMultiTree<T, TFilter>, Promise<void>>
    {
        const tree = new AsyncMultiTree(container, rootData, renderers, itemProvider, childrenProvider, opts);
        
        return [tree, tree.refresh()];
    }

    // [event]

    get onDidSplice(): Register<ITreeSpliceEvent<IAsyncTreeNode<T> | null, TFilter>> { return this._model.onDidSplice; }
    get onDidChangeCollapseStateChange(): Register<ITreeCollapseStateChangeEvent<IAsyncTreeNode<T> | null, TFilter>> { return this._model.onDidChangeCollapseStateChange; }

    get onDidScroll(): Register<IScrollEvent> { return this._tree.onDidScroll; }
    get onDidChangeFocus(): Register<boolean> { return this._tree.onDidChangeFocus; }
    get onDidChangeItemFocus(): Register<IListTraitEvent> { return this._tree.onDidChangeItemFocus; }
    get onDidChangeItemSelection(): Register<IListTraitEvent> { return this._tree.onDidChangeItemSelection; }
    
    get onClick(): Register<ITreeMouseEvent<T>> { return Event.map(this._tree.onClick, this.__toTreeMouseEvent); }
    get onDoubleclick(): Register<ITreeMouseEvent<T>> { return Event.map(this._tree.onDoubleclick, this.__toTreeMouseEvent); }
    
    get DOMElement(): HTMLElement { return this._tree.DOMElement; }

    // [public method]

    public async refresh(data: T = this._model.root): Promise<void> {
        await this.__refresh(data);
    }

    public dispose(): void {
        this._disposables.dispose();
    }

    public root(): T {
        return this._model.root;
    }

    public getNode(data: T): ITreeNode<T, TFilter> {
        return this._model.getNode(data);
    }

    public hasNode(data: T): boolean {
        return this._model.hasNode(data);
    }

    public isCollapsible(data: T): boolean {
        return this._model.isCollapsible(data);
    }

    public isCollapsed(data: T): boolean {
        return this._model.isCollapsed(data);
    }

    public collapse(data: T, recursive: boolean): boolean {
        return this._model.setCollapsed(data, true, recursive);
    }

    public expand(data: T, recursive: boolean): boolean {
        return this._model.setCollapsed(data, false, recursive);
    }

    public toggleCollapseOrExpand(data: T, recursive: boolean): boolean {
        const asyncNode = this._model.getAsyncNode(data);
        return this._tree.toggleCollapseOrExpand(asyncNode === this._model.getRootAsyncNode() ? null : asyncNode, recursive);
    }

    public collapseAll(): void {
        this._tree.collapseAll();
    }

    public expandAll(): void {
        this._tree.expandAll();
    }

    public layout(height?: number): void {
        this._tree.layout(height);
    }

    public rerender(data: T): void {
        this._model.rerender(data);
    }

    public size(): number {
        return this._tree.size();
    }

    // [private helper method]

    /**
     * @description Creates and returns a {@link IMultiTree}.
     */
    private __createTree(
        container: HTMLElement,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        unwrapper: AsyncWeakMap<T, TFilter>
    ): MultiTree<IAsyncTreeNode<T>, TFilter> 
    {
        // convert the arguments into correct type (wrappers kind of stuff)
        const asyncRenderers = renderers.map(r => new AsyncTreeRenderer(r, unwrapper));
        const asyncProvider = new composedItemProvider<T, IAsyncTreeNode<T>>(itemProvider);

        return new MultiTree<IAsyncTreeNode<T>, TFilter>(container, asyncRenderers, asyncProvider, {});
    }

    /**
     * @description Creates and returns a {@link AsyncMultiTreeModel}.
     */
    private __createModel(
        rootData: T,
        tree: IMultiTree<IAsyncTreeNode<T>, TFilter>,
        childrenProvider: IAsyncChildrenProvider<T>,
        unwrapper: AsyncWeakMap<T, TFilter>
    ): IAsyncMultiTreeModel<T, TFilter> {
        return new AsyncMultiTreeModel<T, TFilter>(rootData, tree, childrenProvider, unwrapper);
    }

    /**
     * @description Auxiliary method for `refresh()`.
     * @param data The provided data with type `T`.
     */
    private async __refresh(data: T): Promise<void> {
        
        // wait until nothing is refreshing
        const node = this._model.getAsyncNode(data);
        if (node.refreshing) {
            await node.refreshing;
        }

        // wait until refreshing the node and its descendants
        await this._model.refreshNode(node);

        // renders the whole view
        this.__render(node);
    }

    /**
     * @description Renders the current tree structure given the async tree node.
     * @param node The provided async tree node.
     */
    private __render(node: IAsyncTreeNode<T>): void {
        
        const children = node.children.map(child => this.__toTreeNodeItem(child));
        
        const root = this._model.getAsyncNode(this._model.root);
        this._tree.splice(node === root ? null : node, Number.MAX_VALUE, children, {
            onDidCreateNode: this._onDidCreateNode,
            onDidDeleteNode: this._onDidDeleteNode,
        });
    }

    /**
     * @description Given the {@link IAsyncTreeNode}, converts it recursively 
     * into a {@link ITreeNodeItem}.
     * @param node The provided async tree node.
     */
    private __toTreeNodeItem(node: IAsyncTreeNode<T>): ITreeNodeItem<IAsyncTreeNode<T>> {    
        
        const collapsible = !!node.children.length;
        const collapsed = node.collapsed;
        const children = collapsible ? Iterable.map(node.children, node => this.__toTreeNodeItem(node)) : [];
        
        return {
            data: node,
            collapsible: collapsible,
            collapsed: collapsed,
            children: [...children]
        };
    }

    /**
     * @description Converts the event with type {@link ITreeMouseEvent<IAsyncTreeNode<T> | null>}
     * to {@link ITreeMouseEvent<T>}.
     */
    private __toTreeMouseEvent(event: ITreeMouseEvent<IAsyncTreeNode<T> | null>): ITreeMouseEvent<T> {
        return {
            event: event.event,
            data: event.data && event.data.data,
            parent: event.parent?.data || null,
            children: event.children.map(child => child!.data),
            depth: event.depth
        };
    }
    
}
