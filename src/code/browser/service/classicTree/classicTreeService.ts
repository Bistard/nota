import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ITreeService } from "src/code/browser/service/explorerTree/explorerTreeService";
import { IClassicTree } from "src/code/browser/service/classicTree/classicTree";
import { IFileService } from "src/code/platform/files/common/fileService";
import { ClassicItem } from "src/code/browser/service/classicTree/classicItem";

export interface IClassicTreeService extends ITreeService {

}

/**
 * // TODO
 */
export class ClassicTreeService implements IClassicTreeService {

    // [field]

    private _tree!: IClassicTree<ClassicItem, void>;

    // [constructor]

    constructor(
        @IFileService private readonly fileService: IFileService,
    ) {

    }

    // [getter]

    // [public mehtods]

    // [private helper methods]

}