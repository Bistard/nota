import { Iterable } from "src/base/common/util/iterable";

/**
 * @namespace Strings A collection of functions that relates to {@link string}.
 */
export namespace Strings {

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

    /**
     * @description Stringify the given arguments and join them using a space.
     * @param args The given arguments.
     */
    export function stringify(...args: any): string {
        let result = '';

        for (let i = 0; i < args.length; i++) {
            let obj = args[i];

            if (typeof obj === 'object') {
                try {
                    obj = JSON.stringify(obj);
                } catch (e) { }
            }

            result += (i > 0 ? ' ' : '') + obj;
        }

        return result;
    }

}
