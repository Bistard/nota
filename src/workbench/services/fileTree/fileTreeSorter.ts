import { IDisposable, Disposable } from "src/base/common/dispose";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { FileItem } from "src/workbench/services/fileTree/fileItem";
import { FileTreeCustomSorter } from "src/workbench/services/fileTree/fileTreeCustomSorter";

export interface IFileTreeSorter extends IDisposable {
    readonly compare: (a: FileItem, b: FileItem) => number;
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

export class FileTreeSorter extends Disposable {

    // [fields]
    private readonly _sortType: FileSortType;
    private readonly _customSorter: FileTreeCustomSorter;
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

    public readonly compare: (a: FileItem, b: FileItem) => number;

    // [public methods]


    // private methods
}

