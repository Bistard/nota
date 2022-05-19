import { ITreeNode } from "src/base/browser/secondary/tree/tree";
import { ListItemType } from "./listView";


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
    getType(data: T): ListItemType;
}

/**
 * @class A wrapper class simply for {@link IListItemProvider}. It simply converts
 * the functionality of object with type {@link IListItemProvider<T>} to 
 * {@link IListItemProvider<ITreeNode<T>>}.
 */
export class TreeListItemProvider<T> implements IListItemProvider<ITreeNode<T>> {

    // [field]

    private _provider: IListItemProvider<T>;

    // [constructor]

    constructor(provider: IListItemProvider<T>) {
        this._provider = provider;
    }

    // [public method]

    
    public getSize(node: ITreeNode<T>): number {
        return this._provider.getSize(node.data);
    }

    public getType(node: ITreeNode<T>): ListItemType {
        return this._provider.getType(node.data);
    }

}

/**
 * @class A simple wrapper class that wraps a {@link IListItemProvider<T>} so 
 * that the APIs may given the node with type `R` that contains a type `T`, 
 * instead of just using `T`.
 * 
 * `R`: another type that wraps a type `T` used a field named `data`.
 */
 export class composedItemProvider<T, R extends { data: T }> implements IListItemProvider<R> {

    private _provider: IListItemProvider<T>;

    constructor(itemProvider: IListItemProvider<T>) {
        this._provider = itemProvider;
    }

    getSize(data: R): number {
        return this._provider.getSize(data.data);
    }

    getType(data: R): number {
        return this._provider.getType(data.data);
    }

}