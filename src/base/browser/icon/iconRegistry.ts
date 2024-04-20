import "src/base/browser/icon/icons.css";
import { Icons } from "src/base/browser/icon/icons";
import { Pair } from "src/base/common/utilities/type";
import { createStyleInCSS } from "src/base/browser/basic/dom";

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

/**
 * @test
 * @description Returns an container that contains all the icons in our 
 * project. Only for testing purpose. 
 */
export function __createAllIconsGallery(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'icon-gallery';
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.width = '50vw';
    container.style.height = '50vh';
    container.style.zIndex = '1000';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.background = '#f0f0f0';

    const iconSize = 30;
    let styles = `.icon { font-size: ${iconSize}px; width: ${iconSize}px; height: ${iconSize}px; }`;
    const from = 0xf101;
    const to   = (from + 50);
    
    for (let i = from; i <= to; i++) {
        const icon = document.createElement('i');
        icon.classList.add('icon', `icon-${i.toString(16)}`);
        styles += `\n.icon-${i.toString(16)}::before { content: "\\${i.toString(16)}"; }`;
        container.appendChild(icon);
    }
    
    const style = createStyleInCSS(container);
    style.style.innerHTML = styles;

    return container;
}