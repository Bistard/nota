import { Register } from "src/base/common/event";
import { ISpliceable } from "src/base/common/range";
import { IIndexTreeModelOptions, IIndexTreeModel, IndexTreeModel, ITreeModelSpliceOptions } from "src/base/browser/secondary/tree/indexTreeModel";
import { ITreeModel, ITreeSpliceEvent, ITreeNode, ITreeNodeItem, ITreeCollapseStateChangeEvent } from "src/base/browser/secondary/tree/tree";

/**
 * An interface only for {@link MultiTreeModel}.
 * TRef: T
 */
export interface IMultiTreeModel<T, TFilter> extends ITreeModel<T, TFilter, T> {

    /**
     * @description Returns the number of nodes in the current tree model.
     */
    size(): number;

    /**
     * To insert or delete items in the tree by given the location.
     * @param item The location representation of the node.
     * @param deleteCount number of deleted nodes after the given location.
     * @param children number of items to be inserted after the given location.
     * @param opts The option for splicing.
     */
    splice(item: T, deleteCount: number, children: ITreeNodeItem<T>[], opts: ITreeModelSpliceOptions<T, TFilter>): void;
}

export interface IMultiTreeModelOptions<T, TFilter = void> extends IIndexTreeModelOptions<T, TFilter> {

}

/**
 * @class An {@link MultiTreeModel} is built upon the {@link IndexTreeModel}.
 * 
 * Unlike {@link IndexTreeModel} searching is determined by a series of indices,
 * {@link MultiTreeModel} has an internal binding between user-defined data and 
 * internal treenode type, so that the caller can do searching without knowing 
 * the location of the actual tree node.
 */
export class MultiTreeModel<T, TFilter = void> implements IMultiTreeModel<T, TFilter> {

    // [field]

    public readonly root: T;

    private _model: IIndexTreeModel<T, TFilter>;
	private _nodes: Map<T, ITreeNode<T, TFilter>>;

    // [constructor]

    constructor(
        rootData: T,
        view: ISpliceable<ITreeNode<T, TFilter>>,
        opts: IMultiTreeModelOptions<T, TFilter> = {}
    ) {
        this.root = rootData;
        this._model = new IndexTreeModel<T, TFilter>(rootData, view, opts);
        this._nodes = new Map();

        this.onDidSplice = this._model.onDidSplice;
        this.onDidChangeCollapseState = this._model.onDidChangeCollapseState;
    }

    // [event]

    public readonly onDidSplice: Register<ITreeSpliceEvent<T, TFilter>>;
    public readonly onDidChangeCollapseState: Register<ITreeCollapseStateChangeEvent<T, TFilter>>;

    // [public method]

    public splice(
        item: T, 
        deleteCount: number = Number.MAX_VALUE,
        children: ITreeNodeItem<T>[] = [],
        opts: ITreeModelSpliceOptions<T, TFilter> = {}
    ): void {
        
        const location = this.__getNodeLocation(item); // the location in indexTreeModel
        const inserted = new Set<T>();

        // callback #1
        const onDidCreateNode = (node: ITreeNode<T, TFilter>): void => {
            
            // avoid root
            if (node.data === this.root) {
				return;
			}

            // remember the mapping
            this._nodes.set(node.data, node as ITreeNode<T, TFilter>);
            inserted.add(node.data);

            // other callback
            if (opts.onDidCreateNode) {
                opts.onDidCreateNode(node as ITreeNode<T, TFilter>);
            }
        }

        // callback #2
        const onDidDeleteNode = (node: ITreeNode<T, TFilter>): void => {

            // avoid root
            if (node.data === this.root) {
				return;
			}

            // prevent accidently delete what we just inserted.
            if (inserted.has(node.data) === false) {
                this._nodes.delete(node.data);
            }

            // other callback
            if (opts.onDidDeleteNode) {
                opts.onDidDeleteNode(node as ITreeNode<T, TFilter>);
            }
        }

        // the actual splicing
        this._model.splice(
            [...location, 0],
            deleteCount,
            children,
            { onDidCreateNode: onDidCreateNode, onDidDeleteNode: onDidDeleteNode }
        );
    }

    public filter(): void {
        this._model.filter();
    }

    public size(): number {
        return this._nodes.size;
    }

    public hasNode(item: T): boolean {
        return this._nodes.has(item);
    }

    public getNode(item: T): ITreeNode<T, TFilter> {
        const node = this._nodes.get(item);
        if (node === undefined) {
            throw new Error('provided item not found in the tree');
        }
        return node;
    }

    public getRoot(): ITreeNode<T, TFilter> {
        return this._model.getRoot();
    }

    public getNodeLocation(node: ITreeNode<T, TFilter>): T {
        return node.data;
    }

    public getNodeListIndex(item: T): number {
        const location = this.__getNodeLocation(item);
        return this._model.getNodeListIndex(location);
    }

    public isCollapsible(item: T): boolean {
        const location = this.__getNodeLocation(item);
        return this._model.isCollapsible(location);
    }

    public setCollapsible(item: T, collapsible?: boolean): boolean {
        const location = this.__getNodeLocation(item);
        return this._model.setCollapsible(location, collapsible);
    }

    public isCollapsed(item: T): boolean {
        const location = this.__getNodeLocation(item);
        return this._model.isCollapsed(location);
    }

    public setCollapsed(item: T, collapsed?: boolean, recursive?: boolean): boolean {
        const location = this.__getNodeLocation(item);
        return this._model.setCollapsed(location, collapsed, recursive);
    }

    public setExpandTo(item: T): void {
        const location = this.__getNodeLocation(item);
        this._model.setExpandTo(location);
    }

    public rerender(item: T): void {
        const location = this.__getNodeLocation(item);
        this._model.rerender(location);
    }

    // [private helper methods]

    /**
     * @description Returns the location of the provided item.
     * @param item The provided item.
     */
    private __getNodeLocation(item: T): number[] {

        if (item === this.root) {
            return [];
        }

        const treeNode = this._nodes.get(item);
        if (!treeNode) {
            throw new Error('provided tree node not found.');
        }

        return this._model.getNodeLocation(treeNode);
    }
}