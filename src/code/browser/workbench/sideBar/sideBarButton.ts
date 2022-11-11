import { Button, IButton, IButtonOptions } from "src/base/browser/basic/button/button";
import { SideType } from "src/code/browser/workbench/sideBar/sideBar";

export interface ISideButton extends IButton {
    
    /**
     * The type of the button.
     */
    readonly type: SideType;
}

/**
 * @class A simple encapsulation built upon {@link Button}. Specific for side
 * bar.
 */
export class SideButton extends Button implements ISideButton {

    public readonly type: SideType;

    constructor(type: SideType, opts?: IButtonOptions) {
        super({
            ...opts,
            classes: [...(opts?.classes ?? []), 'side-button'],
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