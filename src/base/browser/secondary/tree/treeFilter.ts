
export interface ITreeFilterResult<TFilter> {
    /**
     * The visibility of the item.
     */
    readonly visibility: boolean;
    
    /**
     * Metadata gets forwarded to the renderer.
     */
    readonly filterMetadata?: TFilter;
}

/**
 * A tree filter provider decides whether the given item should be visible or 
 * filtered.
 */
export interface ITreeFilterProvider<T, TFilter> {

    /**
     * @description A tree filter provider decides whether the given item should 
     * be visible or filtered.
     * @param item The given item.
     * @returns A filter result.
     */
    filter(item: T): ITreeFilterResult<TFilter>;
}