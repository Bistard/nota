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
        super({
            ...opts,
            classes: ['action-button'],
        });

        this.type = type;
    }
    
    public override render(container: HTMLElement): void {
        super.render(container);
    }
    // TODO: a hover listener to show a message box
}