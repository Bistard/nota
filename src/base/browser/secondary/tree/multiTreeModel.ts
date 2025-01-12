import { Register } from "src/base/common/event";
import { ISpliceable } from "src/base/common/structures/range";
import { IIndexTreeModelOptions, IIndexTreeModel, IndexTreeModel, ITreeModelSpliceOptions, IIndexTreeModelBase, IFlexIndexTreeModel, FlexIndexTreeModel } from "src/base/browser/secondary/tree/indexTreeModel";
import { ITreeModel, ITreeSpliceEvent, ITreeNode, ITreeNodeItem, ITreeCollapseStateChangeEvent, IFlexNode } from "src/base/browser/secondary/tree/tree";
import { panic } from "src/base/common/utilities/panic";
import { Disposable } from "src/base/common/dispose";

/**
 * An interface only for {@link IMultiTreeModelBase}.
 * TRef: T
 */
export interface IMultiTreeModelBase<T, TFilter> extends ITreeModel<T, TFilter, T> {
    /**
     * @description Returns the number of nodes in the current tree model.
     * @complexity O(1)
     */
    size(): number;
}

/**
 * An interface only for {@link MultiTreeModel}.
 */
export interface IMultiTreeModel<T, TFilter> extends IMultiTreeModelBase<T, TFilter> {

    /**
     * @description To insert or delete items in the tree by given the 
     * corresponding item.
     * @param item The corresponding item.
     * @param deleteCount number of deleted data after the given item.
     * @param children number of items to be inserted after the given item.
     * @param opts The option for splicing.
     */
    splice(item: T, deleteCount: number, children: ITreeNodeItem<T>[], opts?: ITreeModelSpliceOptions<T, TFilter>): void;
}

/**
 * An interface only for {@link FlexMultiTreeModel}.
 */
export interface IFlexMultiTreeModel<T, TFilter> extends IMultiTreeModelBase<T, TFilter> {

    /**
     * @description Refresh the subtree of the given tree node.
     * The tree model will rebuild and recalculate all the metadata of the subtree
     * of the given tree node automatically if the client modify the tree node
     * correctly.
     * @param node The given node. Defaults to root.
     * @param opts The option for splicing.
     */
    refresh(node?: IFlexNode<T, TFilter>, opts?: ITreeModelSpliceOptions<T, TFilter>): void;

    /**
     * @description See details in {@link IFlexIndexTreeModel['triggerOnDidSplice']}.
     * @param event The event to be fired.
     */
    triggerOnDidSplice(event: ITreeSpliceEvent<T, TFilter>): void;
}

/**
 * {@link MultiTreeModelBase} constructor options.
 */
export interface IMultiTreeModelOptions<T, TFilter> extends IIndexTreeModelOptions<T, TFilter> {}

/**
 * @class A base class for {@link MultiTreeModel} and {@link FlexMultiTreeModel}.
 * Integrated all the functionalities except modifying the tree structure (
 * `splice` or `refresh` methods).
 */
abstract class MultiTreeModelBase<T, TFilter> extends Disposable implements IMultiTreeModelBase<T, TFilter> {
    
    // [field]

    public readonly root: T;
    public readonly rootNode: ITreeNode<T, TFilter>;

    protected readonly _model: IIndexTreeModelBase<T, TFilter>;
	protected _nodes: Map<T, ITreeNode<T, TFilter>>;

    // [constructor]

    constructor(rootData: T, model: IIndexTreeModelBase<T, TFilter>) {
        super();
        this._model = this.__register(model);
        this.rootNode = this._model.rootNode;
        this.root = rootData;
        this._nodes = new Map();
        this._nodes.set(rootData, this.rootNode);
    }

    // [event]

    public abstract onDidSplice: Register<ITreeSpliceEvent<T, TFilter>>;
    public abstract onDidChangeCollapseState: Register<ITreeCollapseStateChangeEvent<T, TFilter>>;

    // [public method]

    public filter(): void {
        this._model.filter();
    }

    public size(): number {
        return this._nodes.size - 1; // remove the root node
    }

    public hasNode(item: T): boolean {
        return this._nodes.has(item);
    }

