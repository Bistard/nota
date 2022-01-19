import { Button, IButtonOptions } from "src/base/browser/basic/button/button";
import { getBuiltInIconClass } from "src/base/browser/icon/iconRegistry";

export interface IActionButtonOptions extends IButtonOptions {
    
}

/**
 * @class A simple encapsulation on the buttons from actionBarCompoent.
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

        // add onClick event listener
        this.onClick(this._element!, (event: any) => {
            if (this.enabled === false) {
                return;
            }
        });

        // add mouseover event listener
        this.onMouseover(this._element!, (event: any) => {
            if (this._element!.classList.contains('disabled') === false) {
				// TODO:
                // this.setHoverBackground();
			}
        });

        // add mouseout event listener (restore standard styles)
        this.onMouseout(this._element!, (event: any) => {
            // TODO:
            // this.applyStyles();
		});

        this.applyStyle();
    }

    public override applyStyle(): void {
        
        if (this._element === undefined || this.opts === undefined) {
            return;
        }

        // set icon
        if (this.opts.icon) {
            const iconElement = document.createElement('i');
            iconElement.classList.add('icon');
            iconElement.classList.add(getBuiltInIconClass(this.opts.icon));
            this._element.appendChild(iconElement);
        }
        
        // set element classes
        this._element.classList.add(...['button', 'action-button']);

        // set image element classes
        // this._imgElement.classList.add(...['vertical-center', 'filter-black']);
    }
    // TODO: a hover listener to show a message box
}