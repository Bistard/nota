import { Button, IButtonOptions } from "src/base/browser/basic/button/button"
import { getIconClass } from "src/base/browser/icon/iconRegistry";

export interface IWindowButtonOptions extends IButtonOptions {

}

export class WindowButton extends Button {

    constructor(opts: IWindowButtonOptions) {
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

        // set icon
        if (this.opts.icon) {
            const iconElement = document.createElement('i');
            iconElement.classList.add(...getIconClass(this.opts.icon));
            this._element.appendChild(iconElement);
        }

        // set element classes
        this._element.classList.add(...['toggleBtn']);
        if (this.opts.classes) {
            this._element.classList.add(...this.opts.classes);
        }

        // set image element classes
        // this._imgElement.classList.add(...['vertical-center']);
    }

}