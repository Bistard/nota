import { ITreeCollapseStateChangeEvent, ITreeNode } from "src/base/browser/secondary/tree/tree";
import { IListViewMetadata, IListViewRenderer, RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { Register } from "src/base/common/event";
import { check } from "src/base/common/utilities/panic";
import { requestAtNextAnimationFrame } from "src/base/browser/basic/animation";
import { IDisposable } from "src/base/common/dispose";

/**
 * A basic type of renderer in {@link IListView} that manages to render tree 
 * related data.
 * 
 * T: the type of item for rendering.
 * TFilter: type of filter data for filtering nodes in the tree.
 * TMetadata: type of the user-defined value which returned value by the method 
 *            `render()` for later updating / disposing.
 */
export interface ITreeListRenderer<T, TFilter, TMetadata = void> extends IListViewRenderer<ITreeNode<T, TFilter>, TMetadata> {

    /**
     * @description Renders the indentation part if needed.
     * @param item The tree node with type T for updating.
     * @param indentElement The HTMLElement of the indentation.
     * 
     * @note This method only invoked when (re)inserting the item back to the {@link ListView}.
     */
    updateIndent?(item: ITreeNode<T, TFilter>, indentElement: HTMLElement): void;

    /**
     * Will fire automatically when the tree node collapse state is changed.
     * 
     * @note From now on renderer may responses to the change of node collapse 
     * state change.
     */
    onDidChangeCollapseState?: Register<T>;
}

/**
 * The type of metadata returned by {@link treeListViewRenderer.render()}.
 */
export interface ITreeListItemMetadata<T> extends IListViewMetadata {
    
    /**
     * The HTMLElement container of the indentation part.
     */
    readonly indentation: HTMLElement;

    /**
     * The HTMLElement container of the content part.
     */
    readonly content: HTMLElement;

    /**
     * Nested renderer's metadata.
     */
    readonly nestedMetadata: T;
}

/**
 * @class A basic type of renderer that manages to render each item in 
 * {@link IAbstractTree} as a tree node. It wraps another {@link ITreeListRenderer}
 * so that it can work as a decorator.
 * 
 * T: the type of item for rendering.
 * TFilter: type of filter data for filtering nodes in the tree.
 * TMetadata: type of the user-defined value which returned value by the method 
 *            `render()` for later updating / disposing.
 * 
 * @note Since we are wrapping another renderer, the TMetadata we are returning
 * is also a wrapper, see {@link ITreeListItemMetadata}.
 * 
 * @warn EXPORT FOR OTHER MODULES USAGE, DO NOT USE DIRECTLY.
 */
export class TreeItemRenderer<T, TFilter, TMetadata> implements ITreeListRenderer<T, TFilter, ITreeListItemMetadata<TMetadata>> {

    // [field]

    public static readonly defaultIndentation = 16;
    public readonly type: RendererType;

    /** the nested renderer. */
    private readonly _renderer: ITreeListRenderer<T, TFilter, TMetadata>;

    private _eachIndentSize: number;

    /** 
     * we need to stores the metadata so that once the collapse state changed, 
     * we still have a way to access the metadata. 
     */
    private readonly _nodeMap = new Map<T, ITreeNode<T, TFilter>>();
    private readonly _metadataMap = new Map<ITreeNode<T, TFilter>, ITreeListItemMetadata<TMetadata>>();

    // [constructor]

    constructor(
        nestedRenderer: ITreeListRenderer<T, TFilter, TMetadata>,
        onDidChangeCollapseState: Register<ITreeCollapseStateChangeEvent<T, TFilter>>,
        registerDisposable: (o: IDisposable) => void,
    ) {
        this._renderer = nestedRenderer;
        this.type = this._renderer.type;
        this._eachIndentSize = TreeItemRenderer.defaultIndentation;

        // listen to the outer event
        registerDisposable(onDidChangeCollapseState(e => this.__doDidChangeCollapseState(e.node)));

        // listen to the nested renderer
        if (nestedRenderer.onDidChangeCollapseState) {
            registerDisposable(nestedRenderer.onDidChangeCollapseState(e => this.__didChangeCollapseStateByData(e)));
        }
    }

    // [public method]

    public setEachIndentSize(size: number): void {
        this._eachIndentSize = size;
    }

    public render(element: HTMLElement): ITreeListItemMetadata<TMetadata> {
        
        /** A simple container */
        const row = document.createElement('div');
        row.className = 'tree-list-row';

        /** Rendering the indentation of the node in the tree. */
        const indentation = document.createElement('i');
        indentation.className = 'tree-list-indent';

        /** A wrapper to contains the actual content. */
        const content = document.createElement('div');
        content.className = 'tree-list-content';

        const metadata = this._renderer.render(content);

        row.appendChild(indentation);
        row.appendChild(content);
        element.appendChild(row);

        return {
            container: element,
            indentation: indentation,
            content: content,
            nestedMetadata: metadata
        };
    }

    public update(item: ITreeNode<T, TFilter>, index: number, data: ITreeListItemMetadata<TMetadata>, size?: number): void {
        
        /**
         * representing we are inserting the item into the tree, so we need to 
         * store the metadata for later on did change collapse state usage.
         */
        if (typeof size === 'number') {
            this._nodeMap.set(item.data, item);
            this._metadataMap.set(item, data);
        }

        const indentSize = TreeItemRenderer.defaultIndentation + (item.depth - 1) * this._eachIndentSize;
        data.indentation.style.paddingLeft = `${indentSize}px`;

        this.updateIndent(item, data.indentation);

        this._renderer.update(item, index, data.nestedMetadata, size);
    }

    public updateIndent(item: ITreeNode<T, TFilter>, indentElement: HTMLElement): void {
        check(item.visible);
        check(item.visibleNodeCount >= 1);
        
        if (item.collapsible) {
            indentElement.classList.add('collapsible');
            
            /**
             * // TODO: doc
             */
            indentElement.classList.add('collapsed');
            if (item.collapsed === false) {
                requestAtNextAnimationFrame(() => indentElement.classList.remove('collapsed'));
            }
        } else {
            indentElement.classList.remove('collapsible', 'collapsed');
        }

        this._renderer.updateIndent?.(item, indentElement);
    }

    public disposeData(item: ITreeNode<T, TFilter>, index: number, data: ITreeListItemMetadata<TMetadata>, size?: number): void {
        if (typeof size === 'number') {
            this._nodeMap.delete(item.data);
            this._metadataMap.delete(item);
        }

        this._renderer.disposeData?.(item, index, data.nestedMetadata, size);
    }

    public dispose(data: ITreeListItemMetadata<TMetadata>): void {
        this._renderer.dispose(data.nestedMetadata);
    }

    // [private helper method]

    private __didChangeCollapseStateByData(data: T): void {
        const node = this._nodeMap.get(data);
        
        // the node which changed its collapse state is not rendering, we ignore it.
        if (node === undefined) {
            return;
        }

        this.__doDidChangeCollapseState(node);
    }

    private __doDidChangeCollapseState(node: ITreeNode<T, TFilter>): void {        
        const metadata = this._metadataMap.get(node);
        if (metadata === undefined) {
            return;
        }

        this.updateIndent(node, metadata.indentation);
    }
}