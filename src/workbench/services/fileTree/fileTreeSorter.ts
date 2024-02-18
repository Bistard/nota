import { IDisposable, Disposable } from "src/base/common/dispose";
import { CompareFn, CompareOrder } from "src/base/common/utilities/type";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IFileItem, defaultFileItemCompareFn } from "src/workbench/services/fileTree/fileItem";
import { FileTreeCustomSorter, IFileTreeCustomSorter } from "src/workbench/services/fileTree/fileTreeCustomSorter";

/**
 * An interface only for {@link FileTreeSorter}.
 */
export interface IFileTreeSorter<TItem extends IFileItem<TItem>> extends IDisposable {
    
    compare(a: TItem, b: TItem): number;
    setType(sortType: FileSortType): void;
    setOrder(sortOrder: FileSortOrder): void;
    switchTo(sortType: FileSortType, sortOrder: FileSortOrder): void;
}

export const enum FileSortType {
    Default = 'default',
    Alphabet = 'alphabet',
    CreationTime = 'creationTime',
    ModificationTime = 'modificationTime',
    Custom = 'custom',
}

export const enum FileSortOrder {
    Ascending = 'ascending',
    Descending = 'descending',
}

/**
 * @class This sorter supports different ways to sort file items. See more 
 * details at {@link FileSortType} and {@link FileSortOrder}.
 */
export class FileTreeSorter<TItem extends IFileItem<TItem>> extends Disposable implements IFileTreeSorter<TItem> {

    // [fields]

    private _compare: CompareFn<TItem>;
    private readonly _sortType: FileSortType;
    private readonly _sortOrder: FileSortOrder;
    private readonly _customSorter: IFileTreeCustomSorter<TItem>;
    
    // [constructor]

    constructor(
        instantiationService: IInstantiationService,
        sortType: FileSortType,
        sortOrder: FileSortOrder,
    ) {
        super();

        this._compare = defaultFileItemCompareFn;
        this._sortType = sortType;
        this._sortOrder = sortOrder;
        this._customSorter = instantiationService.createInstance(FileTreeCustomSorter);
        
        this.switchTo(sortType, sortOrder);
    }

    // [getter]

    public compare(a: TItem, b: TItem): CompareOrder {
        return this._compare(a, b);
    }

    // [public methods]

    public setType(sortType: FileSortType): void {
        this.switchTo(sortType, this._sortOrder);
    }

    public setOrder(sortOrder: FileSortOrder): void {
        this.switchTo(this._sortType, sortOrder);
    }

    public switchTo(sortType: FileSortType, sortOrder: FileSortOrder): void {
        switch (sortType) {
            case FileSortType.Default:
                this._compare = defaultFileItemCompareFn;
                break;
            case FileSortType.Alphabet:
                this._compare = undefined!; // TODO
                break;
            case FileSortType.CreationTime:
                this._compare = undefined!; // TODO
                break;
            case FileSortType.ModificationTime:
                this._compare = undefined!; // TODO
                break;
            case FileSortType.Custom:
                this._compare = this._customSorter.compare.bind(this._customSorter);
                break;
        }
    }

    public async initCustomSorter(folder: TItem): Promise<void> {
        return this._customSorter.safeLoadSortOrder(folder);
    }
    
    // [private helper methods]

    
}

