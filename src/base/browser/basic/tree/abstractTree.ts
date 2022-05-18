import { ITreeModel, ITreeMouseEvent, ITreeNode } from "src/base/browser/basic/tree/tree";
import { ITreeListViewRenderer, TreeListItemRenderer } from "src/base/browser/basic/tree/treeListViewRenderer";
import { ITreeListWidget, TreeListWidget } from "src/base/browser/basic/tree/treeListWidget";
import { IListItemProvider, TreeListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListTraitEvent } from "src/base/browser/secondary/listWidget/listTrait";
import { IListMouseEvent } from "src/base/browser/secondary/listWidget/listWidget";
import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { Event, Register } from "src/base/common/event";
import { ISpliceable } from "src/base/common/range";
import { IScrollEvent } from "src/base/common/scrollable";

/**
 * An interface for the constructor options of the {@link AbstractTree}.
 */
export interface IAbstractTreeOptions<T> {

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
    get onDidChangeItemFocus(): Register<IListTraitEvent>;

    /**
     * Fires when the selected tree nodes in the {@link IAbstractTree} is changed.
     */
    get onDidChangeItemSelection(): Register<IListTraitEvent>;

    /**
     * Fires when the tree node in the {@link IAbstractTree} is clicked.
     */
    get onClick(): Register<ITreeMouseEvent<T>>;
    
    /**
     * Fires when the tree node in the {@link IAbstractTree} is double clicked.
     */
    get onDoubleclick(): Register<ITreeMouseEvent<T>>;
    
    // [method - general]

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
    
    // TODO
    setSelections(items: TRef[]): void;
    getSelections(): TRef[];
}

/**
 * @class An {@link AbstractTree} is the base class for any tree-like structure
 * that can do expand / collapse / selection to nodes.
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

    protected _view: ITreeListWidget<T, TFilter>;

    // [constructor]

    constructor(
        container: HTMLElement,
        renderers: ITreeListViewRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IAbstractTreeOptions<T> = {}
    ) {

        // wraps each tree list view renderer with a basic tree item renderer.
        renderers = renderers.map(renderer => new TreeListItemRenderer<T, TFilter, any>(renderer));

        this._view = new TreeListWidget<T, TFilter>(
            container, 
            renderers, 
            new TreeListItemProvider(itemProvider), 
            {
                // TODO:
            }
        );
        this._model = this.createModel(this._view);


        // dispose registration
        this._disposables.register(this._view);

    }

    // [event]

    get onDidScroll(): Register<IScrollEvent> { return this._view.onDidScroll; }
    get onDidChangeFocus(): Register<boolean> { return this._view.onDidChangeFocus; }
    get onDidChangeItemFocus(): Register<IListTraitEvent> { return this._view.onDidChangeItemFocus; }
    get onDidChangeItemSelection(): Register<IListTraitEvent> { return this._view.onDidChangeItemSelection; }

    get onClick(): Register<ITreeMouseEvent<T>> { return Event.map(this._view.onClick, this.__toTreeMouseEvent); }
    get onDoubleclick(): Register<ITreeMouseEvent<T>> { return Event.map(this._view.onDoubleclick, this.__toTreeMouseEvent); }
    
    // [abstract methods]

    protected abstract createModel(view: ISpliceable<ITreeNode<T, TFilter>>): ITreeModel<T, TFilter, TRef>;

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

    public setSelections(items: TRef[]): void {
        // TODO
    }

    public getSelections(): TRef[] {
        // TODO
        return [];
    }

    // [methods - general]

    get DOMElement(): HTMLElement {
        return this._view.DOMElement;
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
            event: event.browserEvent,
            data: event.item.data,
            parent: event.item.parent?.data || null,
            children: event.item.children.map(child => child.data),
        };
    }

}