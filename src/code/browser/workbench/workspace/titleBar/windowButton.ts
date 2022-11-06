import { Button, IButtonOptions } from "src/base/browser/basic/button/button"
import { getIconClass } from "src/base/browser/icon/iconRegistry";

export interface IWindowButtonOptions extends IButtonOptions {

}

export class WindowButton extends Button {

    constructor(opts: IWindowButtonOptions) {
        super({
            ...opts,
            classes: ['toggleBtn'],
        });
    }

    public override render(container: HTMLElement): void {
        super.render(container);
    }
}