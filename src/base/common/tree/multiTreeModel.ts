import { Register } from "src/base/common/event";
import { ISpliceable } from "src/base/common/range";
import { IIndexTreeModel, IndexTreeModel, ITreeModelSpliceEvent, ITreeModelSpliceOptions } from "src/base/common/tree/indexTreeModel";
import { ITreeModel, ITreeNode, ITreeNodeItem } from "src/base/common/tree/tree";

/**
 * An interface only for {@link MultiTreeModel}.
 * 
 * TRef: T | null
 */
export interface IMultiTreeModel<T, TFilter> extends ITreeModel<T | null, TFilter, T | null> {

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
    splice(item: T | null, deleteCount: number, children: ITreeNodeItem<T>[], opts: ITreeModelSpliceOptions<T, TFilter>): void;

}

/**
 * @class An {@link MultiTreeModel} is built upon the {@link IndexTreeModel}.
 * 
 * Unlike {@link IndexTreeModel} searching is determined by a series of indices,
 * {@link MultiTreeModel} has an internal binding between user-defined data and 
 * tree nodes so that caller can do searching without knowing the location of the 
 * actual tree node.
 */
export class MultiTreeModel<T, TFilter = void> implements IMultiTreeModel<T, TFilter> {

    // [field]

    public readonly root = null;

    private _model: IIndexTreeModel<T | null, TFilter>;
	private _nodes: Map<T | null, ITreeNode<T, TFilter>>;

    // [constructor]

    constructor(
        view: ISpliceable<ITreeNode<T, TFilter>>,
    ) {

        this._model = new IndexTreeModel(null, view);
        this._nodes = new Map();

        this.onDidSplice = this._model.onDidSplice;

    }

    // [event]

    readonly onDidSplice: Register<ITreeModelSpliceEvent<T | null, TFilter>>;

    // [method]

    public splice(
        item: T | null, 
        deleteCount: number = Number.MAX_VALUE,
        children: ITreeNodeItem<T>[] = [],
        opts: ITreeModelSpliceOptions<T, TFilter> = {}
    ): void {
        
        const location = this.__getNodeLocation(item); // the location in indexTreeModel
        const inserted = new Set<T>();

        // callback #1
        const onDidCreateNode = (node: ITreeNode<T | null, TFilter>): void => {
            
            // avoid root
            if (node.data === null) {
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
        const onDidDeleteNode = (node: ITreeNode<T | null, TFilter>): void => {

            // avoid root
            if (node.data === null) {
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
        )
    }

    public size(): number {
        return this._nodes.size;
    }

    public hasNode(item: T | null): boolean {
        return this._nodes.has(item);
    }

    public getNode(item: T | null): ITreeNode<T, TFilter> {
        const node = this._nodes.get(item);
        if (node === undefined) {
            throw new Error('provided item not found in the tree');
        }
        return node;
    }

    public getRoot(): ITreeNode<T | null, TFilter> {
        return this._model.getRoot();
    }

    public getNodeLocation(node: ITreeNode<T | null, TFilter>): T | null {
        return node.data;
    }

    public getNodeListIndex(item: T | null): number {
        const location = this.__getNodeLocation(item);
        return this._model.getNodeListIndex(location);
    }

    public isCollapsible(item: T | null): boolean {
        const location = this.__getNodeLocation(item);
        return this._model.isCollapsible(location);
    }

    public setCollapsible(item: T | null, collapsible?: boolean): boolean {
        const location = this.__getNodeLocation(item);
        return this._model.setCollapsible(location, collapsible);
    }

    public isCollapsed(item: T | null): boolean {
        const location = this.__getNodeLocation(item);
        return this._model.isCollapsed(location);
    }

    public setCollapsed(item: T | null, collapsed?: boolean, recursive?: boolean): boolean {
        const location = this.__getNodeLocation(item);
        return this._model.setCollapsed(location, collapsed, recursive);
    }

    public setExpandTo(item: T | null): void {
        const location = this.__getNodeLocation(item);
        this._model.setExpandTo(location);
    }

    public rerender(item: T | null): void {
        const location = this.__getNodeLocation(item);
        this._model.rerender(location);
    }

    // [private helper methods]

    /**
     * @description Returns the location of the provided item.
     * @param item The provided item.
     */
    private __getNodeLocation(item: T | null): number[] {

        if (item === null) {
            return [];
        }

        const treeNode = this._nodes.get(item);
        if (!treeNode) {
            throw new Error('provided tree node not found.');
        }

        return this._model.getNodeLocation(treeNode);
    }
}