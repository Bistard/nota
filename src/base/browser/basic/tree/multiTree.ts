import { AbstractTree, IAbstractTree, IAbstractTreeOptions } from "src/base/browser/basic/tree/abstractTree";
import { ITreeRenderer } from "src/base/browser/basic/tree/treeRenderer";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { IDisposable } from "src/base/common/dispose";
import { MultiTreeModel } from "src/base/common/tree/multiTreeModel";
import { ITreeModel, ITreeNode } from "src/base/common/tree/tree";

/**
 * An interface only for {@link MultiTree}.
 */
export interface IMultiTree<T, TFilter = void> extends IAbstractTree<T | null, TFilter, T | null> {
    
    // TODO
    
}

/**
 * @class An inheritance from {@link AbstractTree}, built on top of 
 * {@link MultiTreeModel}.
 * 
 * // TODO
 */
export class MultiTree<T, TFilter> extends AbstractTree<T | null, TFilter, T | null> implements IMultiTree<T, TFilter> {

    constructor(
        container: HTMLElement,
        renderers: ITreeRenderer<T>[],
        itemProvider: IListItemProvider<T>,
        opts: IAbstractTreeOptions<T> = {}
    ) {
        super(container, renderers, itemProvider, opts);
    }

    protected createModel(view: IListWidget<ITreeNode<T, TFilter>>): ITreeModel<T | null, TFilter, T | null> {
        return new MultiTreeModel(view);
    }

}