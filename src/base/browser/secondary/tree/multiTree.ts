import { AbstractTree, IAbstractTree, IAbstractTreeOptions } from "src/base/browser/secondary/tree/abstractTree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { ITreeModelSpliceOptions } from "src/base/browser/secondary/tree/indexTreeModel";
import { IMultiTreeModel, IMultiTreeModelOptions, MultiTreeModel } from "src/base/browser/secondary/tree/multiTreeModel";
import { ITreeModel, ITreeNode, ITreeNodeItem } from "src/base/browser/secondary/tree/tree";

/**
 * An interface only for {@link MultiTree}.
 */
export interface IMultiTree<T, TFilter> extends IAbstractTree<T, TFilter, T> {
    
    /**
     * To insert or delete items in the tree by given the location.
     * @param item The location representation of the node.
     * @param children number of items to be inserted after the given location.
     * @param opts The option for splicing.
     */
    splice(item: T, children: ITreeNodeItem<T>[], opts: ITreeModelSpliceOptions<T, TFilter>): void;
    
    /**
     * @description Returns the number of nodes in the current tree model.
     */
    size(): number;

    /**
     * @description Rerenders the whole view only with the corresponding tree 
     * node.
     * @param item The provided item. 
     */
    rerender(item: T): void;
}

/**
 * {@link MultiTree} Constructor option.
 */
export interface IMultiTreeOptions<T, TFilter> extends IAbstractTreeOptions<T, TFilter> {}

/**
 * @class An inheritance from {@link AbstractTree}, built on top of the 
 * {@link IMultiTreeModel}. 
 * 
 * Almost has nothing new, except two main features:
 *      - wrapping {@link IMultiTreeModel}.
 *      - provide rerender ability to refresh the view of the tree.
 */
export class MultiTree<T, TFilter> extends AbstractTree<T, TFilter, T> implements IMultiTree<T, TFilter> {

    // [field]

    /** overrides for specifying the type of the model. */
    declare protected _model: IMultiTreeModel<T, TFilter>;

    // [constructor]

    constructor(
        container: HTMLElement,
        rootData: T,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IMultiTreeOptions<T, TFilter> = {}
    ) {
        super(container, rootData, renderers, itemProvider, opts);
    }

    // [public method]

    public splice(
        item: T, 
        children: ITreeNodeItem<T>[] = [],
        opts: ITreeModelSpliceOptions<T, TFilter> = {}
    ): void {
        this._model.splice(item, Number.MAX_VALUE, children, opts);
    }

    public rerender(item: T): void {
        if (item === this._model.root) {
            this._view.rerender();
        }

        this._model.rerender(item);
    }

    public size(): number {
        return this._model.size();
    }

    // [private helper method]

    protected override createModel(
        rootData: T, 
        view: IListWidget<ITreeNode<T, TFilter>>, 
        opts: IMultiTreeOptions<T, TFilter>
    ): ITreeModel<T, TFilter, T>
    {
        return new MultiTreeModel<T, TFilter>(rootData, view, opts);
    }
}