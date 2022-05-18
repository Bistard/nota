import { AsyncTreeRenderer } from "src/base/browser/basic/tree/asyncTreeRenderer";
import { IMultiTree, MultiTree } from "src/base/browser/basic/tree/multiTree";
import { ITreeListViewRenderer } from "src/base/browser/basic/tree/treeListViewRenderer";
import { composedItemProvider, IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListTraitEvent } from "src/base/browser/secondary/listWidget/listTrait";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { Event, Register } from "src/base/common/event";
import { Weakmap } from "src/base/common/map";
import { IScrollEvent } from "src/base/common/scrollable";
import { ITreeMouseEvent, ITreeNode, ITreeNodeItem } from "src/base/browser/basic/tree/tree";
import { AsyncMultiTreeModel, IAsyncMultiTreeModel } from "src/base/browser/basic/tree/asyncMultiTreeModel";
import { Iterable } from "src/base/common/iterable";

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
    getChildren(data: T): Iterable<T> | Promise<Iterable<T>>;

}

/**
 * An internal data structure used in {@link AsyncMultiTree}.
 */
export interface IAsyncTreeNode<T> {
    data: T;
    parent: IAsyncTreeNode<T> | null;
    children: IAsyncTreeNode<T>[];
    refreshing: Promise<void> | null;
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
    get depth(): number { return this._node.depth; }
    get visible(): boolean { return this._node.visible; }
    get collapsible(): boolean { return this._node.collapsible; }
    get collapsed(): boolean { return this._node.collapsed; }

}

/**
 * Only interface for {@link AsyncMultiTree}.
 */
export interface IAsyncMultiTree<T, TFilter> {

    // [event]

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
     * @description Rerenders the whole view.
     */
    rerender(data: T): void;

    /**
     * @description Returns the number of nodes in the tree.
     */
    size(): number;
}

/** EXPORT FOR MODULE USAGE, DO NOT USE DIRECTLY. */
export type AsyncWeakMap<T, TFilter> = Weakmap<ITreeNode<IAsyncTreeNode<T> | null, TFilter>, ITreeNode<T, TFilter>>;

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
 * Constructor is private, use {@link AsyncMultiTree.create} instead.
 */
export class AsyncMultiTree<T, TFilter = void> implements IAsyncMultiTree<T, TFilter>, IDisposable {

    // [field]

    private readonly _disposables: DisposableManager;

    protected readonly _tree: IMultiTree<IAsyncTreeNode<T>, TFilter>;
    protected readonly _model: IAsyncMultiTreeModel<T, TFilter>;
    
    // [constructor]

    private constructor(
        container: HTMLElement,
        rootData: T,
        renderers: ITreeListViewRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        childrenProvider: IAsyncChildrenProvider<T>,
    ) {
        this._disposables = new DisposableManager();

        const unwrapper: AsyncWeakMap<T, TFilter> = new Weakmap(node => new AsyncNodeConverter(node));

        this._tree = this.__createTree(container, renderers, itemProvider, unwrapper);
        this._model = this.__createModel(rootData, this._tree, childrenProvider, unwrapper);
    }

    // [static method]

    /**
     * @description Creates an instance of {@link AsyncMultiTree}. The only 
     * difference is that the method will call the `refresh()` immediately.
     */
    public static async create<T, TFilter = void>(container: HTMLElement, rootData: T, renderers: ITreeListViewRenderer<T, TFilter, any>[], itemProvider: IListItemProvider<T>, childrenProvider: IAsyncChildrenProvider<T>): Promise<AsyncMultiTree<T, TFilter>> {
        const tree = new AsyncMultiTree(container, rootData, renderers, itemProvider, childrenProvider);
        await tree.refresh();
        return tree;
    }

    // [event]

    get onDidScroll(): Register<IScrollEvent> { return this._tree.onDidScroll; }
    get onDidChangeFocus(): Register<boolean> { return this._tree.onDidChangeFocus; }
    get onDidChangeItemFocus(): Register<IListTraitEvent> { return this._tree.onDidChangeItemFocus; }
    get onDidChangeItemSelection(): Register<IListTraitEvent> { return this._tree.onDidChangeItemSelection; }
    
    get onClick(): Register<ITreeMouseEvent<T>> { return Event.map(this._tree.onClick, this.__toTreeMouseEvent); }
    get onDoubleclick(): Register<ITreeMouseEvent<T>> { return Event.map(this._tree.onDoubleclick, this.__toTreeMouseEvent); }
    
    // [public method]

    public async refresh(data: T = this._model.root): Promise<void> {
        await this.__refresh(data);
    }

    public dispose(): void {
        this._disposables.dispose();
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
        renderers: ITreeListViewRenderer<T, TFilter, any>[],
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
        this._tree.splice(node === root ? null : node, Number.MAX_VALUE, children, {});
    }

    /**
     * @description Given the {@link IAsyncTreeNode}, converts it recursively 
     * into a {@link ITreeNodeItem}.
     * @param node The provided async tree node.
     */
    private __toTreeNodeItem(node: IAsyncTreeNode<T>): ITreeNodeItem<IAsyncTreeNode<T>> {    
        const collapsible: boolean = !!node.children.length;
        const collapsed = false;
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
