import { Time } from "src/base/common/date";
import { IDisposable, Disposable } from "src/base/common/dispose";
import { URI } from "src/base/common/files/uri";
import { panic } from "src/base/common/result";
import { UnbufferedScheduler } from "src/base/common/utilities/async";
import { generateMD5Hash } from "src/base/common/utilities/hash";
import { CompareFn, CompareOrder } from "src/base/common/utilities/type";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IFileItem } from "src/workbench/services/fileTree/fileItem";
import { FileTreeCustomSorter, IFileTreeCustomSorter } from "src/workbench/services/fileTree/fileTreeCustomSorter";

/**
 * Enum for specifying the type of sorting to apply to files/folders.
 */
export const enum FileSortType {
    Default = 'default',
    Alphabet = 'alphabet',
    CreationTime = 'creationTime',
    ModificationTime = 'modificationTime',
    Custom = 'custom',
}

/**
 * Enum for defining the order in which files/folders are sorted.
 */
export const enum FileSortOrder {
    Ascending = 'ascending',
    Descending = 'descending',
}

/**
 * An interface only for {@link FileTreeSorter}.
 */
export interface IFileTreeSorter<TItem extends IFileItem<TItem>> extends IDisposable {
    
    /**
     * The current sorting order.
     */
    readonly sortOrder: FileSortOrder;
    
    /**
     * The current sorting type.
     */
    readonly sortType: FileSortType;

    /**
    * @description A function that compares two {@link TItem} objects. The 
    * comparison logic adapts dynamically according to the {@link sortOrder} and 
    * {@link sortType}.
    */
    compare(a: TItem, b: TItem): CompareOrder;
    
    /**
    * @description Updates the current {@link FileSortType} to the specified 
    * type.
    * @returns A boolean indicating whether the update was successful.
    */
    setType(sortType: FileSortType): boolean;

    /**
    * @description Updates the current {@link FileSortOrder} to the specified 
    * order. 
    * @returns A boolean indicating whether the update was successful.
    */
    setOrder(sortOrder: FileSortOrder): boolean;

    /**
     * @description Updates the sorting settings to the specified type and order.
     * @returns A boolean indicating whether the update was successful.
     */
    switchTo(sortType: FileSortType, sortOrder: FileSortOrder): boolean;

    /**
     * @internal
     * @description Exposing the internal custom sorter. Only invoke this if you
     * know what you are doing exactly.
     */
    getCustomSorter(): IFileTreeCustomSorter<TItem>;
}

/**
 * @class This sorter supports different ways to sort file items. See more 
 * details at {@link FileSortType} and {@link FileSortOrder}.
 */
export class FileTreeSorter<TItem extends IFileItem<TItem>> extends Disposable implements IFileTreeSorter<TItem> {

    // [fields]

    private _compare!: CompareFn<TItem>;
    private _sortType!: FileSortType;
    private _sortOrder!: FileSortOrder;
    
    private _customSorter?: IFileTreeCustomSorter<TItem>;
    
    /**
     * A scheduler that prevent potential extra calculations if the 
     * {@link FileSortType} is switching frequently within a given time.
     */
    private readonly _pendingCustomSorterDisposable: UnbufferedScheduler<void>;
    
    // [constructor]

    constructor(
        sortType: FileSortType,
        sortOrder: FileSortOrder,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
    ) {
        super();
        this._pendingCustomSorterDisposable = new UnbufferedScheduler(Time.sec(10), () => {
            this._customSorter?.dispose();
            this._customSorter = undefined;
        });
        this.switchTo(sortType, sortOrder);
    }

    // [getter]

    get sortOrder(): FileSortOrder {
        return this._sortOrder;
    }

    get sortType(): FileSortType {
        return this._sortType;
    }

    public compare(a: TItem, b: TItem): CompareOrder {
        return this._compare(a, b);
    }

    // [public methods]

    public setType(sortType: FileSortType): boolean {
        if (this._sortType === sortType) {
            return false;
        }
        this.__switchTo(sortType, this._sortOrder);
        return true;
    }

    public setOrder(sortOrder: FileSortOrder): boolean {
        if (this._sortOrder === sortOrder) {
            return false;
        }
        this.__switchTo(this._sortType, sortOrder);
        return true;
    }