    public getNode(item: T): ITreeNode<T, TFilter> {
        const node = this._nodes.get(item);
        if (!node) {
            panic('[MultiTreeModelBase] provided item not found in the tree');
        }
        return node;
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
    protected __getNodeLocation(item: T): number[] {
        if (item === this.root) {
            return [];
        }
        const treeNode = this.getNode(item);
        return this._model.getNodeLocation(treeNode);
    }

    protected __createSpliceOptions(opts: ITreeModelSpliceOptions<T, TFilter>): ITreeModelSpliceOptions<T, TFilter> {
        const justInserted = new Set<T>();

        const onDidCreateNode = (node: ITreeNode<T, TFilter>): void => {
            // avoid root
            if (node.data === this.root) {
				return;
			}

            // remember the mapping
            this._nodes.set(node.data, node);
            justInserted.add(node.data);

            opts.onDidCreateNode?.(node);
        };

        const onDidDeleteData = (data: T): void => {
            // avoid root
            if (data === this.root) {
				return;
			}

            // prevent accidentally delete what we just inserted.
            if (justInserted.has(data)) {
                return;
            }

            this._nodes.delete(data);
            opts.onDidDeleteData?.(data);
        };

        return {
            onDidCreateNode,
            onDidDeleteData,
        };
    }
}

/**
 * @class An {@link MultiTreeModel} is built upon the {@link IndexTreeModel}.
 * 
 * Unlike {@link IndexTreeModel} searching is determined by a series of indices,
 * {@link MultiTreeModel} has an internal binding between user-defined data and 
 * internal tree node type, so that the caller can do searching without knowing 
 * the location of the actual tree node.
 */
export class MultiTreeModel<T, TFilter> extends MultiTreeModelBase<T, TFilter> implements IMultiTreeModel<T, TFilter> {

    // [field]

    declare protected readonly _model: IIndexTreeModel<T, TFilter>;

    // [event]

    public onDidSplice: Register<ITreeSpliceEvent<T, TFilter>>;
    public onDidChangeCollapseState: Register<ITreeCollapseStateChangeEvent<T, TFilter>>;

    // [constructor]

    constructor(
        rootData: T,
        view: ISpliceable<ITreeNode<T, TFilter>>,
        opts: IMultiTreeModelOptions<T, TFilter> = {}
    ) {
        super(rootData, new IndexTreeModel<T, TFilter>(rootData, view, opts));
        this.onDidSplice = this._model.onDidSplice;
        this.onDidChangeCollapseState = this._model.onDidChangeCollapseState;
    }

    // [public methods]

    public splice(
        item: T, 
        deleteCount: number = Number.MAX_VALUE,
        children: ITreeNodeItem<T>[] = [],
        opts: ITreeModelSpliceOptions<T, TFilter> = {}
    ): void {
        const location = this.__getNodeLocation(item);
        this._model.splice(
            [...location, 0],
            deleteCount,
            children,
            this.__createSpliceOptions(opts),
        );
    }
}

/**
 * @class An optimization tree model based on {@link FlexIndexTreeModel}.
 */
export class FlexMultiTreeModel<T, TFilter> extends MultiTreeModelBase<T, TFilter> implements IFlexMultiTreeModel<T, TFilter> {

    // [field]

    declare protected readonly _model: IFlexIndexTreeModel<T, TFilter>;

    // [event]

    public onDidSplice: Register<ITreeSpliceEvent<T, TFilter>>;
    public onDidChangeCollapseState: Register<ITreeCollapseStateChangeEvent<T, TFilter>>;

    // [constructor]

    constructor(
        rootData: T,
        view: ISpliceable<ITreeNode<T, TFilter>>,
        opts: IMultiTreeModelOptions<T, TFilter> = {}
    ) {
        super(rootData, new FlexIndexTreeModel<T, TFilter>(rootData, view, opts));
        this.onDidSplice = this._model.onDidSplice;
        this.onDidChangeCollapseState = this._model.onDidChangeCollapseState;
    }

    // [public methods]

    public refresh(
        node: IFlexNode<T, TFilter> = this.rootNode, 
        opts: ITreeModelSpliceOptions<T, TFilter> = {},
    ): void {
        // the actual refreshing
        this._model.refresh(
            node,
            this.__createSpliceOptions(opts),
        );
    }

    public triggerOnDidSplice(event: ITreeSpliceEvent<T, TFilter>): void {
        this._model.triggerOnDidSplice(event);
    }
}