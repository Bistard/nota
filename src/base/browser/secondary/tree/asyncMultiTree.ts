import { AsyncTreeRenderer } from "src/base/browser/secondary/tree/asyncTreeRenderer";
import { IMultiTree, IMultiTreeOptions, MultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { composedItemProvider, IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { Event, Register } from "src/base/common/event";
import { Weakmap } from "src/base/common/util/map";
import { IScrollEvent } from "src/base/common/scrollable";
import { ITreeCollapseStateChangeEvent, ITreeMouseEvent, ITreeNode, ITreeNodeItem, ITreeSpliceEvent } from "src/base/browser/secondary/tree/tree";
import { AsyncMultiTreeModel, IAsyncMultiTreeModel } from "src/base/browser/secondary/tree/asyncMultiTreeModel";
import { Iterable } from "src/base/common/util/iterable";
import { ITreeModelSpliceOptions } from "src/base/browser/secondary/tree/indexTreeModel";
import { Pair } from "src/base/common/util/type";
import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { ITraitChangeEvent } from "src/base/browser/secondary/listWidget/listWidget";
import { IStandardKeyboardEvent } from "src/base/common/keyboard";

/**
 * Provides functionality to determine the children stat of the given data.
 */
export interface IAsyncChildrenProvider<T> {

    /**
     * @description Check if the given data has children.
     */
    hasChildren(data: T): boolean;

    /**
     * @description Get the children from the given data.
     */
    getChildren(data: T): T[] | Promise<T[]>;

    /**
     * @description Determines if the given data should be collapsed when 
     * constructing.
     * @note This has higher priority than {@link IAsyncMultiTreeOptions.collapseByDefault}
     * which will only be applied when the function is not defined.
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

    /** If the node could has children. */
    couldHasChildren: boolean;

    /** Determines if the current node is during the refreshing. */
    refreshing: Promise<void> | null;

    /** 
     * If the node should be collapsed by default. If undefined, the state will
     * determined by the {@link IMultiTree}.
     * @default undefined
     */
    collapsed: boolean | undefined;
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
    
    // REVIEW: @memoize?
    get children(): ITreeNode<T, TFilter>[] { return this._node.children.map(child => new AsyncNodeConverter(child)); }
    get visibleNodeCount(): number { return this._node.visibleNodeCount; }
    get depth(): number { return this._node.depth; }
    get visible(): boolean { return this._node.visible; }
    get collapsible(): boolean { return this._node.collapsible; }
    get collapsed(): boolean { return this._node.collapsed; }

}

/**
 * @class A wrapper class to convert a basic {@link IListDragAndDropProvider<T>}
 * to {@link IListDragAndDropProvider<IAsyncTreeNode<T>>}.
 */
class __AsyncMultiTreeDragAndDropProvider<T> implements IListDragAndDropProvider<IAsyncTreeNode<T>> {

    constructor(
        private readonly dnd: IListDragAndDropProvider<T>
    ) {}

    public getDragData(node: IAsyncTreeNode<T>): string | null {
        return this.dnd.getDragData(node.data);
    }

    public getDragTag(items: IAsyncTreeNode<T>[]): string {
        return this.dnd.getDragTag(items.map(item => item.data));
    }

    public onDragStart(event: DragEvent): void {
        if (this.dnd.onDragStart) {
            this.dnd.onDragStart(event);
        }
    }

    public onDragOver(event: DragEvent, currentDragItems: IAsyncTreeNode<T>[], targetOver?: IAsyncTreeNode<T>, targetIndex?: number): boolean {
        if (this.dnd.onDragOver) {
            return this.dnd.onDragOver(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
        return false;
    }

    public onDragEnter(event: DragEvent, currentDragItems: IAsyncTreeNode<T>[], targetOver?: IAsyncTreeNode<T>, targetIndex?: number): void {
        if (this.dnd.onDragEnter) {
            return this.dnd.onDragEnter(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
    }

    public onDragLeave(event: DragEvent, currentDragItems: IAsyncTreeNode<T>[], targetOver?: IAsyncTreeNode<T>, targetIndex?: number): void {
        if (this.dnd.onDragLeave) {
            return this.dnd.onDragLeave(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
    }
    public onDragDrop(event: DragEvent, currentDragItems: IAsyncTreeNode<T>[], targetOver?: IAsyncTreeNode<T>, targetIndex?: number): void {
        if (this.dnd.onDragDrop) {
            return this.dnd.onDragDrop(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
    }

    public onDragEnd(event: DragEvent): void {
        if (this.dnd.onDragEnd) {
            return this.dnd.onDragEnd(event);
        }
    }
}

/**
 * Only interface for {@link AsyncMultiTree}.
 */
export interface IAsyncMultiTree<T, TFilter> {

    /**
     * The container of the whole tree.
     */
    readonly DOMElement: HTMLElement;

    // [event]
    
    /**
     * Events when tree splice happened.
     */
    get onDidSplice(): Register<ITreeSpliceEvent<T | null, TFilter>>;

    /**
     * Fires when the tree node collapse state changed.
     */
    get onDidChangeCollapseState(): Register<ITreeCollapseStateChangeEvent<T | null, TFilter>>;

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
     * Fires when the {@link IAsyncMultiTree} is keydowned.
     */
    get onKeydown(): Register<IStandardKeyboardEvent>;
    
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
 * Different from {@link IMultiTree} and any other tree-like structures, the
 * children of each node is NOT decided by the caller, instead, caller needs to 
 * provide a {@link IAsyncChildrenProvider} which has the ability to determine 
 * the children of each node.
 * 
 * Since the caller cannot decide the structure of the tree, once the root data 
 * is given, the {@link AsyncMultiTree} will build the whole tree under the
 * provided {@link IAsyncChildrenProvider}, and the whole process is implemented
 * asynchronously.
 * 
 * @note RootData is not counted as the part of the tree.
 * @note Constructor is protected, use {@link AsyncMultiTree.create} instead.
 * @note The tree will refresh automatically once the collapse state of the node
 * is changed.
 */
export class AsyncMultiTree<T, TFilter = void> implements IAsyncMultiTree<T, TFilter>, IDisposable {

    // [field]

    protected readonly _disposables: DisposableManager;

    protected readonly _tree: IMultiTree<IAsyncTreeNode<T>, TFilter>;
    protected readonly _model: IAsyncMultiTreeModel<T, TFilter>;

    private _onDidCreateNode?: (node: ITreeNode<IAsyncTreeNode<T>, TFilter>) => void;
    private _onDidDeleteNode?: (node: ITreeNode<IAsyncTreeNode<T>, TFilter>) => void;
    
    // [constructor]

    protected constructor(
        container: HTMLElement,
        rootData: T,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        childrenProvider: IAsyncChildrenProvider<T>,
        opts: IAsyncMultiTreeOptions<T, TFilter> = {},
    ) {
        this._disposables = new DisposableManager();

        const unwrapper: AsyncWeakMap<T, TFilter> = new Weakmap(node => new AsyncNodeConverter(node));

        this._tree = this.__createTree(container, renderers, itemProvider, unwrapper, opts);
        this._model = this.__createModel(rootData, this._tree, childrenProvider, unwrapper);

        // update options
        
        this._onDidCreateNode = opts.onDidCreateNode;
        this._onDidDeleteNode = opts.onDidDeleteNode;

        // presetting behaviours on collapse state change
        this._disposables.register(this._tree.onDidChangeCollapseState(e => this.__internalOnDidChangeCollapseState(e)));
    }

    // [static method]

    /**
     * @description Creates an instance of {@link AsyncMultiTree}. The only 
     * difference is that the method will call the `refresh()` immediately.
     */
    public static create<T = any, TFilter = void>(
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

    get onDidSplice(): Register<ITreeSpliceEvent<T | null, TFilter>> { return Event.map(this._model.onDidSplice, e => this.__toTreeSpliceEvent(e)); }
    get onDidChangeCollapseState(): Register<ITreeCollapseStateChangeEvent<T | null, TFilter>> { return Event.map(this._model.onDidChangeCollapseState, e => this.__toTreeChangeCollapseEvent(e)); }

    get onDidScroll(): Register<IScrollEvent> { return this._tree.onDidScroll; }
    get onDidChangeFocus(): Register<boolean> { return this._tree.onDidChangeFocus; }
    get onDidChangeItemFocus(): Register<ITraitChangeEvent> { return this._tree.onDidChangeItemFocus; }
    get onDidChangeItemSelection(): Register<ITraitChangeEvent> { return this._tree.onDidChangeItemSelection; }
    
    get onClick(): Register<ITreeMouseEvent<T>> { return Event.map(this._tree.onClick, this.__toTreeMouseEvent); }
    get onDoubleclick(): Register<ITreeMouseEvent<T>> { return Event.map(this._tree.onDoubleclick, this.__toTreeMouseEvent); }
    
    get onKeydown(): Register<IStandardKeyboardEvent> { return this._tree.onKeydown; }

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

    public async expand(data: T, recursive: boolean): Promise<boolean> {

        const root = this._model.getRootAsyncNode();
        if (root.refreshing) {
            await root.refreshing;
        }
        
        const node = this._model.getAsyncNode(data);
        if (this._tree.hasNode(node) && this._tree.isCollapsible(node) === false) {
            return false;
        }

        if (node.refreshing) {
            await node.refreshing;
        }

        if (node !== root && !node.refreshing && !this._tree.isCollapsed(node)) {
            return false;
        }

        const successOrNot = this._model.setCollapsed(data, false, recursive);
        if (node.refreshing) {
            await node.refreshing;
        }

        return successOrNot;
    }

    public async toggleCollapseOrExpand(data: T, recursive: boolean): Promise<boolean> {
        const root = this._model.getRootAsyncNode();

        if (root.refreshing) {
            await root.refreshing;
        }
        
        const node = this._model.getAsyncNode(data);
        if (this._tree.hasNode(node) && this._tree.isCollapsible(node) === false) {
            return false;
        }

        if (node.refreshing) {
            await node.refreshing;
        }

        const successOrNot = this._tree.toggleCollapseOrExpand(node === root ? null : node, recursive);
        if (node.refreshing) {
            await node.refreshing;
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
        this._tree.setAnchor(this._model.getAsyncNode(item));
    }

    public getAnchor(): T | null {
        const node = this._tree.getAnchor();
        return node ? node.data : null;
    }

    public setFocus(item: T): void {
        this._tree.setFocus(this._model.getAsyncNode(item));
    }

    public getFocus(): T | null {
        const node = this._tree.getFocus();
        return node ? node.data : null;
    }

    public setSelections(items: T[]): void {
        this._tree.setSelections(items.map(node => this._model.getAsyncNode(node)));
    }

    public getSelections(): T[] {
        return this._tree.getSelections().map(node => node!.data);
    }

    public setDomFocus(): void {
        this._tree.setDomFocus();
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
        unwrapper: AsyncWeakMap<T, TFilter>,
        opts: IAsyncMultiTreeOptions<T, TFilter>
    ): MultiTree<IAsyncTreeNode<T>, TFilter> 
    {
        // convert the arguments into correct type (wrappers kind of stuff)
        const asyncRenderers = renderers.map(r => new AsyncTreeRenderer(r, unwrapper));
        const asyncProvider = new composedItemProvider<T, IAsyncTreeNode<T>>(itemProvider);

        return new MultiTree<IAsyncTreeNode<T>, TFilter>(container, asyncRenderers, asyncProvider, {
            collapseByDefault: opts.collapseByDefault ?? true,
            dnd: opts.dnd && new __AsyncMultiTreeDragAndDropProvider(opts.dnd)
        });
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
     * @description Presets the behaviours when the collapsing state inside the
     * {@link MultiTree} is changed.
     */
    private __internalOnDidChangeCollapseState(e: ITreeCollapseStateChangeEvent<IAsyncTreeNode<T> | null, TFilter>): void {
        
        const node: ITreeNode<IAsyncTreeNode<T> | null, TFilter> = e.node;
        if (node.data === null) {
            return;
        }

        // refresh the given node and its descendants
        this._model.refreshNode(node.data).then(() => this.__render(node.data!));
    }

    /**
     * @description Given the {@link IAsyncTreeNode}, converts it recursively 
     * into a {@link ITreeNodeItem}.
     * @param node The provided async tree node.
     */
    private __toTreeNodeItem(node: IAsyncTreeNode<T>): ITreeNodeItem<IAsyncTreeNode<T>> {    
        
        const collapsible = node.couldHasChildren;
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
            browserEvent: event.browserEvent,
            data: event.data && event.data.data,
            parent: event.parent?.data || null,
            children: event.children ? event.children.map(child => child!.data) : null,
            depth: event.depth
        };
    }

    /**
     * @description Recursively converts {@link ITreeNode<IAsyncTreeNode<T>>} to
     * {@link ITreeNode<T>}.
     * @param node The provided node.
     */
    private __unwrapAsyncTreeNode(node: ITreeNode<IAsyncTreeNode<T> | null, TFilter>): ITreeNode<T | null, TFilter> {
        return {
            data: node.data!.data,
            depth: node.depth,
            collapsed: node.collapsed,
            collapsible: node.collapsible,
            visible: node.visible,
            visibleNodeCount: node.visibleNodeCount,
            parent: this.__unwrapAsyncTreeNode(node.parent!),
            children: node.children.map(child => this.__unwrapAsyncTreeNode(child)),
        };
    }

    // REVIEW: this causes recursively converting, prob a pref issue
    private __toTreeSpliceEvent(event: ITreeSpliceEvent<IAsyncTreeNode<T> | null, TFilter>): ITreeSpliceEvent<T | null, TFilter> {
        return {
            deleted: event.deleted.map(node => this.__unwrapAsyncTreeNode(node)),
            inserted: event.inserted.map(node => this.__unwrapAsyncTreeNode(node))
        };
    }

    // REVIEW: this causes recursively converting, prob a pref issue
    private __toTreeChangeCollapseEvent(event: ITreeCollapseStateChangeEvent<IAsyncTreeNode<T> | null, TFilter>): ITreeCollapseStateChangeEvent<T | null, TFilter> {
        return {
            node: this.__unwrapAsyncTreeNode(event.node)
        };
    }
    
}
