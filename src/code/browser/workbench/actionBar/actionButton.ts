import { Button, IButtonOptions } from "src/base/browser/basic/button/button";
import { getSvgPathByName, SvgType } from "src/base/common/string";

export interface IActionButtonOptions extends IButtonOptions {
    
}

/**
 * @description A simple encapsulation on the buttons from actionBarCompoent.
 */
export class ActionButton extends Button {

    constructor(opts?: IActionButtonOptions) {
        super(opts);
    }
    
    /**
     * @description Sets up all the CSS attributes and icon to this action button.
     * @param src The icon name of the icon.
     */
    public override render(container: HTMLElement): void {
        super.render(container);

        this.applyStyle();
    }

    public override applyStyle(): void {
        
        if (this._element === undefined || this.opts === undefined) {
            return;
        }

        // create a image element
        this._imgElement = document.createElement('img');
        this._imgElement.src = getSvgPathByName(SvgType.base, this.opts.src);
        this._element.appendChild(this._imgElement);

        // set element classes
        this._element?.classList.add(...['button', 'action-button']);

        // set image element classes
        this._imgElement.classList.add(...['vertical-center', 'filter-black']);
    }
    // TODO: a hover listener to show a message box
}