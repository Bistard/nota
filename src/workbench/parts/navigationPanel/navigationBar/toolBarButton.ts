import { Button, IButton, IButtonOptions } from "src/base/browser/basic/button/button";

export interface IToolButtonOptions extends IButtonOptions {
    /**
     * The string ID of the button.
     */
    readonly id: string;

    /**
     * If a primary button.
     */
    readonly isPrimary: boolean;

    /**
     * Callback for onDidClick event.
     */
    readonly onDidClick?: () => void;
}

export interface IToolButton extends IButton {
    
    /**
     * The ID of the button.
     */
    readonly id: string;

    /**
     * If a primary button.
     */
    readonly isPrimary: boolean;
}

/**
 * @class A simple encapsulation built upon {@link Button}. Specific for tool
 * bar.
 */
export class ToolButton extends Button implements IToolButton {

    public readonly id: string;
    public readonly isPrimary: boolean;
    declare protected readonly _opts: IToolButtonOptions;

    constructor(opts: IToolButtonOptions) {
        super({
            ...opts,
            classes: [...(opts?.classes ?? []), 'tool-button'],
        });
        this.id = opts.id;
        this.isPrimary = opts.isPrimary;
    }

    protected override __registerListeners(): void {
        super.__registerListeners();

        if (this._opts.onDidClick) {
            this.__register(this.onDidClick(this._opts.onDidClick));
        }

        this.__register(this.onHover(e => {
            // TODO: display id
        }));
    }
}