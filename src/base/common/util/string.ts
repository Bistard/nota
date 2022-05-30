import { Iterable } from "src/base/common/util/iterable";

/**
 * @namespace String A collection of functions that relates to {@link string}.
 */
export namespace String {

    /**
     * @description Check if any of the given {@link RegExp} is applied to the
     * provided string.
     * @param str The provided string.
     * @param rules An array of {@link RegExp}.
     * @returns If any rules is applied.
     */
    export function regExp(str: string, rules: RegExp[]): boolean {
        return Iterable.reduce<RegExp, boolean>(rules, false, (tot, rule) => tot ? true : rule.test(str));
    }

}
