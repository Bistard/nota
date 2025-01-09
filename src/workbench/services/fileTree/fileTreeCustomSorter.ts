import { Disposable, IDisposable } from "src/base/common/dispose";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { Comparator, CompareOrder } from "src/base/common/utilities/type";
import { IFileItem, IFileTarget } from "src/workbench/services/fileTree/fileItem";

/**
 * An interface only for {@link FileTreeCustomSorter}
 */
export interface IFileTreeCustomSorter<TItem extends IFileItem<TItem>> {

    /**
     * @description Compares two file tree items to determine their relative 
     * order. The comparison is based on a custom sort order defined in the 
     * metadata. If no custom order is specified, a default comparison function 
     * is used.
     * 
     * @param a The first file tree item to compare.
     * @param b The second file tree item to compare.
     * @returns A negative value if `a` should appear before `b`, 
     *          zero if their order is equivalent,
     *          or a positive value if `a` should appear after `b`.
     */
    compare(a: TItem, b: TItem): CompareOrder;
}

/**
 * An option for {@link FileTreeCustomSorter}.
 */
export interface IFileTreeCustomSorterOptions {

    /**
     * A default comparator to sort file names.
     */
    readonly defaultItemComparator: Comparator<IFileTarget>;

    /**
     * Required by the custom sorter. During two items comparison, the sorter 
     * needs to know which item goes first by the given array of items (string 
     * form).
     */
    readonly getMetadataFromCache: (folder: URI) => string[] | undefined;
}


export class FileTreeCustomSorter<TItem extends IFileItem<TItem>> implements IFileTreeCustomSorter<TItem> {
    
    // [fields]

    private readonly _defaultItemComparator: Comparator<IFileTarget>;
    private readonly _getMetadataFromCache: (folder: URI) => string[] | undefined;

    // [constructor]

    constructor(
        opts: IFileTreeCustomSorterOptions,
        @ILogService private readonly logService: ILogService,
    ) {
        this._defaultItemComparator = opts.defaultItemComparator;
        this._getMetadataFromCache = opts.getMetadataFromCache;
    }
    
    // [public methods]

    public compare(a: TItem, b: TItem): CompareOrder {
        const parent = a.parent!;

        const order = this._getMetadataFromCache(parent.uri);
        if (order === undefined) {
            return this._defaultItemComparator(a, b);
        }

        const indexA = order.indexOf(a.name);
        const indexB = order.indexOf(b.name);

        // Both item are found in the order, we compare them easily.
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        } 
        // Item B order info is not found, we put B at the end by default.
        else if (indexA !== -1) {
            this.logService.warn('FileTreeCustomSorter', 'ItemA is missing in custom order file');
            return CompareOrder.First;
        } 
        // Item A order info is not found, we put A at the end by default.
        else if (indexB !== -1) {
            this.logService.warn('FileTreeCustomSorter', 'ItemB is missing in custom order file');
            return CompareOrder.Second;
        } 
        // Both items are not found, item A and B will be sort as default.
        else {
            return this._defaultItemComparator(a, b);
        }
    }
}