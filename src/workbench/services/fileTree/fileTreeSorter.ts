import { Time } from "src/base/common/date";
import { IDisposable, Disposable } from "src/base/common/dispose";
import { FileType } from "src/base/common/files/file";
import { UnbufferedScheduler } from "src/base/common/utilities/async";
import { assert } from "src/base/common/utilities/panic";
import { Comparator, CompareOrder } from "src/base/common/utilities/type";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IFileItem, IFileTarget } from "src/workbench/services/fileTree/fileItem";
import { FileTreeCustomSorter, IFileTreeCustomSorter, IFileTreeCustomSorterOptions } from "src/workbench/services/fileTree/fileTreeCustomSorter";

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
    getCustomSorter(): IFileTreeCustomSorter<TItem> | null;
}

/**
 * @class This sorter supports different ways to sort file items. See more 
 * details at {@link FileSortType} and {@link FileSortOrder}.
 */
export class FileTreeSorter<TItem extends IFileItem<TItem>> extends Disposable implements IFileTreeSorter<TItem> {

    // [fields]

    private _compare!: Comparator<TItem>;
    
    private _sortType?: FileSortType;
    private _sortOrder?: FileSortOrder;
    
    private _customSorter?: FileTreeCustomSorter<TItem>;
    private _customSorterOpts: IFileTreeCustomSorterOptions;
    
    /**
     * A scheduler that prevent potential extra calculations if the 
     * {@link FileSortType} is switching frequently within a given time.
     * 
     * // TODO: chris (2025/1/8) i don't think this require a delay cleanup, it requires so tiny memory, might remove this.
     */
    private readonly _pendingCustomSorterDisposable: UnbufferedScheduler<void>;
    
    // [constructor]

    constructor(
        sortType: FileSortType,
        sortOrder: FileSortOrder,
        customSorterOpts: IFileTreeCustomSorterOptions,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
    ) {
        super();
        this._customSorterOpts = customSorterOpts;
        this._pendingCustomSorterDisposable = new UnbufferedScheduler(Time.sec(10), () => {
            this._customSorter = undefined;
        });
        
        this.switchTo(sortType, sortOrder);
        assert(this._sortType);
        assert(this._sortOrder);
        assert(this._compare);
    }

    // [getter]

    get sortOrder(): FileSortOrder {
        return assert(this._sortOrder);
    }

    get sortType(): FileSortType {
        return assert(this._sortType);
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

    public getCustomSorter(): IFileTreeCustomSorter<TItem> | null {
        if (!this._customSorter) {
            return null;
        }
        return this._customSorter;
    }

    // [private helper methods]

    /**
     * Ensure the new type and order are different than the current one when
     * invoking this method.
     */
    private __switchTo(sortType?: FileSortType, sortOrder?: FileSortOrder): void {
        this._sortType = sortType   ?? FileSortType.Custom;
        this._sortOrder = sortOrder ?? FileSortOrder.Ascending;

        if (this._sortType !== FileSortType.Custom) {
            this._pendingCustomSorterDisposable.schedule();
        }

        switch (this._sortType) {
            case FileSortType.Default:
                this._compare = this._sortOrder === FileSortOrder.Ascending ? defaultFileItemCompareFnAsc : defaultFileItemCompareFnDesc;
                break;
            case FileSortType.Alphabet:
                this._compare = this._sortOrder === FileSortOrder.Ascending ? compareByNameAsc : compareByNameDesc;
                break;
            case FileSortType.CreationTime:
                this._compare = this._sortOrder === FileSortOrder.Ascending ? compareByCreationTimeAsc : compareByCreationTimeDesc;
                break;
            case FileSortType.ModificationTime:
                this._compare = this._sortOrder === FileSortOrder.Ascending ? compareByModificationTimeAsc : compareByModificationTimeDesc;
                break;
            case FileSortType.Custom: {
                this._pendingCustomSorterDisposable.cancel();
                if (this._customSorter) {
                    break;
                }
                this._customSorter = this.instantiationService.createInstance(FileTreeCustomSorter, this._customSorterOpts);
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
export function defaultFileItemCompareFnAsc(a: IFileTarget, b: IFileTarget): number {
    if (a.type === b.type) {
        return (a.name < b.name) ? CompareOrder.First : CompareOrder.Second;
    } else if (a.type === FileType.DIRECTORY) {
        return CompareOrder.First;
    } else {
        return CompareOrder.Second;
    }
}

export function defaultFileItemCompareFnDesc(a: IFileTarget, b: IFileTarget): number {
    if (a.type === b.type) {
        return (a.name < b.name) ? CompareOrder.Second : CompareOrder.First;
    } else if (a.type === FileType.DIRECTORY) {
        return CompareOrder.First;
    } else {
        return CompareOrder.Second;
    }
}

// Alphabetical
function compareByNameAsc(a: IFileTarget, b: IFileTarget): CompareOrder {
    return a.name.localeCompare(b.name);
}

function compareByNameDesc(a: IFileTarget, b: IFileTarget): CompareOrder {
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
