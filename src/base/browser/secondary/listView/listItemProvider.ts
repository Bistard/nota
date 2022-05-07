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
