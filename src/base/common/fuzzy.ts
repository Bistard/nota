
export interface IFilterOpts {
    readonly include: readonly RegExp[];
    readonly exclude: readonly RegExp[];
}

/**
 * @description Determines if the given string is in the black list and not in 
 * the white list.
 * @param str The given string.
 * @param filters The provided black list and white list.
 */
export function isFiltered(str: string, filters: IFilterOpts): boolean {
    
    // black list
    const isInExcludeList = filters.exclude.some(regexp => regexp.test(str));

    // white list
    if (isInExcludeList) {
        const isInIncludeList = filters.include.some(regexp => regexp.test(str));
        return !isInIncludeList;
    }

    // If it's not in the exclude list, it's not filtered out
    return false;
}

export type FuzzyScore = void;