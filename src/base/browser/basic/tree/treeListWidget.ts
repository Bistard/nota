import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListViewRenderer } from "src/base/browser/secondary/listView/listRenderer";
import { IListWidget, IListWidgetOpts, ListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { ITreeNode } from "src/base/common/tree/tree";

/**
 * An interface for {@link TreeListWidget}.
 */
export interface ITreeListWidget<T, TFilter> extends IListWidget<ITreeNode<T>> {

}

/**
 * @class A simple wrapper class for {@link IListWidget} which converts the type
 * T to ITreeNode<T>.
 */
export class TreeListWidget<T, TFilter> extends ListWidget<ITreeNode<T>> implements ITreeListWidget<T, TFilter> {

    constructor(
        container: HTMLElement,
        renderers: IListViewRenderer<any, any>[],
        itemProvider: IListItemProvider<ITreeNode<T, TFilter>>,
        opts: IListWidgetOpts<ITreeNode<T>> = {}
    ) {
        super(container, renderers, itemProvider, opts);
    }

}
