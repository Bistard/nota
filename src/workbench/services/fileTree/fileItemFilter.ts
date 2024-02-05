import { ITreeFilterProvider, ITreeFilterResult } from "src/base/browser/secondary/tree/treeFilter";
import { FuzzyScore } from "src/base/common/fuzzy";
import { FileItem } from "src/workbench/services/fileTree/fileItem";

/**
 * @class // TODO
 */
export class FileItemFilter implements ITreeFilterProvider<FileItem, FuzzyScore> {

    // [field]

    // [constructor]

    constructor() {

    }

    // [public methods]

    public filter(item: FileItem): ITreeFilterResult<any> {
        return {
            visibility: true,
            filterMetadata: undefined,
        };
    }
}