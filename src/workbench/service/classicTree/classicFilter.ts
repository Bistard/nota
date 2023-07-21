import { ITreeFilterProvider, ITreeFilterResult } from "src/base/browser/secondary/tree/treeFilter";
import { ClassicItem } from "src/workbench/service/classicTree/classicItem";

/**
 * @class // TODO
 */
export class ClassicFilter<T extends ClassicItem> implements ITreeFilterProvider<T, any> /** FuzzyScore */ {

    // [field]

    // [constructor]

    constructor() {

    }

    // [public methods]

    public filter(item: ClassicItem): ITreeFilterResult<any> {
        return {
            visibility: true,
            filterMetadata: undefined,
        };
    }
}