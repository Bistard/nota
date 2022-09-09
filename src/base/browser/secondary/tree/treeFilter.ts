
export interface ITreeFilterResult<TFilter> {
    /**
     * The visibility of the item.
     */
    readonly visibility: boolean;
    
    /**
     * Metadata gets forwarded to the renderer.
     */
    readonly rendererMetadata?: TFilter;
}

export interface ITreeFilterProvider<T, TFilter = void> {

    /**
     * @description Returns a // TODO
     * @param item 
     */
    filter(item: T): ITreeFilterResult<TFilter>;
}