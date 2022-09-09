import { ITreeFilterProvider, ITreeFilterResult } from "src/base/browser/secondary/tree/treeFilter";


export class ClassicFilter<T> implements ITreeFilterProvider<T, any> /** FuzzyScore */ {

    // [field]

    // [constructor]

    constructor() {

    }

    // [public methods]

    public filter(item: T): ITreeFilterResult<any> {
        console.log('[filter]', item);

        return {
            visibility: true,
            rendererMetadata: undefined,
        };
    }
}