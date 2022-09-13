import { composedItemProvider, IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { AsyncNodeConverter, AsyncWeakMap, IAsyncChildrenProvider } from "src/base/browser/secondary/tree/asyncMultiTree";
import { AsyncTreeModel } from "src/base/browser/secondary/tree/asyncTreeModel";
import { AsyncTreeRenderer } from "src/base/browser/secondary/tree/asyncTreeRenderer";
import { ITreeModelSpliceOptions } from "src/base/browser/secondary/tree/indexTreeModel";
import { IMultiTreeOptions, MultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeNode, ITreeModel, ITreeCollapseStateChangeEvent } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { Disposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { Weakmap } from "src/base/common/util/map";

export interface IAsyncTreeNode<T> {
    /** The client-data. */
    data: T;

    /** If the node could has children. */
    couldHasChildren: boolean;

    /** Determines if the current node is during the refreshing. */
    refreshing: Promise<void> | null;
}

/**
 * @class A wrapper class to convert a basic {@link IListDragAndDropProvider<T>}
 * to {@link IListDragAndDropProvider<IAsyncTreeNode<T>>}.
 */
class __AsyncMultiTreeDragAndDropProvider<T> implements IListDragAndDropProvider<IAsyncTreeNode<T>> {

    constructor(
        private readonly dnd: IListDragAndDropProvider<T>
    ) {}

    public getDragData(node: IAsyncTreeNode<T>): string | null {
        return this.dnd.getDragData(node.data);
    }

    public getDragTag(items: IAsyncTreeNode<T>[]): string {
        return this.dnd.getDragTag(items.map(item => item.data));
    }

    public onDragStart(event: DragEvent): void {
        if (this.dnd.onDragStart) {
            this.dnd.onDragStart(event);
        }
    }

    public onDragOver(event: DragEvent, currentDragItems: IAsyncTreeNode<T>[], targetOver?: IAsyncTreeNode<T>, targetIndex?: number): boolean {
        if (this.dnd.onDragOver) {
            return this.dnd.onDragOver(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
        return false;
    }

    public onDragEnter(event: DragEvent, currentDragItems: IAsyncTreeNode<T>[], targetOver?: IAsyncTreeNode<T>, targetIndex?: number): void {
        if (this.dnd.onDragEnter) {
            return this.dnd.onDragEnter(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
    }

    public onDragLeave(event: DragEvent, currentDragItems: IAsyncTreeNode<T>[], targetOver?: IAsyncTreeNode<T>, targetIndex?: number): void {
        if (this.dnd.onDragLeave) {
            return this.dnd.onDragLeave(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
    }
    public onDragDrop(event: DragEvent, currentDragItems: IAsyncTreeNode<T>[], targetOver?: IAsyncTreeNode<T>, targetIndex?: number): void {
        if (this.dnd.onDragDrop) {
            return this.dnd.onDragDrop(event, currentDragItems.map(node => node.data), targetOver?.data, targetIndex);
        }
    }

    public onDragEnd(event: DragEvent): void {
        if (this.dnd.onDragEnd) {
            return this.dnd.onDragEnd(event);
        }
    }
}

export class AsyncMultiTree<T, TFilter = void> extends MultiTree<IAsyncTreeNode<T>, TFilter> {

    declare protected readonly _model: AsyncTreeModel<T, TFilter>;

    private readonly _childrenProvider: IAsyncChildrenProvider<T>;

    // [constructor]

    constructor(
        container: HTMLElement,
        rootData: IAsyncTreeNode<T>,
        renderers: ITreeListRenderer<IAsyncTreeNode<T>, TFilter, any>[],
        itemProvider: IListItemProvider<IAsyncTreeNode<T>>,
        childrenProvider: IAsyncChildrenProvider<T>,
        opts: IMultiTreeOptions<IAsyncTreeNode<T>, TFilter> = {}
    ) {
        super(container, rootData, renderers, itemProvider, opts);
        this._childrenProvider = childrenProvider;
    }

    // [protected override method]

    protected override createModel(
        rootData: IAsyncTreeNode<T>,
        view: IListWidget<ITreeNode<IAsyncTreeNode<T>, TFilter>>, 
        opts: IMultiTreeOptions<IAsyncTreeNode<T>, TFilter>
    ): ITreeModel<IAsyncTreeNode<T>, TFilter, IAsyncTreeNode<T>> 
    {
        return new AsyncTreeModel(rootData, view, this._childrenProvider, opts);
    }

    // [getter]

    get root(): T {
        return this.rootNode.data.data;
    }

    get rootNode(): ITreeNode<IAsyncTreeNode<T>, TFilter> {
        return this._model.getRoot();
    }

    // [public methods]

    public override getNode(node: IAsyncTreeNode<T>): ITreeNode<IAsyncTreeNode<T>, TFilter> {
        return this._model.getNode(node);
    }

    public getAsyncNode(data: T): IAsyncTreeNode<T> {
        return this._model.getAsyncNode(data);
    }

    public refreshNode(node: ITreeNode<IAsyncTreeNode<T>, TFilter>): Promise<void> {
        return this._model.refreshNode(node);
    }

    public shouldRefreshNodeWhenExpand(node: IAsyncTreeNode<T>): boolean {
        if (this._childrenProvider.shouldRefreshChildren) {
            return this._childrenProvider.shouldRefreshChildren(node.data);
        }
        return true;
    }
}

/**
 * {@link AsyncMultiTree} Constructor option.
 */
export interface IAsyncMultiTreeOptions<T, TFilter> extends IMultiTreeOptions<T, TFilter>, ITreeModelSpliceOptions<IAsyncTreeNode<T>, TFilter> {}

export class AsyncTree<T, TFilter = void> extends Disposable {

    // [field]

    private readonly _tree: AsyncMultiTree<T, TFilter>;

    private _onDidCreateNode?: (node: ITreeNode<IAsyncTreeNode<T>, TFilter>) => void;
    private _onDidDeleteNode?: (node: ITreeNode<IAsyncTreeNode<T>, TFilter>) => void;

    // [constructor]

    constructor(
        container: HTMLElement,
        rootData: T,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        childrenProvider: IAsyncChildrenProvider<T>,
        opts: IAsyncMultiTreeOptions<T, TFilter> = {},
    ) {
        super();

        this._onDidCreateNode = opts.onDidCreateNode;
        this._onDidDeleteNode = opts.onDidDeleteNode;

        const unwrapper: AsyncWeakMap<T, TFilter> = new Weakmap(node => new AsyncNodeConverter(node));
        const asyncRenderers = renderers.map(r => new AsyncTreeRenderer(r, unwrapper));
        const asyncProvider = new composedItemProvider<T, IAsyncTreeNode<T>>(itemProvider);

        this._tree = new AsyncMultiTree(
            container, 
            {
                data: rootData,
                refreshing: null,
                couldHasChildren: true,
            },
            asyncRenderers, 
            asyncProvider, 
            childrenProvider,
            {
                collapsedByDefault: opts.collapsedByDefault,
                dnd: opts.dnd && new __AsyncMultiTreeDragAndDropProvider(opts.dnd),
            },
        );

        // presetting behaviours on collapse state change
        this.__register(this._tree.onDidChangeCollapseState(e => this.__internalOnDidChangeCollapseState(e)));
    }

    // [event]

    // [public methods]

    public async refresh(data: T): Promise<void> {
        
        const asyncNode = this._tree.getAsyncNode(data);
        const node = this._tree.getNode(asyncNode);

        // wait until nothing is refreshing
        if (asyncNode.refreshing) {
            await asyncNode.refreshing;
        }

        // wait until refreshing the node and its descendants
        await this._tree.refreshNode(node);

        // renders the whole view
        this.__render(node);
    }

    // [private helper methods]

    private __render(node: ITreeNode<IAsyncTreeNode<T>, TFilter>): void {
        this._tree.splice(
            node.data, 
            node.children, 
            {
                onDidCreateNode: this._onDidCreateNode,
                onDidDeleteNode: this._onDidDeleteNode,
            },
        );
    }

    /**
     * @description Presets the behaviours when the collapsing state inside the
     * {@link MultiTree} is changed.
     */
    private async __internalOnDidChangeCollapseState(e: ITreeCollapseStateChangeEvent<IAsyncTreeNode<T>, TFilter>): Promise<void> {
        
        const node: ITreeNode<IAsyncTreeNode<T>, TFilter> = e.node;
        if (node === this._tree.rootNode) {
            return;
        }

        /**
         * Skip the refresh operation since there is no reasons to get the 
         * updated children of the current node if it is collapsed.
         */
        if (node.collapsed) {
            return;
        }

        /**
         * An optional optimization that client may prevent the refresh operation
         * when expanding.
         */
        if (this._tree.shouldRefreshNodeWhenExpand(node.data) === false) {
            return;
        }

        /**
         * Refresh the given node and its descendants with the updated stats and
         * rerender the whole tree view.
         */
        try {

            // get the updated tree structure into the model
            await this._tree.refreshNode(node);

            /**
             * Sets the updated tree structure from the model to the old one in
             * the {@link MultiTree} and rerender it.
             */
            this.__render(node);
        } 

        /**
         * Tree rendering process should not expect any errors. Forward it to 
         * the global.
         */
        catch (error) {
            ErrorHandler.onUnexpectedError(error);
        }
    }
}
