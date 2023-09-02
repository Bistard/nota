import { Strings } from "src/base/common/utilities/string";

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
    if ((filters.exclude.length && Strings.anyRegExp(str, filters.exclude)) 
        && !(filters.include.length && Strings.anyRegExp(str, filters.include))
    ) {
        return true;
    }
    return false;
}

// TODO: complete
export type FuzzyScore = void;