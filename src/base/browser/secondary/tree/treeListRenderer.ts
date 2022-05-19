import { ITreeNode } from "src/base/browser/secondary/tree/tree";
import { IListViewMetadata, IListViewRenderer, RendererType } from "src/base/browser/secondary/listView/listRenderer";

/**
 * A basic type of renderer in {@link IListView} that manages to render tree 
 * related data.
 * 
 * T: the type of item for rendering.
 * TFilter: type of filter data for filtering nodes in the tree.
 * TMetadata: type of the user-defined value which returned value by the method 
 *            `render()` for later updating / disposing.
 */
export interface ITreeListRenderer<T, TFilter = void, TMetadata = void> extends IListViewRenderer<ITreeNode<T, TFilter>, TMetadata> {

    /**
     * @description Renders the indentation part if needed.
     * @param item The tree node with type T for updating.
     * @param indentElement The HTMLElement of the indentation.
     * 
     * @note This method only invoked when (re)inserting the item back to the {@link ListView}.
     */
    updateIndent?(item: ITreeNode<T, TFilter>, indentElement: HTMLElement): void;

}

/**
 * The type of metadata returned by {@link treeListViewRenderer.render()}.
 */
export interface ITreeListItemMetadata<T> extends IListViewMetadata {
    
    /**
     * The HTMLElement container of the indentation part.
     */
    indentation: HTMLElement;

    /**
     * The HTMLElement container of the content part.
     */
    content: HTMLElement;

    /**
     * Nested renderer's metadata.
     */
    nestedMetadata: T;
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

    public static readonly defaultIndentation = 4;

    public readonly type: RendererType;

    private _renderer: ITreeListRenderer<T, TFilter, TMetadata>;

    private _eachIndentSize: number;

    // [constructor]

    constructor(
        nestedRenderer: ITreeListRenderer<T, TFilter, TMetadata>
    ) {
        this._renderer = nestedRenderer;
        this.type = this._renderer.type;
        this._eachIndentSize = TreeItemRenderer.defaultIndentation;
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
        const indentation = document.createElement('div');
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
        
        const indentSize = TreeItemRenderer.defaultIndentation + (item.depth - 1) * this._eachIndentSize;
        data.indentation.style.paddingLeft = `${indentSize}px`;

        this.updateIndent(item, data.indentation);

        this._renderer.update(item, index, data.nestedMetadata, size);
    }

    public updateIndent(item: ITreeNode<T, TFilter>, indentElement: HTMLElement): void {

        if (item.collapsible && item.visibleNodeCount > 0) {
            indentElement.classList.add('collapsible');
            indentElement.classList.toggle('collapsed', item.collapsed);
        } else {
            indentElement.classList.remove('collapsible', 'collapsed');
        }

        if (this._renderer.updateIndent) {
            this._renderer.updateIndent(item, indentElement);
        }

    }

    public dispose(data: ITreeListItemMetadata<TMetadata>): void {
        this._renderer.dispose(data.nestedMetadata);
    }

    // [private helper method]

}