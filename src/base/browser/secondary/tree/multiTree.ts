import { AbstractTree, IAbstractTree, IAbstractTreeOptions } from "src/base/browser/secondary/tree/abstractTree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { ITreeModelSpliceOptions } from "src/base/browser/secondary/tree/indexTreeModel";
import { IMultiTreeModel, MultiTreeModel } from "src/base/browser/secondary/tree/multiTreeModel";
import { ITreeModel, ITreeNode, ITreeNodeItem } from "src/base/browser/secondary/tree/tree";

/**
 * An interface only for {@link MultiTree}.
 */
export interface IMultiTree<T, TFilter = void> extends IAbstractTree<T | null, TFilter, T | null> {
    
    /**
     * To insert or delete items in the tree by given the location.
     * @param item The location representation of the node.
     * @param deleteCount number of deleted nodes after the given location.
     * @param children number of items to be inserted after the given location.
     * @param opts The option for splicing.
     */
    splice(item: T | null, deleteCount: number, children: ITreeNodeItem<T>[], opts: ITreeModelSpliceOptions<T, TFilter>): void;
    
    /**
     * @description Returns the number of nodes in the current tree model.
     */
    size(): number;

    /**
     * @description Rerenders the whole view. If the item is null, the whole 
     * view will be rerendered. Otherwise will only rerenders the corresponding 
     * tree node.
     * @param item The provided item. 
     */
    rerender(item: T | null): void;
}

/**
 * {@link MultiTree} Constructor option.
 */
export interface IMultiTreeOptions<T, TFilter = void> extends IAbstractTreeOptions<T, TFilter> {

}

/**
 * @class An inheritance from {@link AbstractTree}, built on top of the 
 * {@link IMultiTreeModel}. 
 * 
 * Almost has nothing new, mainly having this class for wrapping 
 * {@link IMultiTreeModel} and inheriting {@link AbstractTree} away from 
 * abstraction.
 */
export class MultiTree<T, TFilter = void> extends AbstractTree<T | null, TFilter, T | null> implements IMultiTree<T, TFilter> {

    // [field]

    /** overrides for specifying the type of the model. */
    declare protected _model: IMultiTreeModel<T, TFilter>;

    // [constructor]

    constructor(
        container: HTMLElement,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IMultiTreeOptions<T, TFilter> = {}
    ) {
        super(container, renderers, itemProvider, opts);
    }

    // [public method]

    public splice(
        item: T | null, 
        deleteCount: number = Number.MAX_VALUE,
        children: ITreeNodeItem<T>[] = [],
        opts: ITreeModelSpliceOptions<T, TFilter> = {}
    ): void {
        this._model.splice(item, deleteCount, children, opts);
    }

    public rerender(item: T | null): void {
        if (item === null) {
            this._view.rerender();
        }

        this._model.rerender(item);
    }

    public size(): number {
        return this._model.size();
    }

    // [private helper method]

    protected override createModel(view: IListWidget<ITreeNode<T, TFilter>>, opts: IMultiTreeOptions<T, TFilter>): ITreeModel<T | null, TFilter, T | null> {
        return new MultiTreeModel<T, TFilter>(view, opts);
    }

}