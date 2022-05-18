import { Icons } from "src/base/browser/icon/icons";

/**
 * @description Returns a class name of the given {@link Icons}.
 * @param icon The provided icon type.
 * @returns A string form of the class name.
 */
export function getBuiltInIconClass(icon: Icons | undefined): string {
    if (icon === undefined) {
        return 'icon-unknown';
    } else {
        return 'icon-' + icon;
    }
}
