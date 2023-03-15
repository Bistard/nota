import "src/base/browser/basic/button/button.scss";
import { IWidget, Widget } from "src/base/browser/basic/widget";
import { createIcon, getIconClass } from "src/base/browser/icon/iconRegistry";
import { Icons } from "src/base/browser/icon/icons";
import { Emitter, Register } from "src/base/common/event";

/**
 * Constructor options for {@link Button}.
 */
export interface IButtonOptions {

    /**
     * Icon of the button.
     */
    readonly icon?: Icons;

    /**
     * A list of class names for the button to be added when rendering.
     */
    readonly classes?: string[];
}

export interface IButton extends IWidget {
    
    // [getter or setter]

    /** The icon of the button if provided. */
    readonly icon?: Icons;

    readonly enabled: boolean;

    // [event]

    /** Event fires when the button is clicked. */
    readonly onDidClick: Register<void>;

    /** Event fires when the button is hovered. */
    readonly onHover: Register<MouseEvent>;

    // [method]

    /**
     * @description Programtically clicks the button.
     */
    click(): void;

    /**
     * @description Toggles the functionality of the button. If a value is given,
     * force to enable or disable the button.
     * @param value 
     */
    toggle(value?: boolean): void;
}

export class Button extends Widget implements IButton {
    
    // [field]
    
    private _enabled: boolean;
    private readonly _opts?: IButtonOptions;

    // [event]

    protected readonly _onDidClick = this.__register(new Emitter<void>());
    public readonly onDidClick = this._onDidClick.registerListener;

    protected readonly _onHover = this.__register(new Emitter<MouseEvent>());
    public readonly onHover = this._onHover.registerListener;

    // [constructor]

    constructor(opts?: IButtonOptions) {
        super();
        this._opts = opts;
        this._enabled = true;
    }

    // [getter]

	get enabled(): boolean {
		return this.rendered && this._enabled;
	}

    // [protected override methods]

    protected override __render(): void {
        
        // set icon if provided
        if (this._opts?.icon) {
            const iconElement = createIcon(this._opts.icon);
            this.element.appendChild(iconElement);
        }
    }

    protected override __applyStyle(): void {
        
        this.element.classList.add('button');
        this.element.classList.add(...(this._opts?.classes ?? []));
    }

    protected override __registerListeners(): void {
        
        // click event
        this.__register(this.onClick(this.element, (e) => {
            if (!this.enabled) return;
            this._onDidClick.fire();
        }));

        // hover event
        this.__register(this.onMouseover(this.element, (e) => {
            if (!this.enabled) return;
            this._onHover.fire(e);
        }));
    }

    // [public methods]

    public click(): void {
        this._onDidClick.fire();
    }

    public toggle(value?: boolean): void {
        
        const before = this._enabled;
        this._enabled = value || !this._enabled;

        if (before === this._enabled) {
            return;
        }

        if (this._enabled) {
            this.element.classList.remove('disabled');
            this.element.setAttribute('disabled', String(false));
            this.element.tabIndex = 0;
        } else {
            this.element.classList.add('disabled');
            this.element.setAttribute('disabled', String(true));
        }
	}
}
