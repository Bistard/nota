import { ITreeCollapseStateChangeEvent, ITreeContextmenuEvent, ITreeModel, ITreeMouseEvent, ITreeNode, ITreeSpliceEvent, ITreeTouchEvent } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer, TreeItemRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { IListItemProvider, TreeListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListContextmenuEvent, IListMouseEvent, IListTouchEvent, IListWidget, IListWidgetOpts, ITraitChangeEvent, ListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { Event, Register, RelayEmitter } from "src/base/common/event";
import { ISpliceable } from "src/base/common/range";
import { IScrollEvent } from "src/base/common/scrollable";
import { IListViewRenderer } from "src/base/browser/secondary/listView/listRenderer";
import { IStandardKeyboardEvent } from "src/base/common/keyboard";
import { IIndexTreeModelOptions } from "src/base/browser/secondary/tree/indexTreeModel";
import { ListWidgetMouseController } from "src/base/browser/secondary/listWidget/listWidgetMouseController";
import { IIdentiityProivder } from "src/base/browser/secondary/tree/asyncTree";

/**
 * @internal
 */
class __TreeIdentityProvider<T, TFilter> implements IIdentiityProivder<ITreeNode<T, TFilter>> {

    constructor(private readonly identityProvider: IIdentiityProivder<T>) {}

    getID(node: ITreeNode<T, TFilter>): string {
        return this.identityProvider.getID(node.data);
    }
}

/**
 * @internal
 * @class A wrapper class to convert a basic {@link IListDragAndDropProvider<T>}
 * to {@link IListDragAndDropProvider<ITreeNode<T>>}.
 */
class __TreeListDragAndDropProvider<T, TFilter> implements IListDragAndDropProvider<ITreeNode<T, TFilter>> {

    constructor(
        private readonly dnd: IListDragAndDropProvider<T>
    ) {}

    public getDragData(node: ITreeNode<T, TFilter>): string | null {
        return this.dnd.getDragData(node.data);
    }

    public getDragTag(items: ITreeNode<T, TFilter>[]): string {
        return this.dnd.getDragTag(items.map(item => item.data));
    }

    public onDragStart(event: DragEvent): void {
        if (this.dnd.onDragStart) {
            this.dnd.onDragStart(event);
        }
    }

    public onDragOver(event: DragEvent, currentDragItems: ITreeNode<T, TFilter>[], targetOver?: ITreeNode<T, TFilter>, targetIndex?: number): boolean {
        if (this.dnd.onDragOver) {
            return this.dnd.onDragOver(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
        return false;
    }

    public onDragEnter(event: DragEvent, currentDragItems: ITreeNode<T, TFilter>[], targetOver?: ITreeNode<T, TFilter>, targetIndex?: number): void {
        if (this.dnd.onDragEnter) {
            return this.dnd.onDragEnter(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
    }

    public onDragLeave(event: DragEvent, currentDragItems: ITreeNode<T, TFilter>[], targetOver?: ITreeNode<T, TFilter>, targetIndex?: number): void {
        if (this.dnd.onDragLeave) {
            return this.dnd.onDragLeave(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
    }
    public onDragDrop(event: DragEvent, currentDragItems: ITreeNode<T, TFilter>[], targetOver?: ITreeNode<T, TFilter>, targetIndex?: number): void {
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
 * @internal
 * @class Similar to the {@link __ListTrait} in the {@link ListWidget}. The trait
 * concept need to be exist at the tree level, since the list view does not know
 * the existance of the collapsed tree nodes.
 * 
 * T: The type of data in {@link AbstractTree}.
 * `trait` does not care about TFilter type.
 */
class TreeTrait<T> {

    // [field]

    private _nodes = new Set<ITreeNode<T, any>>();
    private _nodesDataCache?: T[];

    // [constructor]

    constructor() {}

    // [public methods]

    public set(nodes: ITreeNode<T, any>[]): void {
        this._nodesDataCache = undefined;
        this._nodes = new Set();
        
        for (const node of nodes) {
            this._nodes.add(node);
        }
    }

    public get(): T[] {
        if (!this._nodesDataCache) {
            let cache: T[] = [];
            this._nodes.forEach(node => cache.push(node.data));
            this._nodesDataCache = cache;
        }
        return this._nodesDataCache;
    }

    public has(nodes: ITreeNode<T, any>): boolean {
        return this._nodes.has(nodes);
    }

    public onDidSplice(event: ITreeSpliceEvent<T, any>, identityProvider?: IIdentiityProivder<T>): void {
        
        /**
         * Since the tree cannot decide the ID of each node, thus it cannot
         * determine if any nodes are re-inserted. We clean all the current 
         * traits.
         */
        if (!identityProvider) {
            this._nodesDataCache = undefined;
            this._nodes.clear();
            return;
        }

        /**
         * Use identity provider to keep any existed nodes if they are 
         * re-inserted.
         */

        const insertedIDs = new Map<string, ITreeNode<T, any>>();
        const dfsNode = function (node: ITreeNode<T, any>) {
            insertedIDs.set(identityProvider.getID(node.data), node);
            node.children.forEach(child => dfsNode(child));
        };
        event.inserted.forEach(inserted => dfsNode(inserted));

        const currNodes: ITreeNode<T, any>[] = [];
        for (const orginal of this._nodes) {
            const id = identityProvider.getID(orginal.data);
            const inserted = insertedIDs.get(id);
            
            // keep the updated trait if the trait still existed after updated.
            if (inserted) {
                currNodes.push(inserted);
            }
        }

        // update the current traits
        this.set(currNodes);
    }
}

/**
 * @internal
 * @class An internal tree-level mouse controller that overrides some behaviours 
 * on the list-level.
 * 
 * Since the collapsing status is only known by the tree-level, we need to override
 * the behaviours of the list-level mouse controller to achieve customization.
 */
class TreeWidgetMouseController<T, TFilter, TRef> extends ListWidgetMouseController<ITreeNode<T, TFilter>> {

    private readonly _tree: IAbstractTree<T, TFilter, TRef>;

    constructor(
        view: IListWidget<ITreeNode<T, TFilter>>,
        opts: ITreeWidgetOpts<T, TFilter, TRef>
    ) {
        super(view, opts);
        this._tree = opts.tree;
    }

    protected override __onMouseClick(e: IListMouseEvent<ITreeNode<T, TFilter>>): void {
        
        if (this.__ifSupported(e) === false) {
            return;
        }

        const node = e.item;
        if (!node) {
            // clicks nowhere, we do the normal click
            return super.__onMouseClick(e);
        }

        if (this.__isSelectingInRangeEvent(e) || this.__isSelectingInSingleEvent(e)) {
            // normal click during multi-selecting
            return super.__onMouseClick(e);
        }

        /**
         * Otherwise, this is considered as a normal click. We toggle the 
         * collapse state of the clicked node. This is a presetting behaviour.
         */
        if (node.collapsible) {
            const location = this._tree.getNodeLocation(node);
            
            /**
             * Traits indice will be invalid after the actual list structure 
             * changed. They must be set first.
             */
            this._tree.setFocus(location);
            this._tree.setSelections([location]);

            this._tree.toggleCollapseOrExpand(location, e.browserEvent.altKey);
        }

        // the rest work
        super.__onMouseClick(e);
    }
}

/**
 * An option for constructing a {@link TreeWidget}.
 */
export interface ITreeWidgetOpts<T, TFilter, TRef> extends IListWidgetOpts<ITreeNode<T, TFilter>> {
    /**
     * The tree that inherits {@link AbstractTree} and controls the widget.
     */
    readonly tree: IAbstractTree<T, TFilter, TRef>;

    readonly extraArguments: any[];
}

/**
 * @internal
 * @class A simple wrapper class for {@link IListWidget} which converts the type
 * T to ITreeNode<T>. In addtional, you may override this class to customize
 * different controller behaviours.
 */
export class TreeWidget<T, TFilter, TRef> extends ListWidget<ITreeNode<T, TFilter>> {

    // [field]

    private readonly _selected: TreeTrait<T>; // user's selection
    private readonly _anchor: TreeTrait<T>;   // user's selection start
    private readonly _focused: TreeTrait<T>;  // user's selection end

    // [constructor]

    constructor(
        container: HTMLElement,
        renderers: IListViewRenderer<any, any>[],
        itemProvider: IListItemProvider<ITreeNode<T, TFilter>>,
        opts: ITreeWidgetOpts<T, TFilter, TRef>
    ) {
        super(container, renderers, itemProvider, opts);
        this._focused = new TreeTrait();
        this._anchor = new TreeTrait();
        this._selected = new TreeTrait();
    }

    // [public method]

    public override splice(index: number, deleteCount: number, items: ITreeNode<T, TFilter>[] = []): void {
        super.splice(index, deleteCount, items);

        if (!items.length && !deleteCount) {
            return;
        }

        let focusedIndex = -1;
        let anchorIndex = -1;
        const selectedIndex: number[] = [];

        /**
         * If the inserting item has trait attribute at the tree level, it 
         * should also has trait attribute at the list level.
         */
        for (let i = 0; i < items.length; i++) {
            const item = items[i]!;
            
            if (this._focused.has(item)) {
                focusedIndex = index + i;
            }

            if (this._anchor.has(item)) {
                anchorIndex = index + i;
            }

            if (this._selected.has(item)) {
                selectedIndex.push(index + i);
            }
        }

        /**
         * Update the trait attributes at the list level.
         */

        if (focusedIndex !== -1) {
            super.setFocus(focusedIndex);
        }

        if (anchorIndex !== -1) {
            super.setAnchor(anchorIndex);
        }

        if (selectedIndex.length > 0) {
            super.setSelections(selectedIndex);
        }
    }

    /**
     * @description Updates tree-level traits after each splice operation. Uses 
     * identity provider to determine if any existed nodes are re-inserted, if 
     * yes, keep the updated one in the tree-level.
     * @param e Event when the splice did happen.
     * @param identityProvider Optional provider to decide if any nodes with 
     * trait are re-inserted.
     */
    public onDidSplice(e: ITreeSpliceEvent<T, TFilter>, identityProvider?: IIdentiityProivder<T>): void {
        this._anchor.onDidSplice(e, identityProvider);
        this._focused.onDidSplice(e, identityProvider);
        this._selected.onDidSplice(e, identityProvider);
    }

    // [public override methods]

    public override setFocus(index: number | null): void {
        super.setFocus(index);
        this._focused.set(index !== null ? [this.getItem(index)] : []);
    }

    public override setAnchor(index: number | null): void {
        super.setAnchor(index);
        this._anchor.set(index !== null ? [this.getItem(index)] : []);
    }

    public override setSelections(indice: number[]): void {
        super.setSelections(indice);
        this._selected.set(indice.map(idx => this.getItem(idx)));
    }

    public getFocusData(): T | null {
        return this._focused.get()[0] ?? null;
    }

    public getAnchorData(): T | null {
        return this._anchor.get()[0] ?? null;
    }

    public getSelectionData(): T[] {
        return this._selected.get();
    }

    // [protected override methods]

    protected override __createMouseController(opts: ITreeWidgetOpts<T, TFilter, TRef>): ListWidgetMouseController<ITreeNode<T, TFilter>> {
        return new TreeWidgetMouseController(this, opts);
    }
}

/**
 * The interface only for {@link AbstractTree}.
 */
export interface IAbstractTree<T, TFilter, TRef> extends IDisposable {

    /**
     * The HTMLElement container of the tree.
     */
    readonly DOMElement: HTMLElement;

    /**
     * The viewport size of the tree in pixels.
     */
    readonly viewportHeight: number;

    /** 
     * The actual content size of the tree in pixels. 
     */
    readonly contentHeight: number;

    // [event]

    /**
     * Events when tree splice happened.
     */
    get onDidSplice(): Register<ITreeSpliceEvent<T, TFilter>>;

    /**
     * Fires when the tree node collapse state changed.
     */
    get onDidChangeCollapseState(): Register<ITreeCollapseStateChangeEvent<T, TFilter>>;

    /**
     * Fires when the {@link IAbstractTree} is scrolling.
     */
    get onDidScroll(): Register<IScrollEvent>;

    /**
     * Fires when the {@link IAbstractTree} itself is blured or focused.
     */
    get onDidChangeFocus(): Register<boolean>;

    /**
     * Fires when the focused tree nodes in the {@link IAbstractTree} is changed.
     */
    get onDidChangeItemFocus(): Register<ITraitChangeEvent>;

    /**
     * Fires when the selected tree nodes in the {@link IAbstractTree} is changed.
     */
    get onDidChangeItemSelection(): Register<ITraitChangeEvent>;

    /**
     * Fires when the tree node in the {@link IAbstractTree} is clicked.
     */
    get onClick(): Register<ITreeMouseEvent<T>>;
    
    /**
     * Fires when the tree node in the {@link IAbstractTree} is double clicked.
     */
    get onDoubleclick(): Register<ITreeMouseEvent<T>>;

    /** 
     * An event sent when the state of contacts with a touch-sensitive surface 
     * changes. This surface can be a touch screen or trackpad.
     */
    get onTouchstart(): Register<ITreeTouchEvent<T>>;

    /**
     * Fires when the {@link IAbstractTree} is keydown.
     */
    get onKeydown(): Register<IStandardKeyboardEvent>;

    /** 
     * Fires when the {@link IAbstractTree} is keyup. 
     */
    get onKeyup(): Register<IStandardKeyboardEvent>;

    /** 
     * Fires when the {@link IAbstractTree} is keypress. 
     */
    get onKeypress(): Register<IStandardKeyboardEvent>;

    /** 
     * Fires when the user attempts to open a context menu {@link IAbstractTree}. 
     * This event is typically triggered by:
     *      - clicking the right mouse button
     *      - pressing the context menu key
     *      - Shift F10
     */
    get onContextmenu(): Register<ITreeContextmenuEvent<T>>;

    // [method - general]

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
     * @description Filters the whole tree by the provided {@link ITreeFilter}
     * from the constructor options.
     * @param visibleOnly If only consider the visible tree nodes. Default to true.
     * @note The method will modify the tree structure.
     */
    filter(visibleOnly?: boolean): void;

    // [method - tree]

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
     */
    getNode(location: TRef): ITreeNode<T, TFilter>;

    /**
     * @description Returns the location corresponding to the given {@link ITreeNode}.
     * @param node The provided tree node.
     * @returns The location of the given tree node.
     */
    getNodeLocation(node: ITreeNode<T, TFilter>): TRef;
    
    /**
     * @description Determines if the given location of a node is collapsed.
     * @param location The location representation of the node.
     * @returns If it is collapsed. If the location is not found, false is 
     *          returned.
     */
    isCollapsed(location: TRef): boolean;
    
    /**
     * @description Determines if the given location of a node is collapsible.
     * @param location The location representation of the node.
     * @returns If it is collapsible. If the location is not found, false is 
     *          returned.
     */
    isCollapsible(location: TRef): boolean;
    
    /**
     * @description Collapses to the tree node with the given location.
     * @param location The location representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     * @returns If the operation successed.
     */
    collapse(location: TRef, recursive: boolean): boolean;

    /**
     * @description Expands to the tree node with the given location.
     * @param location The location representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     * @returns If the operation successed.
     */
    expand(location: TRef, recursive: boolean): boolean | Promise<boolean>;
    
    /**
     * @description Toggles the state of collapse or expand to the tree node with
     * the given location.
     * @param location The location representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     * @returns If the operation successed.
     */
    toggleCollapseOrExpand(location: TRef, recursive: boolean): boolean | Promise<boolean>;
    
    /**
     * @description Collapses all the tree nodes.
     */
    collapseAll(): void;
    
    /**
     * @description Expands all the tree nodes.
     */
    expandAll(): void;
    
    /**
     * @description Sets the given item as anchor.
     */
    setAnchor(item: TRef): void;

    /**
     * @description Returns the anchor item.
     */
    getAnchor(): T | null;

    /**
     * @description Sets the given item as focused.
     */
    setFocus(item: TRef): void;

    /**
     * @description Returns the focused item.
     */
    getFocus(): T | null;

    /**
     * @description Sets the given a series of items as selected.
     */
    setSelections(items: TRef[]): void;

    /**
     * @description Returns the selected items.
     */
    getSelections(): T[];
}

/**
 * An interface for the constructor options of the {@link AbstractTree}. The 
 * interface includes the base interface of a {@link ITreeModel} options.
 */
export interface IAbstractTreeOptions<T, TFilter> extends IIndexTreeModelOptions<T, TFilter> {

    /**
     * Provides the functionality to achieve drag and drop support in the tree.
     */
    readonly dnd?: IListDragAndDropProvider<T>;

    /**
     * Provides functionality to determine the uniqueness of each 
     * client-provided data.
     */
    readonly identityProvider?: IIdentiityProivder<T>;

    /**
     * An option for the external to provide a function to create the tree 
     * widget instead of inheritance.
     */
    readonly createTreeWidgetExternal?: (container: HTMLElement, renderers: ITreeListRenderer<T, TFilter, any>[], itemProvider: IListItemProvider<ITreeNode<T, TFilter>>, opts: ITreeWidgetOpts<T, TFilter, any>) => TreeWidget<T, TFilter, any>;

    readonly extraArguments?: any[];
}

/**
 * @class An {@link AbstractTree} is the base class for any tree-like structure
 * that can do expand / collapse / selection to nodes. Built on top of {@link IListWidget}.
 * 
 * MVVM is used in the related classes. Built upon a model {@link ITreeModel}
 * where the inherited class needs to overwrite the protected method 
 * `createModel()`.
 * 
 * T: type of item in the tree.
 * TFilter: type of filter data for filtering nodes in the tree.
 * TRef: a reference leads to find the corresponding tree node.
 */
export abstract class AbstractTree<T, TFilter, TRef> extends Disposable implements IAbstractTree<T, TFilter, TRef>, IDisposable {

    // [fields]

    protected readonly _model: ITreeModel<T, TFilter, TRef>;
    protected readonly _view: TreeWidget<T, TFilter, TRef>;

    // [constructor]

    constructor(
        container: HTMLElement,
        rootData: T,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IAbstractTreeOptions<T, TFilter> = {},
    ) {
        super();

        /**
         * Since the tree model is not created yet, we need a relay to be able 
         * to create the renderers first. After the model is created, we can 
         * have the chance to reset the input event emitter.
         */
        const relayEmitter = new RelayEmitter<ITreeCollapseStateChangeEvent<T, TFilter>>();

        // wraps each tree list view renderer with a basic tree item renderer
        renderers = renderers.map(renderer => new TreeItemRenderer<T, TFilter, any>(renderer, relayEmitter.registerListener));

        // tree view
        const treeWidgetArguments = 
        [
            container, 
            renderers, 
            new TreeListItemProvider(itemProvider), 
            {
                dragAndDropProvider: opts.dnd && new __TreeListDragAndDropProvider(opts.dnd),
                identityProvider: opts.identityProvider && new __TreeIdentityProvider(opts.identityProvider),
                tree: this,
                extraArguments: opts.extraArguments ?? [],
            },
        ] as const;
        if (opts.createTreeWidgetExternal) {
            this._view = opts.createTreeWidgetExternal(...treeWidgetArguments);
        } else {
            this._view = this.createTreeWidget(...treeWidgetArguments);
        }

        // create the tree model from abstraction, client may override it.
        this._model = this.createModel(rootData, this._view, opts);
        
        // updates traits in the tree-level after each splice
        this._model.onDidSplice(e => this._view.onDidSplice(e, opts.identityProvider));

        // reset the input event emitter once the model is created
        relayEmitter.setInput(this._model.onDidChangeCollapseState);

        // dispose registration
        this.__register(this._view);
        this.__register(relayEmitter);
    }

    // [event]

    get onDidSplice(): Register<ITreeSpliceEvent<T, TFilter>> { return this._model.onDidSplice; }
    get onDidChangeCollapseState(): Register<ITreeCollapseStateChangeEvent<T, TFilter>> { return this._model.onDidChangeCollapseState; }

    get onDidScroll(): Register<IScrollEvent> { return this._view.onDidScroll; }
    get onDidChangeFocus(): Register<boolean> { return this._view.onDidChangeFocus; }
    get onDidChangeItemFocus(): Register<ITraitChangeEvent> { return this._view.onDidChangeItemFocus; }
    get onDidChangeItemSelection(): Register<ITraitChangeEvent> { return this._view.onDidChangeItemSelection; }

    get onClick(): Register<ITreeMouseEvent<T>> { return Event.map(this._view.onClick, this.__toTreeMouseEvent); }
    get onDoubleclick(): Register<ITreeMouseEvent<T>> { return Event.map(this._view.onDoubleclick, this.__toTreeMouseEvent); }
    get onTouchstart(): Register<ITreeTouchEvent<T>> { return Event.map(this._view.onTouchstart, this.__toTreeTouchEvent); }

    get onKeydown(): Register<IStandardKeyboardEvent> { return this._view.onKeydown; }
    get onKeyup(): Register<IStandardKeyboardEvent> { return this._view.onKeyup; }
    get onKeypress(): Register<IStandardKeyboardEvent> { return this._view.onKeypress; }
    get onContextmenu(): Register<ITreeContextmenuEvent<T>> { return Event.map(this._view.onContextmenu, this.__toTreeContextmenuEvent); }
    
    // [protected methods]

    protected createTreeWidget(container: HTMLElement, renderers: ITreeListRenderer<T, TFilter, any>[], itemProvider: IListItemProvider<ITreeNode<T, TFilter>>, opts: ITreeWidgetOpts<T, TFilter, TRef>): TreeWidget<T, TFilter, TRef> {
        return new TreeWidget(container, renderers, itemProvider, opts);
    }

    protected abstract createModel(rootData: T, view: ISpliceable<ITreeNode<T, TFilter>>, opts: IAbstractTreeOptions<T, TFilter>): ITreeModel<T, TFilter, TRef>;

    // [methods - tree]

    public hasNode(location: TRef): boolean {
        return this._model.hasNode(location);
    }

    public getNode(location: TRef): ITreeNode<T, TFilter> {
        return this._model.getNode(location);
    }

    public getNodeLocation(node: ITreeNode<T, TFilter>): TRef {
        return this._model.getNodeLocation(node);
    }

    public isCollapsed(location: TRef): boolean {
        return this._model.isCollapsed(location);
    }

    public isCollapsible(location: TRef): boolean {
        return this._model.isCollapsible(location);
    }

    public collapse(location: TRef, recursive: boolean = false): boolean {
        return this._model.setCollapsed(location, true, recursive);
    }

    public expand(location: TRef, recursive: boolean = false): boolean {
        return this._model.setCollapsed(location, false, recursive);
    }

    public toggleCollapseOrExpand(location: TRef, recursive: boolean = false): boolean {
        return this._model.setCollapsed(location, undefined, recursive);
    }

    public collapseAll(): void {
        this._model.setCollapsed(this._model.root, true, true);
    }

    public expandAll(): void {
        this._model.setCollapsed(this._model.root, false, true);
    }

    public setAnchor(item: TRef): void {
        const index = this._model.getNodeListIndex(item);
        if (index === -1) {
            // not visible in the list view level.
            return;
        }
        this._view.setAnchor(index);
    }

    public setFocus(item: TRef): void {
        const index = this._model.getNodeListIndex(item);
        if (index === -1) {
            // not visible in the list view level.
            return;
        }
        this._view.setFocus(index);
    }

    public setSelections(items: TRef[]): void {
        const indice = items.map(item => this._model.getNodeListIndex(item)).filter(i => i !== -1);
        this._view.setSelections(indice);
    }

    public getAnchor(): T | null {
        return this._view.getAnchorData();
    }

    public getFocus(): T | null {
        return this._view.getFocusData();
    }

    public getSelections(): T[] {
        return this._view.getSelectionData();
    }

    // [methods - general]

    get DOMElement(): HTMLElement {
        return this._view.DOMElement;
    }

    get viewportHeight(): number {
        return this._view.getViewportSize();
    }

    get contentHeight(): number {
        return this._view.contentSize;
    }

    public setDomFocus(): void {
        this._view.setDomFocus();
    }

    public layout(height?: number): void {
        this._view.layout(height);
    }

    public filter(visibleOnly?: boolean): void {
        this._model.filter(visibleOnly);
    }

    // [private helper methods]

    /**
     * @description Converts the event {@link IListMouseEvent<ITreeNode<T>>} to
     * {@link ITreeMouseEvent<T>}.
     */
    private __toTreeMouseEvent(event: IListMouseEvent<ITreeNode<T, TFilter>>): ITreeMouseEvent<T> {
        return {
            browserEvent: event.browserEvent,
            data: event.item ? event.item.data : null,
            parent: event.item?.parent?.data || null,
            children: event.item ? event.item.children.map(child => child.data) : null,
            depth: event.item ? event.item.depth : null
        };
    }

    private __toTreeTouchEvent(event: IListTouchEvent<ITreeNode<T, TFilter>>): ITreeTouchEvent<T> {
        return {
            browserEvent: event.browserEvent,
            data: event.item ? event.item.data : null,
            parent: event.item?.parent?.data || null,
            children: event.item ? event.item.children.map(child => child.data) : null,
            depth: event.item ? event.item.depth : null
        };
    }

    private __toTreeContextmenuEvent(event: IListContextmenuEvent<ITreeNode<T, TFilter>>): ITreeContextmenuEvent<T> {
        return {
            browserEvent: event.browserEvent,
            data: event.item ? event.item.data : null,
            parent: event.item?.parent?.data || null,
            children: event.item ? event.item.children.map(child => child.data) : null,
            depth: event.item ? event.item.depth : null,
            position: event.position,
            target: event.target,
        };
    }
}