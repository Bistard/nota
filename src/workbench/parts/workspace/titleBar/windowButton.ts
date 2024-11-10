import { Button, IButtonOptions } from "src/base/browser/basic/button/button";

export interface IWindowButtonOptions extends IButtonOptions {

}

export class WindowButton extends Button {

    constructor(opts: IWindowButtonOptions) {
        super({
            ...opts,
            classes: ['toggleBtn', ...(opts.classes ?? [])],
        });
    }

    public override render(container: HTMLElement): void {
        super.render(container);
    }
}