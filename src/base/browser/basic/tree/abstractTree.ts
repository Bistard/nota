import { ITreeListWidget, TreeListWidget } from "src/base/browser/basic/tree/treeListWidget";
import { IListItemProvider, TreeListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListViewRenderer } from "src/base/browser/secondary/listView/listRenderer";
import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { ISpliceable } from "src/base/common/range";
import { ITreeModel, ITreeNode } from "src/base/common/tree/tree";

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
 * @class An {@link AbstractTree} is the base class for any tree-like structure.
 * MVVM is used in these related classes. Built upon a model {@link ITreeModel}.
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
        renderers: IListViewRenderer<T>[],
        itemProvider: IListItemProvider<T>,
        opts: IAbstractTreeOptions<T> = {}
    ) {

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

}