    public switchTo(sortType: FileSortType, sortOrder: FileSortOrder): boolean {
        if (this._sortType === sortType && this._sortOrder === sortOrder) {
            return false;
        }
        this.__switchTo(sortType, sortOrder);
        return true;
    }

    public getCustomSorter(): IFileTreeCustomSorter<TItem> {
        if (!this._customSorter) {
            panic(`[FileItemOrder] customSorter is undefined. Current sorting type is: '${this._sortType}'`);
        }
        return this._customSorter;
    }

    // [private helper methods]

    /**
     * Ensure the new type and order are different than the current one when
     * invoking this method.
     */
    private __switchTo(sortType: FileSortType, sortOrder: FileSortOrder): void {
        this._sortType = sortType;
        this._sortOrder = sortOrder;

        if (sortType !== FileSortType.Custom) {
            this._pendingCustomSorterDisposable.schedule();
        }

        switch (sortType) {
            case FileSortType.Default:
                this._compare = sortOrder === FileSortOrder.Ascending ? defaultFileItemCompareFnAsc : defaultFileItemCompareFnDesc;
                break;
            case FileSortType.Alphabet:
                this._compare = sortOrder === FileSortOrder.Ascending ? compareByNameAsc : compareByNameDesc;
                break;
            case FileSortType.CreationTime:
                this._compare = sortOrder === FileSortOrder.Ascending ? compareByCreationTimeAsc : compareByCreationTimeDesc;
                break;
            case FileSortType.ModificationTime:
                this._compare = sortOrder === FileSortOrder.Ascending ? compareByModificationTimeAsc : compareByModificationTimeDesc;
                break;
            case FileSortType.Custom: {
                this._pendingCustomSorterDisposable.cancel();
                if (this._customSorter) {
                    break;
                }

                const metadataRoot = URI.join(this.environmentService.appConfigurationPath, 'sortings');
                this._customSorter = this.instantiationService.createInstance(FileTreeCustomSorter, {
                    metadataRootPath: metadataRoot,
                    hash: generateMD5Hash,
                    defaultComparator: (...args) => {
                        const cmp = this.sortOrder === FileSortOrder.Ascending ? defaultFileItemCompareFnAsc : defaultFileItemCompareFnDesc;
                        return cmp(...args);
                    },
                });
                this._compare = this._customSorter.compare.bind(this._customSorter);
                break;
            }
        }
    }
}

/**
 * @description Directory goes first, files sorts in ascending, ASCII
 * character order.
 */
export const defaultFileItemCompareFn = defaultFileItemCompareFnAsc;

// Default
function defaultFileItemCompareFnAsc<TItem extends IFileItem<TItem>>(a: TItem, b: TItem): number {
    if (a.type === b.type) {
        return (a.name < b.name) ? CompareOrder.First : CompareOrder.Second;
    } else if (a.isDirectory()) {
        return CompareOrder.First;
    } else {
        return CompareOrder.Second;
    }
}

function defaultFileItemCompareFnDesc<TItem extends IFileItem<TItem>>(a: TItem, b: TItem): number {
    if (a.type === b.type) {
        return (a.name < b.name) ? CompareOrder.Second : CompareOrder.First;
    } else if (a.isDirectory()) {
        return CompareOrder.First;
    } else {
        return CompareOrder.Second;
    }
}

// Alphabetical
function compareByNameAsc<TItem extends IFileItem<TItem>>(a: TItem, b: TItem): CompareOrder {
    return a.name.localeCompare(b.name);
}

function compareByNameDesc<TItem extends IFileItem<TItem>>(a: TItem, b: TItem): CompareOrder {
    return b.name.localeCompare(a.name);
}

// Creation time
function compareByCreationTimeAsc<TItem extends IFileItem<TItem>>(a: TItem, b: TItem): CompareOrder {
    return a.createTime - b.createTime;
}

function compareByCreationTimeDesc<TItem extends IFileItem<TItem>>(a: TItem, b: TItem): CompareOrder {
    return b.createTime - a.createTime;
}

// Modification time
function compareByModificationTimeAsc<TItem extends IFileItem<TItem>>(a: TItem, b: TItem): CompareOrder {
    return a.modifyTime - b.modifyTime;
}

function compareByModificationTimeDesc<TItem extends IFileItem<TItem>>(a: TItem, b: TItem): CompareOrder {
    return b.modifyTime - a.modifyTime;
}
