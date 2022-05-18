import { ITreeNode } from "src/base/browser/basic/tree/tree";
import { IListViewRenderer } from "src/base/browser/secondary/listView/listRenderer";

/**
 * A type of renderer in {@link IListView} that manages to render tree related 
 * data.
 * 
 * T: the type of item for rendering.
 * TFilter: type of filter data for filtering nodes in the tree.
 * TMetadata: type of the user-defined value which returned value by the method 
 *            `render()` for later updating / disposing.
 */
export interface ITreeListViewRenderer<T, TFilter, TMetadata> extends IListViewRenderer<ITreeNode<T, TFilter>, TMetadata> {

    // TODO

}

/**
 * The type of data returned by {@link treeListViewRenderer.render()}.
 */
interface ITreeListItemMetadata<T> {
    container: HTMLElement;
    indentation: HTMLElement;
    content: HTMLElement;
    nestedMetadata: T;
}

/**
 * @class A basic type of renderer that manages to render each item in 
 * {@link IAbstractTree} as a tree node. It wraps another {@link ITreeListViewRenderer}
 * so that it can work as a decorator.
 * 
 * T: the type of item for rendering.
 * TFilter: type of filter data for filtering nodes in the tree.
 * TMetadata: type of the user-defined value which returned value by the method 
 *            `render()` for later updating / disposing.
 * 
 * @note Since we are wrapping another renderer, the TMetadata we are returning
 * is also a wrapper, see {@link ITreeListItemMetadata}.
 */
export class TreeListItemRenderer<T, TFilter, TMetadata> implements ITreeListViewRenderer<T, TFilter, ITreeListItemMetadata<TMetadata>> {

    // [field]

    public static readonly defaultIndentation = 8;

    public readonly type: number;

    private _renderer: ITreeListViewRenderer<T, TFilter, TMetadata>;

    private _eachIndentSize: number;

    // [constructor]

    constructor(
        nestedRenderer: ITreeListViewRenderer<T, TFilter, TMetadata>
    ) {
        this._renderer = nestedRenderer;
        this.type = this._renderer.type;
        this._eachIndentSize = TreeListItemRenderer.defaultIndentation;
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
        const indentSize = TreeListItemRenderer.defaultIndentation + (item.depth - 1) * this._eachIndentSize;

        data.indentation.style.width = `${indentSize}px`;

        this._renderer.update(item, index, data.nestedMetadata, size);
    }

    public dispose(data: ITreeListItemMetadata<TMetadata>): void {
        this._renderer.dispose(data.nestedMetadata);
    }

    // [private helper method]

}