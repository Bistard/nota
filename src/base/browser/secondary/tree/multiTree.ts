import { AbstractTree, IAbstractTree, IAbstractTreeOptions, ITreeListWidgetOpts, TreeWidget } from "src/base/browser/secondary/tree/abstractTree";
import { IListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { ITreeModelSpliceOptions } from "src/base/browser/secondary/tree/indexTreeModel";
import { FlexMultiTreeModel, IFlexMultiTreeModel, IMultiTreeModel, IMultiTreeModelBase, MultiTreeModel } from "src/base/browser/secondary/tree/multiTreeModel";
import { IFlexNode, ITreeModel, ITreeNode, ITreeNodeItem } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { isPrimitive } from "src/base/common/util/type";
import { ListWidgetKeyboardController } from "src/base/browser/secondary/listWidget/listWidgetKeyboardController";
import { IStandardKeyboardEvent } from "src/base/common/keyboard";

/**
 * An interface only for {@link MultiTreeModelBase}.
 */
export interface IMultiTreeBase<T, TFilter> extends IAbstractTree<T, TFilter, T> {
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
 * An interface only for {@link MultiTree}.
 */
export interface IMultiTree<T, TFilter> extends IMultiTreeBase<T, TFilter> {
    
    /**
     * To insert or delete items in the tree by given the location.
     * @param item The location representation of the node.
     * @param children number of items to be inserted after the given location.
     * @param opts The option for splicing.
     */
    splice(item: T, children: ITreeNodeItem<T>[], opts: ITreeModelSpliceOptions<T, TFilter>): void;
}

export interface IFlexMultiTree<T, TFilter> extends IMultiTreeBase<T, TFilter> {
    
    /**
     * @description Refresh the subtree of the given tree node.
     * The tree model will rebuild and reculate all the metadata of the subtree
     * of the given tree node automatically if the client modify the tree node
     * correctly.
     * @param node The given node. Defaults to root.
     * @param opts The option for splicing.
     */
    refresh(node?: IFlexNode<T, TFilter>, opts?: ITreeModelSpliceOptions<T, TFilter>): void;
}

/**
 * {@link MultiTree} Constructor option.
 */
export interface IMultiTreeOptions<T, TFilter> extends IAbstractTreeOptions<T, TFilter> {
    /**
     * If force to enable use primitive type for client data.
     * @warn Enable using primitive type might raises undefined behaviours if
     * two of the client data have the same values.
     * @default false
     */
    readonly forcePrimitiveType?: boolean;
}


/**
 * @internal
 * @class Overrides the keyboard controller with addtional behaviours in the
 * perspective of tree level.
 */
export class MultiTreeKeyboardController<T, TFilter> extends ListWidgetKeyboardController<ITreeNode<T, TFilter>> {

    // [field]

    declare protected readonly _view: TreeWidget<T, TFilter, T>;
    protected readonly _tree: IAbstractTree<T, TFilter, T>;

    // [constructor]

    constructor(
        view: TreeWidget<T, TFilter, T>,
        tree: IAbstractTree<T, TFilter, T>,
    ) {
        super(view);
        this._tree = tree;
    }

    // [protected override methods]

    protected override __onEnter(e: IStandardKeyboardEvent): void {
        super.__onEnter(e); 
        
        const anchor = this._view.getAnchorData();
        if (anchor) {
            this._tree.toggleCollapseOrExpand(anchor, false);
        }
    }
}

/**
 * @internal
 * @class Used to override and add addtional controller behaviours.
 */
export class MultiTreeWidget<T, TFilter> extends TreeWidget<T, TFilter, T> {
    
    protected override __createKeyboardController(opts: ITreeListWidgetOpts<T, TFilter, T>): ListWidgetKeyboardController<ITreeNode<T, TFilter>> {
        return new MultiTreeKeyboardController(this, opts.tree);
    }
}

/**
 * @class An base class for {@link MultiTree} and {@link FlexMultiTree}.
 * 
 * @warn If data type `T` is a primitive type, might raises undefined behaviours
 * if there are two values are the same. For example, `size()` will not work 
 * properly since the tree cannot decide which is which.
 */
abstract class MultiTreeBase<T, TFilter> extends AbstractTree<T, TFilter, T> implements IMultiTreeBase<T, TFilter> {

    // [field]

    /** overrides for specifying the type of the model. */
    declare protected abstract readonly _model: IMultiTreeModelBase<T, TFilter>;

    // [constructor]

    constructor(
        container: HTMLElement,
        rootData: T,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IMultiTreeOptions<T, TFilter> = {}
    ) {
        if (!opts.forcePrimitiveType && isPrimitive(rootData)) {
            throw new Error('mutli tree does not support primitive types');
        }
        super(container, rootData, renderers, itemProvider, opts);
    }

    // [public method]

    public rerender(item: T): void {
        if (item === this._model.root) {
            this._view.rerender();
        }

        this._model.rerender(item);
    }

    public size(): number {
        return this._model.size();
    }

    // [protected override method]

    protected override createTreeWidget(container: HTMLElement, renderers: ITreeListRenderer<T, TFilter, any>[], itemProvider: IListItemProvider<ITreeNode<T, TFilter>>, opts: ITreeListWidgetOpts<T, TFilter, T>): TreeWidget<T, TFilter, T> {
        return new MultiTreeWidget(container, renderers, itemProvider, opts);
    }
}

/**
 * @class An inheritance from {@link AbstractTree}, built on top of the 
 * {@link MultiTreeModel}. Client may provide a new tree-like structure using
 * {@link ITreeNodeItem} to update the existing tree structure.
 * 
 * Almost has nothing new, except two main features:
 *      - wrapping {@link MultiTreeModel}.
 *      - provide rerender ability to refresh the view of the tree.
 */
export class MultiTree<T, TFilter> extends MultiTreeBase<T, TFilter> implements IMultiTree<T, TFilter> {

    // [field]

    declare protected readonly _model: IMultiTreeModel<T, TFilter>;

    // [public method]

    public splice(
        item: T, 
        children: ITreeNodeItem<T>[] = [],
        opts: ITreeModelSpliceOptions<T, TFilter> = {}
    ): void {
        this._model.splice(item, Number.MAX_VALUE, children, opts);
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

/**
 * @class An optimization that differents from {@link MultiTree}. Instead of 
 * letting client provide a new tree-like structure, client modify the existed 
 * one and the model will rebuild the tree structure automatically after calling 
 * the method {@link FlexMultiTree.refresh}.
 * 
 * @implements
 * If you wish the client side has the full control of tree structure, using
 * {@link MultiTree} instead.
 * 
 * If you wish to encapsulate the modification process of the tree structure, 
 * you may consider use {@link FlexMultiTree}.
 */
export class FlexMultiTree<T, TFilter> extends MultiTreeBase<T, TFilter> implements IFlexMultiTree<T, TFilter> {

    // [field]

    declare protected readonly _model: IFlexMultiTreeModel<T, TFilter>;

    // [public method]

    public refresh(
        node?: IFlexNode<T, TFilter>, 
        opts?: ITreeModelSpliceOptions<T, TFilter>
    ): void {
        this._model.refresh(node, opts);
    }

    // [private helper method]

    protected override createModel(
        rootData: T, 
        view: IListWidget<ITreeNode<T, TFilter>>, 
        opts: IMultiTreeOptions<T, TFilter>
    ): ITreeModel<T, TFilter, T>
    {
        return new FlexMultiTreeModel<T, TFilter>(rootData, view, opts);
    }
}