import { ITreeModel, ITreeNode } from "src/base/browser/basic/tree/tree";
import { ITreeListViewRenderer, TreeListItemRenderer } from "src/base/browser/basic/tree/treeListViewRenderer";
import { ITreeListWidget, TreeListWidget } from "src/base/browser/basic/tree/treeListWidget";
import { IListItemProvider, TreeListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListTraitEvent } from "src/base/browser/secondary/listWidget/listTrait";
import { IListMouseEvent } from "src/base/browser/secondary/listWidget/listWidget";
import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
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

    DOMElement: HTMLElement;

    // [event]

    get onDidScroll(): Register<IScrollEvent>;
    get onDidChangeFocus(): Register<boolean>;
    get onDidChangeItemFocus(): Register<IListTraitEvent>;
    get onDidChangeItemSelection(): Register<IListTraitEvent>;

    get onClick(): Register<IListMouseEvent<ITreeNode<T, TFilter>>>;
    get onDoubleclick(): Register<IListMouseEvent<ITreeNode<T, TFilter>>>;
    get onMouseover(): Register<IListMouseEvent<ITreeNode<T, TFilter>>>;
    get onMouseout(): Register<IListMouseEvent<ITreeNode<T, TFilter>>>;
    get onMousedown(): Register<IListMouseEvent<ITreeNode<T, TFilter>>>;
    get onMouseup(): Register<IListMouseEvent<ITreeNode<T, TFilter>>>;
    get onMousemove(): Register<IListMouseEvent<ITreeNode<T, TFilter>>>;

    // [method - general]

    dispose(): void;

    // [method - tree]

    hasNode(location: TRef): boolean;
    getNode(location: TRef): ITreeNode<T, TFilter>;
    isCollapsed(location: TRef): boolean;
    isCollapsible(location: TRef): boolean;
    collapse(location: TRef, recursive: boolean): boolean;
    expand(location: TRef, recursive: boolean): boolean;
    toggleCollapseOrExpand(location: TRef, recursive: boolean): boolean;
    collapseAll(): void;
    expandAll(): void;
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

    get onClick(): Register<IListMouseEvent<ITreeNode<T, TFilter>>> { return this._view.onClick; }
    get onDoubleclick(): Register<IListMouseEvent<ITreeNode<T, TFilter>>> { return this._view.onDoubleclick; }
    get onMouseover(): Register<IListMouseEvent<ITreeNode<T, TFilter>>> { return this._view.onMouseover; }
    get onMouseout(): Register<IListMouseEvent<ITreeNode<T, TFilter>>> { return this._view.onMouseout; }
    get onMousedown(): Register<IListMouseEvent<ITreeNode<T, TFilter>>> { return this._view.onMousedown; }
    get onMouseup(): Register<IListMouseEvent<ITreeNode<T, TFilter>>> { return this._view.onMouseup; }
    get onMousemove(): Register<IListMouseEvent<ITreeNode<T, TFilter>>> { return this._view.onMousemove; }
    
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

    private __throwIfNotSupport(method: any): void {
        if (!method) {
            throw new Error(`current tree model does not support: ${method}`);
        }
    }

}