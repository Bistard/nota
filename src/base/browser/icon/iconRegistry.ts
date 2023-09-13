import "src/base/browser/icon/icons.css";
import { Icons } from "src/base/browser/icon/icons";
import { Pair } from "src/base/common/utilities/type";

function getBuiltInIconClass(icon: Icons): string {
    if (icon === undefined) {
        return 'icon-unknown';
    } else {
        return 'icon-' + icon;
    }
}

export function getIconClass(icon: Icons): Pair<string, string> {
    return ['icon', getBuiltInIconClass(icon)];
}

/**
 * @description Creates an icon HTMLElement with the given icon name.
 * @param icon The icon name.
 * @param classes Additional class name.
 * @returns A created HTMLElement that represents the icon.
 * 
 * @note The created element will always has a class named `icon`.
 */
export function createIcon(icon: Icons, classes: string[] = []): HTMLElement {
    const element = document.createElement('i');
    element.classList.add(...getIconClass(icon), ...classes);
    return element;
}