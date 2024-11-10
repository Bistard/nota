import { Button, IButtonOptions } from "src/base/browser/basic/button/button";



export class BlockHandleButton extends Button {

    constructor(opts: IButtonOptions) {
        super({
            ...opts,
            classes: ['block-handle-button', ...(opts.classes ?? [])],
        });
    }
}