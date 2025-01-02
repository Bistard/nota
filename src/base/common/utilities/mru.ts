
/**
 * Interface for a Most Recently Used ({@link MRU}) list.
 */
export interface IMRU<T> {
    /**
     * Returns the number of items in the MRU list.
     */
    readonly length: number;

    /**
     * @description Retrieves all items in the MRU list, ordered from most 
     * recently used to least recently used.
     * @returns A new array containing the items in MRU order.
     */
    getItems(): T[];

    /**
     * @description Retrieves the most recent item in the MRU list.
     */
    getRecentItem(): T | undefined;

    /**
     * @description Marks the given item as used, moving it to the most recently 
     * used position. If the item is not in the list, it will be added as most
     * recently used.
     * @param item The item to mark as used.
     */
    use(item: T): void;

    /**
     * @description Removes the specified item from the MRU list.
     * @param item The item to remove.
     * @returns `true` if removed, `false` if not found.
     */
    remove(item: T): boolean;
}

export class MRU<T> implements IMRU<T> {
    // [fields]

    private readonly _items: T[];
    private readonly _cmp: (a: T, b: T) => boolean;

    // [constructor]

    constructor(
        compareFn?: (a: T, b: T) => boolean,
        initialItems?: T[], 
    ) {
        this._items = initialItems ?? [];
        this._cmp = compareFn ?? ((a, b) => a === b);
    }

    // [getter]

    public get length(): number {
        return this._items.length;
    }

    // [public methods]

    public getItems(): T[] {
        return [...this._items];
    }

    public getRecentItem(): T | undefined {
        return this._items[0];
    }

    public use(item: T): void {
        const index = this._items.findIndex(existingItem => this._cmp(existingItem, item));
        if (index !== -1) {
            // Remove the item from its current position
            this._items.splice(index, 1);
        }
        // Add the item to the front of the list
        this._items.unshift(item);
    }

    public remove(item: T): boolean {
        const index = this._items.findIndex(existingItem => this._cmp(existingItem, item));
        if (index !== -1) {
            this._items.splice(index, 1);
            return true;
        }
        return false;
    }
}
