import { Icons } from "src/base/browser/icon/icons";

export function getBuiltInIconClass(icon: Icons | undefined): string {
    if (icon === undefined) {
        return 'icon-unknown';
    } else {
        return 'icon-' + icon;
    }
}
