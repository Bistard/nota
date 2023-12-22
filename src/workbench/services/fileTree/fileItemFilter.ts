import { ITreeFilterProvider, ITreeFilterResult } from "src/base/browser/secondary/tree/treeFilter";
import { FileItem } from "src/workbench/services/fileTree/fileItem";

/**
 * @class // TODO
 */
export class FileItemFilter<T extends FileItem> implements ITreeFilterProvider<T, any> /** FuzzyScore */ {

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