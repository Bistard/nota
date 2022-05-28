import { Button, IButton, IButtonOptions } from "src/base/browser/basic/button/button";
import { getIconClass } from "src/base/browser/icon/iconRegistry";
import { ActionType } from "src/code/browser/workbench/actionBar/actionBar";

export interface IActionButtonOptions extends IButtonOptions {
    
}

export interface IActionButton extends IButton {
    
    /**
     * The type of the action button.
     */
    readonly type: ActionType;

}

/**
 * @class A simple encapsulation built upon {@link IButton} from actionBarCompoent.
 */
export class ActionButton extends Button implements IActionButton {

    public readonly type: ActionType;

    constructor(type: ActionType, opts?: IActionButtonOptions) {
        super(opts);

        this.type = type;
    }
    
    public override render(container: HTMLElement): void {
        super.render(container);

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
            iconElement.classList.add(...getIconClass(this.opts.icon));
            this._element.appendChild(iconElement);
        }
        
        // set element classes
        this._element.classList.add(...['button', 'action-button']);

        // set image element classes
        // this._imgElement.classList.add(...['vertical-center', 'filter-black']);
    }
    // TODO: a hover listener to show a message box
}