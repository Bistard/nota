import { Button, IButtonOptions } from "src/base/browser/basic/button/button";
import { getSvgPathByName, SvgType } from "src/base/common/string";

/**
 * @description A simple encapsulation on the buttons from actionBarCompoent.
 */
export class ActionButton extends Button {

    constructor(id: string, container: HTMLElement, opts?: IButtonOptions) {
        super(id, container, opts);
    }
    
    /**
     * @description Sets up all the CSS attributes and icon to this action button.
     * @param src The icon name of the icon.
     */
    public render(src: string): void {
        this.setClass(['button', 'action-button']);
        this.setImage(getSvgPathByName(SvgType.base, src));
        this.setImageClass(['vertical-center', 'filter-black']);
    }

    // TODO: a hover listener to show a message box
}