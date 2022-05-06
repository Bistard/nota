import { ListItemType } from "./listView";


/**
 * The provider provides the corresponding size and type of the given data with 
 * type T inside a list.
 */
export interface IListItemProvider<T> {
    getSize(data: T): number;
    getType(data: T): ListItemType;
}
