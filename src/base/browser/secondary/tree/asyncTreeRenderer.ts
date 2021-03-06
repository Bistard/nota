import { AsyncWeakMap, IAsyncTreeNode } from "src/base/browser/secondary/tree/asyncMultiTree";
import { ITreeNode } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";

/**
 * @class A wrapper class that wraps another {@link ITreeListRenderer} with 
 * template type `<T>` so that it can also work with the type `<IAsyncTreeNode<T>>`.
 */
export class AsyncTreeRenderer<T, TFilter, TMetadata> implements ITreeListRenderer<IAsyncTreeNode<T>, TFilter, TMetadata> {

    public readonly type: number;
    private _renderer: ITreeListRenderer<T, TFilter, TMetadata>;
    private _nodeMap: AsyncWeakMap<T, TFilter>;

    constructor(
        renderer: ITreeListRenderer<T, TFilter, TMetadata>,
        nodeMap: AsyncWeakMap<T, TFilter>
    ) {
        this.type = renderer.type;
        this._renderer = renderer;
        this._nodeMap = nodeMap;
    }

    public render(element: HTMLElement): TMetadata {
        return this._renderer.render(element);
    }

    public update(item: ITreeNode<IAsyncTreeNode<T>, TFilter>, index: number, data: TMetadata, size?: number): void {
        this._renderer.update(this._nodeMap.map(item), index, data, size);
    }

    public updateIndent(item: ITreeNode<IAsyncTreeNode<T>, TFilter>, indentElement: HTMLElement): void {
        if (this._renderer.updateIndent) {
            this._renderer.updateIndent(this._nodeMap.map(item), indentElement);
        }
    }

    public dispose(data: TMetadata): void {
        this._renderer.dispose(data);
    }

}