import { Strings } from "src/base/common/util/string";

export interface IFilterOpts {
    readonly includeFilter: readonly RegExp[];
    readonly excludeFilter: readonly RegExp[];
}

/**
 * @description Determines if the given string is in the black list and not in 
 * the white list.
 * @param str The given string.
 * @param filters The provided black list and white list.
 */
export function isFiltered(str: string, filters: IFilterOpts): boolean {
    if ((filters.excludeFilter.length && Strings.anyRegExp(str, filters.excludeFilter)) 
        && !(filters.includeFilter.length && Strings.anyRegExp(str, filters.includeFilter))
    ) {
        return true;
    }
    return false;
}

// TODO: complete
export type FuzzyScore = void;