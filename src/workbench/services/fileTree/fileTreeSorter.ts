import { IDisposable, Disposable } from "src/base/common/dispose";
import { CompareFn } from "src/base/common/utilities/type";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { FileItem, defaultFileItemCompareFn } from "src/workbench/services/fileTree/fileItem";
import { FileTreeCustomSorter, IFileTreeCustomSorter } from "src/workbench/services/fileTree/fileTreeCustomSorter";

/**
 * An interface only for {@link FileTreeSorter}.
 */
export interface IFileTreeSorter<TItem extends FileItem> extends IDisposable {
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
 * @class // TODO
 */
export class FileTreeSorter<TItem extends FileItem> extends Disposable implements IFileTreeSorter<TItem> {

    // [fields]

    private _compare: CompareFn<TItem> = defaultFileItemCompareFn;
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
        this._sortType = sortType;
        this._sortOrder = sortOrder;
        this._customSorter = instantiationService.createInstance(FileTreeCustomSorter);
        
        this.switchTo(sortType, sortOrder);
    }

    // [getter]

    public compare(a: TItem, b: TItem): number {
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
    
    // [private helper methods]
}

