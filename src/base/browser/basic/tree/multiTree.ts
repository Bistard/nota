import { AbstractTree, IAbstractTree, IAbstractTreeOptions } from "src/base/browser/basic/tree/abstractTree";
import { ITreeListViewRenderer } from "src/base/browser/basic/tree/treeListViewRenderer";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { ITreeModelSpliceOptions } from "src/base/browser/basic/tree/indexTreeModel";
import { IMultiTreeModel, MultiTreeModel } from "src/base/browser/basic/tree/multiTreeModel";
import { ITreeModel, ITreeNode, ITreeNodeItem } from "src/base/browser/basic/tree/tree";

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
 * @class An inheritance from {@link AbstractTree}, built upon the 
 * {@link IMultiTreeModel}. 
 * 
 * Almost has nothing new, mainly having this class for wrapping 
 * {@link IMultiTreeModel} and inheriting {@link AbstractTree} away from abstract.
 */
export class MultiTree<T, TFilter = void> extends AbstractTree<T | null, TFilter, T | null> implements IMultiTree<T, TFilter> {

    // [field]

    /** overrides for specifying the type of the model. */
    protected override _model!: IMultiTreeModel<T, TFilter>;

    // [constructor]

    constructor(
        container: HTMLElement,
        renderers: ITreeListViewRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IAbstractTreeOptions<T> = {}
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

    protected override createModel(view: IListWidget<ITreeNode<T, TFilter>>): ITreeModel<T | null, TFilter, T | null> {
        return new MultiTreeModel<T, TFilter>(view);
    }

}