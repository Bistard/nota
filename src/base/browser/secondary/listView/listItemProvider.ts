import { RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { ITreeNode } from "src/base/browser/secondary/tree/tree";

/**
 * The provider provides the corresponding size and type of the given data with 
 * type T inside a {@link IListView}.
 * 
 * It provides the ability for the user to define the sizes and types outside of
 * the {@link IListView}.
 */
export interface IListItemProvider<T> {
    
    /**
     * Returns the size of the given data in the {@link IListView}.
     * @param data The provided data.
     */
    getSize(data: T): number;

    /**
     * Returns the type of the given data in the {@link IListView}.
     * @param data The provided data.
     */
    getType(data: T): RendererType;
}

/**
 * @class A wrapper class simply for {@link IListItemProvider}. It simply converts
 * the functionality of object with type {@link IListItemProvider<T>} to 
 * {@link IListItemProvider<ITreeNode<T>>}.
 */
export class TreeListItemProvider<T, TFilter> implements IListItemProvider<ITreeNode<T, TFilter>> {

    // [field]

    private _provider: IListItemProvider<T>;

    // [constructor]

    constructor(provider: IListItemProvider<T>) {
        this._provider = provider;
    }

    // [public method]
    
    public getSize(node: ITreeNode<T, TFilter>): number {
        return this._provider.getSize(node.data);
    }

    public getType(node: ITreeNode<T, TFilter>): RendererType {
        return this._provider.getType(node.data);
    }
}
