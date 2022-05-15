import { AsyncWeakMap, IAsyncTreeNode } from "src/base/browser/basic/tree/asyncMultiTree";
import { ITreeListViewRenderer } from "src/base/browser/basic/tree/treeListViewRenderer";
import { ITreeNode } from "src/base/common/tree/tree";

/**
 * @class A wrapper class that wraps another {@link ITreeListViewRenderer} with 
 * template type `<T>` so that it can also work with the type `<IAsyncTreeNode<T>>`.
 */
export class AsyncTreeRenderer<T, TFilter, TMetadata> implements ITreeListViewRenderer<IAsyncTreeNode<T>, TFilter, TMetadata> {

    public readonly type: number;
    private _renderer: ITreeListViewRenderer<T, TFilter, TMetadata>;
    private _nodeMap: AsyncWeakMap<T, TFilter>;

    constructor(
        renderer: ITreeListViewRenderer<T, TFilter, TMetadata>,
        nodeMap: AsyncWeakMap<T, TFilter>
    ) {
        this.type = renderer.type;
        this._renderer = renderer;
        this._nodeMap = nodeMap;
    }

    render(element: HTMLElement): TMetadata {
        return this._renderer.render(element);
    }

    update(item: ITreeNode<IAsyncTreeNode<T>, TFilter>, index: number, data: TMetadata, size?: number): void {
        this._renderer.update(this._nodeMap.map(item), index, data, size);
    }

    dispose(data: TMetadata): void {
        this._renderer.dispose(data);
    }

}