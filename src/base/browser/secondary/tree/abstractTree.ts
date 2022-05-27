import { ITreeCollapseStateChangeEvent, ITreeModel, ITreeMouseEvent, ITreeNode, ITreeSpliceEvent } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer, TreeItemRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { IListItemProvider, TreeListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListMouseEvent, IListWidgetOpts, ITraitChangeEvent, ListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { Event, Register, RelayEmitter } from "src/base/common/event";
import { ISpliceable } from "src/base/common/range";
import { IScrollEvent } from "src/base/common/scrollable";
import { IListViewRenderer } from "src/base/browser/secondary/listView/listRenderer";

/**
 * @class A wrapper class to convert a basic {@link IListDragAndDropProvider<T>}
 * to {@link IListDragAndDropProvider<ITreeNode<T>>}.
 */
class __TreeListDragAndDropProvider<T> implements IListDragAndDropProvider<ITreeNode<T>> {

    constructor(
        private readonly dnd: IListDragAndDropProvider<T>
    ) {}

    public getDragData(node: ITreeNode<T>): string | null {
        return this.dnd.getDragData(node.data);
    }

    public onDragStart(): void {
        if (this.dnd.onDragStart) {
            this.dnd.onDragStart();
        }
    }

}

/**
 * @class Similar to the {@link __ListTrait} in the {@link ListWidget}. The trait
 * concept need to be exist at the tree level, since the list view does not know
 * the existance of the collapsed tree nodes.
 * 
 * T: The type of data in {@link AbstractTree}.
 */
class __TreeListTrait<T> {

    // [field]

    private _nodes = new Set<ITreeNode<T, any>>();
    private _elements: T[] | null = null;

    // [constructor]

    constructor() {

    }

    // [public method]

    set(nodes: ITreeNode<T, any>[]): void {
        for (const node of nodes) {
            this._nodes.add(node);
        }
        this._elements = null;
    }

    get(): T[] {
        if (this._elements === null) {
            let elements: T[] = [];
            this._nodes.forEach(node => elements.push(node.data));
            this._elements = elements;
        }
        return this._elements;
    }

    has(nodes: ITreeNode<T, any>): boolean {
        return this._nodes.has(nodes);
    }

}

/**
 * @class A simple wrapper class for {@link IListWidget} which converts the type
 * T to ITreeNode<T>.
 */
export class TreeListWidget<T, TFilter> extends ListWidget<ITreeNode<T>> {

    // [field]

    private _focused: __TreeListTrait<T>;
    private _selected: __TreeListTrait<T>;

    // [constructor]

    constructor(
        container: HTMLElement,
        renderers: IListViewRenderer<any, any>[],
        focusedTrait: __TreeListTrait<T>,
        selectedTrait: __TreeListTrait<T>,
        itemProvider: IListItemProvider<ITreeNode<T, TFilter>>,
        opts: IListWidgetOpts<ITreeNode<T>> = {}
    ) {
        super(container, renderers, itemProvider, opts);
        this._focused = focusedTrait;
        this._selected = selectedTrait;
    }

    // [public method]

    public override splice(index: number, deleteCount: number, items: ITreeNode<T, TFilter>[] = []): void {
        super.splice(index, deleteCount, items);

        if (items.length === 0) {
            return;
        }

        let focusedIndex: number = -1;
        let selectedIndex: number[] = [];

        /**
         * If the inserting item has trait attribute at the tree level, it should 
         * also has trait attribute at the list level.
         */

        let i: number;
        let item: ITreeNode<T, TFilter>;
        for (i = 0; i < items.length; i++) {
            item = items[i]!;
            
            if (this._focused.has(item)) {
                focusedIndex = i;
            }

            if (this._selected.has(item)) {
                selectedIndex.push(i);
            }
        }

        /**
         * Update the trait attributes at the list level.
         */

        if (focusedIndex !== -1) {
            super.setFocus(focusedIndex);
        }

        if (selectedIndex.length > 0) {
            super.setSelections(selectedIndex);
        }
    }
}

/**
 * An interface for the constructor options of the {@link AbstractTree}.
 */
export interface IAbstractTreeOptions<T> {

    /** @default false */
    readonly collapseByDefault?: boolean;

    readonly dnd?: IListDragAndDropProvider<T>;

}

/**
 * The interface only for {@link AbstractTree}.
 */
export interface IAbstractTree<T, TFilter, TRef> {

    /**
     * The container of the whole tree.
     */
    DOMElement: HTMLElement;

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
     * @description Disposes all the used resources.
     */
    dispose(): void;

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
     */
    collapse(location: TRef, recursive: boolean): boolean;

    /**
     * @description Expands to the tree node with the given location.
     * @param location The location representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     */
    expand(location: TRef, recursive: boolean): boolean;
    
    /**
     * @description Toggles the state of collapse or expand to the tree node with
     * the given location.
     * @param location The location representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     */
    toggleCollapseOrExpand(location: TRef, recursive: boolean): boolean;
    
    /**
     * @description Collapses all the tree nodes.
     */
    collapseAll(): void;
    
    /**
     * @description Expands all the tree nodes.
     */
    expandAll(): void;
    
    /**
     * @description Sets the given item as focused.
     * @param item The provided item.
     */
    setFocus(item: TRef): void;

    /**
     * @description Returns the focused item.
     */
    getFocus(): T | null;

    /**
     * @description Sets the given a series of items as selected.
     * @param items The provided items.
     */
    setSelections(items: TRef[]): void;

    /**
     * @description Returns the selected items.
     */
    getSelections(): T[];
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
export abstract class AbstractTree<T, TFilter, TRef> implements IAbstractTree<T, TFilter, TRef>, IDisposable {

    // [fields]

    protected readonly _disposables: DisposableManager = new DisposableManager();

    /** the raw data model of the tree. */
    protected _model: ITreeModel<T, TFilter, TRef>;

    protected _view: TreeListWidget<T, TFilter>;

    private _focused: __TreeListTrait<T>;
    private _selected: __TreeListTrait<T>;

    // [constructor]

    constructor(
        container: HTMLElement,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IAbstractTreeOptions<T> = {}
    ) {

        /**
         * Since the tree model is not created yet, we need a relay to be able 
         * to create the renderers first. After the model is created, we can 
         * have the chance to reset the input event emitter.
         */
        const relayEmitter = new RelayEmitter<ITreeCollapseStateChangeEvent<T, TFilter>>();

        // wraps each tree list view renderer with a basic tree item renderer.
        renderers = renderers.map(renderer => new TreeItemRenderer<T, TFilter, any>(renderer, relayEmitter.registerListener));

        this._focused = new __TreeListTrait();
        this._selected = new __TreeListTrait();

        this._view = new TreeListWidget<T, TFilter>(
            container, 
            renderers, 
            this._focused,
            this._selected,
            new TreeListItemProvider(itemProvider), 
            {
                dragAndDropProvider: opts.dnd && new __TreeListDragAndDropProvider(opts.dnd)
            }
        );

        this._model = this.createModel(this._view, opts);

        // reset the input event emitter once the model is created.
        relayEmitter.setInput(this._model.onDidChangeCollapseState);

        // dispose registration
        this._disposables.register(this._view);

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
    
    // [abstract methods]

    protected abstract createModel(view: ISpliceable<ITreeNode<T, TFilter>>, opts: IAbstractTreeOptions<T>): ITreeModel<T, TFilter, TRef>;

    // [methods - tree]

    public hasNode(location: TRef): boolean {
        return this._model.hasNode(location);
    }

    public getNode(location: TRef): ITreeNode<T, TFilter> {
        return this._model.getNode(location);
    }

    public isCollapsed(location: TRef): boolean {
        return this._model.isCollapsed(location);
    }

    public isCollapsible(location: TRef): boolean {
        return this._model.isCollapsible(location);
    }

    public collapse(location: TRef, recursive: boolean = false): boolean {
        this.__throwIfNotSupport(this._model.setCollapsed);
        return this._model.setCollapsed!(location, true, recursive);
    }

    public expand(location: TRef, recursive: boolean = false): boolean {
        this.__throwIfNotSupport(this._model.setCollapsed);
        return this._model.setCollapsed!(location, false, recursive);
    }

    public toggleCollapseOrExpand(location: TRef, recursive: boolean = false): boolean {
        this.__throwIfNotSupport!(this._model.setCollapsed);
        return this._model.setCollapsed!(location, undefined, recursive);
    }

    public collapseAll(): void {
        this.__throwIfNotSupport(this._model.setCollapsed);
        this._model.setCollapsed!(this._model.root, true, true);
    }

    public expandAll(): void {
        this.__throwIfNotSupport(this._model.setCollapsed);
        this._model.setCollapsed!(this._model.root, false, true);
    }

    public setFocus(item: TRef): void {
        const node = this._model.getNode(item);
        this._focused.set([node]);
        const index = this._model.getNodeListIndex(item);

        // not visible in the list view level.
        if (index === -1) {
            return;
        }

        this._view.setFocus(index);
    }

    public getFocus(): T | null {
        const returned = this._focused.get();
        return returned.length ? this._focused.get()[0]! : null;
    }

    public setSelections(items: TRef[]): void {
        const nodes = items.map(item => this._model.getNode(item));
        this._focused.set(nodes);
        const indice = items.map(item => this._model.getNodeListIndex(item)).filter(i => i !== -1);
        this._view.setSelections(indice);
    }

    public getSelections(): T[] {
        return this._selected.get();
    }

    // [methods - general]

    get DOMElement(): HTMLElement {
        return this._view.DOMElement;
    }

    public setDomFocus(): void {
        this._view.setDomFocus();
    }

    public layout(height?: number): void {
        this._view.layout(height);
    }

    public dispose(): void {
        this._disposables.dispose();
    }

    // [private helper methods]

    /**
     * @description Throws {@link Error} if the given method does not exist.
     */
    private __throwIfNotSupport(method: any): void {
        if (!method) {
            throw new Error(`current tree model does not support: ${method}`);
        }
    }

    /**
     * @description Converts the event {@link IListMouseEvent<ITreeNode<T>>} to
     * {@link ITreeMouseEvent<T>}.
     */
    private __toTreeMouseEvent(event: IListMouseEvent<ITreeNode<T, any>>): ITreeMouseEvent<T> {
        return {
            browserEvent: event.browserEvent,
            data: event.item ? event.item.data : null,
            parent: event.item?.parent?.data || null,
            children: event.item ? event.item.children.map(child => child.data) : null,
            depth: event.item ? event.item.depth : null
        };
    }

}