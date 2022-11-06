import { Button, IButton, IButtonOptions } from "src/base/browser/basic/button/button";
import { ActionType } from "src/code/browser/workbench/actionBar/actionBar";

export interface IActionButton extends IButton {
    
    /**
     * The type of the action button.
     */
    readonly type: ActionType;
}

/**
 * @class A simple encapsulation built upon {@link Button}. Specific for action
 * bar.
 */
export class ActionButton extends Button implements IActionButton {

    public readonly type: ActionType;

    constructor(type: ActionType, opts?: IButtonOptions) {
        super({
            ...opts,
            classes: [...(opts?.classes ?? []), 'action-button'],
        });
        this.type = type;
    }

    protected override __registerListeners(): void {
        super.__registerListeners();

        this.__register(this.onHover(e => {
            // TODO
        }));
    }
}