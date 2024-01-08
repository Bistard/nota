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
    ModificationTimeDescending= 'ModificationTimeDescending',
    CustomSort = 'CustomSort',
}

export class FileTreeSorter extends Disposable {

    // [fields]
    private _sortType: FileSortType;
    private instantiationService: IInstantiationService;
    private _customSorter: FileTreeCustomSorter;
    // [constructor]

    constructor(
        instantiationService: IInstantiationService,
        sortType: FileSortType,
    ) {
        super();
        this.instantiationService = instantiationService;
        this._sortType = sortType;

        this._customSorter = this.instantiationService.createInstance(FileTreeCustomSorter);
        // swich case
        // this.compare
        this.compare = this._customSorter.compare;
    }

    // [getter]

    public readonly compare: (a: FileItem, b: FileItem) => number;

    // [public methods]

}