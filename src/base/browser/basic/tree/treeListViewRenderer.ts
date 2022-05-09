import { IListViewRenderer } from "src/base/browser/secondary/listView/listRenderer";

/**
 * A type of renderer in {@link IListView} that manages to render tree related 
 * data.
 */
export interface ITreeListViewRenderer<T, TFilter> extends IListViewRenderer<T> {

    // TODO

}

/**
 * @class Type of {@link ITreeListViewRenderer} that wraps another
 * {@link ITreeListViewRenderer}.
 */
export class TreeListViewRenderer<T, TFilter> implements ITreeListViewRenderer<T, TFilter> {

    // [field]

    public readonly type: number;

    private _renderer: ITreeListViewRenderer<T, TFilter>;

    // [constructor]

    constructor(
        nestedRenderer: ITreeListViewRenderer<T, TFilter>
    ) {
        this._renderer = nestedRenderer;
        this.type = this._renderer.type;
    }

    // [method]

    public render(element: HTMLElement): void {
        
    }

    public update(element: HTMLElement, index: number, data: T, size?: number): void {
        
    }

    public dispose(element: HTMLElement): void {
        
    }

    // [private helper method]

}