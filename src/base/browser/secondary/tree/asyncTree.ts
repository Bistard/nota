import { composedItemProvider, IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListWidget, ITraitChangeEvent } from "src/base/browser/secondary/listWidget/listWidget";
import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { AsyncTreeModel, IChildrenProvider, IAsyncTreeModel } from "src/base/browser/secondary/tree/asyncTreeModel";
import { AsyncTreeRenderer } from "src/base/browser/secondary/tree/asyncTreeRenderer";
import { IMultiTreeOptions, MultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeNode, ITreeModel, ITreeCollapseStateChangeEvent, ITreeMouseEvent, ITreeTouchEvent, ITreeContextmenuEvent, ITreeSpliceEvent } from "src/base/browser/secondary/tree/tree";
import { ITreeFilterProvider, ITreeFilterResult } from "src/base/browser/secondary/tree/treeFilter";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { Disposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { Event, Register } from "src/base/common/event";
import { IStandardKeyboardEvent } from "src/base/common/keyboard";
import { IScrollEvent } from "src/base/common/scrollable";
import { Weakmap } from "src/base/common/util/map";

/**
 * @internal
 * The internal tree node structure that wraps each client data inside the 
 * {@link AsyncTree}.
 */
export interface IAsyncNode<T> {
    /** The client-data. */
    data: T;

    /** If the node could has children. */
    couldHasChildren: boolean;

    /** Determines if the current node is during the refreshing. */
    refreshing: Promise<void> | null;
}

/**
 * @internal
 * Works similar to {@link ITreeNodeItem}.
 */
export interface AsyncTreeItem<T, TFilter> extends Omit<Partial<ITreeNode<T, TFilter>>, 'children' | 'parent'> {
    
    /** The client-data. */
    data: T;

    /** The parent of the tree node. */
    parent: AsyncTreeItem<T, TFilter> | null;
    
    /** The childrens of the tree node. */
    children: AsyncTreeItem<T, TFilter>[];
}

//#region type converter

/**
 * @internal
 * See `@implements` part from {@link IAsyncTreeOptions}.
 */
class __AsyncFilter<T, TFilter> implements ITreeFilterProvider<IAsyncNode<T>, TFilter> {

    constructor(
        private readonly _filter: ITreeFilterProvider<T, TFilter>
    ) {}

    public filter(item: IAsyncNode<T>): ITreeFilterResult<TFilter> {
        return this._filter.filter(item.data);
    }
}

/**
 * @internal
 * See `@implements` part from {@link IAsyncTreeOptions}.
 */
class __AsyncDragAndDropProvider<T> implements IListDragAndDropProvider<IAsyncNode<T>> {

    constructor(
        private readonly dnd: IListDragAndDropProvider<T>
    ) {}

    public getDragData(node: IAsyncNode<T>): string | null {
        return this.dnd.getDragData(node.data);
    }

    public getDragTag(items: IAsyncNode<T>[]): string {
        return this.dnd.getDragTag(items.map(item => item.data));
    }

    public onDragStart(event: DragEvent): void {
        if (this.dnd.onDragStart) {
            this.dnd.onDragStart(event);
        }
    }

    public onDragOver(event: DragEvent, currentDragItems: IAsyncNode<T>[], targetOver?: IAsyncNode<T>, targetIndex?: number): boolean {
        if (this.dnd.onDragOver) {
            return this.dnd.onDragOver(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
        return false;
    }

    public onDragEnter(event: DragEvent, currentDragItems: IAsyncNode<T>[], targetOver?: IAsyncNode<T>, targetIndex?: number): void {
        if (this.dnd.onDragEnter) {
            return this.dnd.onDragEnter(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
    }

    public onDragLeave(event: DragEvent, currentDragItems: IAsyncNode<T>[], targetOver?: IAsyncNode<T>, targetIndex?: number): void {
        if (this.dnd.onDragLeave) {
            return this.dnd.onDragLeave(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
    }
    public onDragDrop(event: DragEvent, currentDragItems: IAsyncNode<T>[], targetOver?: IAsyncNode<T>, targetIndex?: number): void {
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

/** @internal */
type AsyncWeakMap<T, TFilter> = Weakmap<ITreeNode<IAsyncNode<T>, TFilter>, ITreeNode<T, TFilter>>;

/**
 * @internal
 * See `@implements` part from {@link IAsyncTreeOptions}.
 */
class __AsyncNodeConverter<T, TFilter> implements ITreeNode<T, TFilter> {

    constructor(private readonly _node: ITreeNode<IAsyncNode<T>, TFilter>) {}

    get data(): T { return this._node.data!.data; }
    get parent(): ITreeNode<T, TFilter> | null { return this._node.parent?.data ? new __AsyncNodeConverter(this._node.parent) : null; }
    // REVIEW: @memoize?
    get children(): ITreeNode<T, TFilter>[] { return this._node.children.map(child => new __AsyncNodeConverter(child)); }
    get visibleNodeCount(): number { return this._node.visibleNodeCount; }
    get depth(): number { return this._node.depth; }
    get visible(): boolean { return this._node.visible; }
    get collapsible(): boolean { return this._node.collapsible; }
    get collapsed(): boolean { return this._node.collapsed; }
}

//#endregion

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
export interface IAsyncTreeOptions<T, TFilter> extends Omit<IMultiTreeOptions<IAsyncNode<T>, TFilter>, 'filter' | 'dnd'> {
    
    /**
     * Provides functionality to determine the children stat of the given data.
     */
    readonly childrenProvider: IChildrenProvider<T>;
    
    readonly filter?: ITreeFilterProvider<T, TFilter>;
    readonly dnd?: IListDragAndDropProvider<T>;
    onDidCreateNode?: (node: ITreeNode<T, TFilter>) => void;
    onDidDeleteNode?: (node: ITreeNode<T, TFilter>) => void;
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
class AsyncMultiTree<T, TFilter> extends MultiTree<IAsyncNode<T>, TFilter> {

    declare protected readonly _model: IAsyncTreeModel<T, TFilter>;
    private readonly _childrenProvider: IChildrenProvider<T>;

    // [constructor]

    constructor(
        container: HTMLElement,
        rootData: T,
        nodeConverter: AsyncWeakMap<T, TFilter>,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IAsyncTreeOptions<T, TFilter>
    ) {
        const multiTreeOpts = 
        {
            dnd: opts.dnd && new __AsyncDragAndDropProvider(opts.dnd),
            filter: opts.filter && new __AsyncFilter(opts.filter),
            childrenProvider: opts.childrenProvider,
        };

        const rootNode = {
            data: rootData,
            couldHasChildren: true,
            refreshing: null,
        };
        const asyncRenderers = renderers.map(r => new AsyncTreeRenderer(r, nodeConverter));
        const asyncProvider = new composedItemProvider<T, IAsyncNode<T>>(itemProvider);

        super(container, rootNode, asyncRenderers, asyncProvider, multiTreeOpts);
        this._childrenProvider = opts.childrenProvider;
    }

    // [protected override method]

    protected override createModel(
        rootData: IAsyncNode<T>, 
        view: IListWidget<ITreeNode<IAsyncNode<T>, TFilter>>, 
        opts: IMultiTreeOptions<IAsyncNode<T>, TFilter>,
        ): ITreeModel<IAsyncNode<T>, TFilter, IAsyncNode<T>> 
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
        return this.rootNode.data.data;
    }

    get rootNode(): ITreeNode<IAsyncNode<T>, TFilter> {
        return this._model.getRoot();
    }

    // [public methods]

    public getAsyncNode(data: T): IAsyncNode<T> {
        return this._model.getAsyncNode(data);
    }

    public refreshNode(node: ITreeNode<IAsyncNode<T>, TFilter>): Promise<void> {
        return this._model.refreshNode(node);
    }

    public shouldRefreshNodeWhenExpand(node: IAsyncNode<T>): boolean {
        if (this._childrenProvider.shouldRefreshChildren) {
            return this._childrenProvider.shouldRefreshChildren(node.data);
        }
        return true;
    }

    public setCollapsed(node: IAsyncNode<T>, collapsed?: boolean, recursive?: boolean): boolean {
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
 * and the reason for this is to avoid same property names.
 * 
 * The idea of {@link AsyncTree} is inspired by a class named `AsyncDataTree` in
 * Visual Studio Code. They maintains two isomorphismic tree structures to avoid 
 * excessive rerendering. The {@link AsyncTree} goes one step further, it 
 * elimates another tree structure which causes less memory usage and a little 
 * faster.
 */
export class AsyncTree<T, TFilter> extends Disposable implements IAsyncTree<T, TFilter> {

    // [field]

    private readonly _tree: AsyncMultiTree<T, TFilter>;

    private readonly _nodeConverter: AsyncWeakMap<T, TFilter>;

    private _onDidCreateNode?: (node: ITreeNode<IAsyncNode<T>, TFilter>) => void;
    private _onDidDeleteNode?: (node: ITreeNode<IAsyncNode<T>, TFilter>) => void;

    // [constructor]

    constructor(
        container: HTMLElement,
        rootData: T,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IAsyncTreeOptions<T, TFilter>,
    ) {
        super();
        
        this._nodeConverter = new Weakmap(node => new __AsyncNodeConverter(node));
        this._tree = new AsyncMultiTree(
            container, 
            rootData,
            this._nodeConverter,
            renderers, 
            itemProvider, 
            opts,
        );

        if (opts.onDidCreateNode) {
            this._onDidCreateNode = asyncNode => opts.onDidCreateNode!(this._nodeConverter.map(asyncNode));
        }
        if (opts.onDidDeleteNode) {
            this._onDidDeleteNode = asyncNode => opts.onDidDeleteNode!(this._nodeConverter.map(asyncNode));
        }

        // presetting behaviours on collapse state change
        this.__register(this._tree.onDidChangeCollapseState(e => this.__internalOnDidChangeCollapseState(e)));
    }

    // [event]

    get onDidSplice(): Register<ITreeSpliceEvent<T, TFilter>> { return Event.map(this._tree.onDidSplice, e => this.__toTreeSpliceEvent(e)); }
    get onDidChangeCollapseState(): Register<ITreeCollapseStateChangeEvent<T, TFilter>> { return Event.map(this._tree.onDidChangeCollapseState, e => this.__toTreeChangeCollapseEvent(e)); }

    get onDidScroll(): Register<IScrollEvent> { return this._tree.onDidScroll; }
    get onDidChangeFocus(): Register<boolean> { return this._tree.onDidChangeFocus; }
    get onDidChangeItemFocus(): Register<ITraitChangeEvent> { return this._tree.onDidChangeItemFocus; }
    get onDidChangeItemSelection(): Register<ITraitChangeEvent> { return this._tree.onDidChangeItemSelection; }
    
    get onClick(): Register<ITreeMouseEvent<T>> { return Event.map(this._tree.onClick, this.__toTreeMouseEvent); }
    get onDoubleclick(): Register<ITreeMouseEvent<T>> { return Event.map(this._tree.onDoubleclick, this.__toTreeMouseEvent); }
    
    get onTouchstart(): Register<ITreeTouchEvent<T>> { return Event.map(this._tree.onTouchstart, this.__toTreeTouchEvent); }
    get onKeydown(): Register<IStandardKeyboardEvent> { return this._tree.onKeydown; }
    get onKeyup(): Register<IStandardKeyboardEvent> { return this._tree.onKeyup; }
    get onKeypress(): Register<IStandardKeyboardEvent> { return this._tree.onKeypress; }
    get onContextmenu(): Register<ITreeContextmenuEvent<T>> { return Event.map(this._tree.onContextmenu, this.__toTreeContextmenuEvent); }

    // [getter]

    get DOMElement(): HTMLElement { return this._tree.DOMElement; }

    get root(): T { return this._tree.root; }

    // [public methods]

    public async refresh(data: T = this._tree.root): Promise<void> {
        
        const asyncNode = this._tree.getAsyncNode(data);
        const node = this._tree.getNode(asyncNode);

        // wait until nothing is refreshing
        if (asyncNode.refreshing) {
            await asyncNode.refreshing;
        }

        // wait until refreshing the node and its descendants
        await this._tree.refreshNode(node);

        // renders the whole view
        this.__render(node);
    }

    public filter(visibleOnly?: boolean): void {
        this._tree.filter(visibleOnly);
    }

    public getNode(data: T): ITreeNode<T, TFilter> {
        const asyncNode = this._tree.getAsyncNode(data);
        return this._nodeConverter.map(this._tree.getNode(asyncNode));
    }

    public hasNode(data: T): boolean {
        const asyncNode = this._tree.getAsyncNode(data);
        return this._tree.hasNode(asyncNode);
    }

    public isCollapsible(data: T): boolean {
        const asyncNode = this._tree.getAsyncNode(data);
        return this._tree.isCollapsible(asyncNode);
    }

    public isCollapsed(data: T): boolean {
        const asyncNode = this._tree.getAsyncNode(data);
        return this._tree.isCollapsed(asyncNode);
    }

    public collapse(data: T, recursive: boolean): boolean {
        const asyncNode = this._tree.getAsyncNode(data);
        return this._tree.setCollapsed(asyncNode, true, recursive);
    }

    public async expand(data: T, recursive: boolean): Promise<boolean> {

        const root = this._tree.rootNode.data;
        if (root.refreshing) {
            await root.refreshing;
        }
        
        const node = this._tree.getAsyncNode(data);
        if (this._tree.hasNode(node) && this._tree.isCollapsible(node) === false) {
            return false;
        }

        if (node.refreshing) {
            await node.refreshing;
        }

        if (node !== root && !node.refreshing && !this._tree.isCollapsed(node)) {
            return false;
        }

        const asyncNode = this._tree.getAsyncNode(data);
        const successOrNot = this._tree.setCollapsed(asyncNode, false, recursive);
        if (node.refreshing) {
            await node.refreshing;
        }

        return successOrNot;
    }

    public async toggleCollapseOrExpand(data: T, recursive: boolean): Promise<boolean> {
        const root = this._tree.rootNode.data;

        if (root.refreshing) {
            await root.refreshing;
        }
        
        const node = this._tree.getAsyncNode(data);
        if (this._tree.hasNode(node) && this._tree.isCollapsible(node) === false) {
            return false;
        }

        if (node.refreshing) {
            await node.refreshing;
        }

        const successOrNot = this._tree.toggleCollapseOrExpand(node, recursive);
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
        this._tree.setAnchor(this._tree.getAsyncNode(item));
    }

    public getAnchor(): T | null {
        const node = this._tree.getAnchor();
        return node ? node.data : null;
    }

    public setFocus(item: T): void {
        this._tree.setFocus(this._tree.getAsyncNode(item));
    }

    public getFocus(): T | null {
        const node = this._tree.getFocus();
        return node ? node.data : null;
    }

    public setSelections(items: T[]): void {
        this._tree.setSelections(items.map(node => this._tree.getAsyncNode(node)));
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
        const asyncNode = this._tree.getAsyncNode(data);
        this._tree.rerender(asyncNode);
    }

    public size(): number {
        return this._tree.size();
    }

    // [private helper methods]

    private __render(node: ITreeNode<IAsyncNode<T>, TFilter>): void {
        this._tree.splice(
            node.data, 
            node.children, 
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
    private async __internalOnDidChangeCollapseState(e: ITreeCollapseStateChangeEvent<IAsyncNode<T>, TFilter>): Promise<void> {
        
        const node: ITreeNode<IAsyncNode<T>, TFilter> = e.node;
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

    /**
     * @description Converts the event with type {@link ITreeMouseEvent<IAsyncNode<T>>}
     * to {@link ITreeMouseEvent<T>}.
     */
    private __toTreeMouseEvent(event: ITreeMouseEvent<IAsyncNode<T>>): ITreeMouseEvent<T> {
        return {
            browserEvent: event.browserEvent,
            data: event.data && event.data.data,
            parent: event.parent?.data || null,
            children: event.children ? event.children.map(child => child.data) : null,
            depth: event.depth
        };
    }

    private __toTreeTouchEvent(event: ITreeTouchEvent<IAsyncNode<T>>): ITreeTouchEvent<T> {
        return {
            browserEvent: event.browserEvent,
            data: event.data && event.data.data,
            parent: event.parent?.data || null,
            children: event.children ? event.children.map(child => child.data) : null,
            depth: event.depth
        };
    }

    private __toTreeContextmenuEvent(event: ITreeContextmenuEvent<IAsyncNode<T>>): ITreeContextmenuEvent<T> {
        return {
            browserEvent: event.browserEvent,
            data: event.data && event.data.data,
            parent: event.parent?.data || null,
            children: event.children ? event.children.map(child => child.data) : null,
            depth: event.depth,
            position: event.position,
            target: event.target
        };
    }

    /**
     * @description Recursively converts {@link ITreeNode<IAsyncNode<T>>} to
     * {@link ITreeNode<T>}.
     * @param node The provided node.
     */
    private __unwrapAsyncTreeNode(node: ITreeNode<IAsyncNode<T>, TFilter>): ITreeNode<T, TFilter> {
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
    private __toTreeSpliceEvent(event: ITreeSpliceEvent<IAsyncNode<T>, TFilter>): ITreeSpliceEvent<T, TFilter> {
        return {
            deleted: event.deleted.map(node => this.__unwrapAsyncTreeNode(node)),
            inserted: event.inserted.map(node => this.__unwrapAsyncTreeNode(node))
        };
    }

    // REVIEW: this causes recursively converting, prob a pref issue
    private __toTreeChangeCollapseEvent(event: ITreeCollapseStateChangeEvent<IAsyncNode<T>, TFilter>): ITreeCollapseStateChangeEvent<T, TFilter> {
        return {
            node: this.__unwrapAsyncTreeNode(event.node)
        };
    }
}
