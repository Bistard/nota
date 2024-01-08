import { IDisposable, Disposable } from "src/base/common/dispose";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { FileItem } from "src/workbench/services/fileTree/fileItem";
import { FileTreeCustomSorter, IFileTreeCustomSorter } from "src/workbench/services/fileTree/fileTreeCustomSorter";

export interface IFileTreeSorter<TItem extends FileItem> extends IDisposable {

    readonly compare: (a: TItem, b: TItem) => number;
}

// TODO: @AAsteria
// TODO: @duckSoup0203

export const enum FileSortType {
    DefaultSystemSort = 'DefaultSystemSort',
    NameAscending = 'NameAscending',
    NameDescending = 'NameDescending',
    CreationTimeAscending = 'CreationTimeAscending',
    CreationTimeDescending = 'CreationTimeDescending',
    ModificationTimeAscending = 'ModificationTimeAscending',
    ModificationTimeDescending = 'ModificationTimeDescending',
    CustomSort = 'CustomSort',
}

/**
 * @class // TODO
 */
export class FileTreeSorter<TItem extends FileItem> extends Disposable implements IFileTreeSorter<TItem> {

    // [fields]

    private readonly _sortType: FileSortType;
    private readonly _customSorter: IFileTreeCustomSorter<TItem>;
    
    // [constructor]

    constructor(
        instantiationService: IInstantiationService,
        sortType: FileSortType,
    ) {
        super();
        this._sortType = sortType;
        this._customSorter = instantiationService.createInstance(FileTreeCustomSorter);
        
        // switch case
        this.compare = this._customSorter.compare.bind(this._customSorter);
    }

    // [getter]

    public readonly compare: (a: TItem, b: TItem) => number;

    // [public methods]

}

