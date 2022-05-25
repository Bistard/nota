import { Icons } from "src/base/browser/icon/icons";
import { Pair } from "src/base/common/type";

/**
 * @description Returns a class name of the given {@link Icons}.
 * @param icon The provided icon type.
 * @returns A string form of the class name.
 */
function getBuiltInIconClass(icon: Icons | undefined): string {
    if (icon === undefined) {
        return 'icon-unknown';
    } else {
        return 'icon-' + icon;
    }
}

export function getIconClass(icon: Icons | undefined): Pair<string, string> {
    return ['icon', getBuiltInIconClass(icon)];
}