import "src/base/browser/basic/button/button.scss";
import { IWidget, Widget } from "src/base/browser/basic/widget";
import { createIcon } from "src/base/browser/icon/iconRegistry";
import { Icons } from "src/base/browser/icon/icons";
import { Emitter, Register } from "src/base/common/event";

/**
 * Constructor options for {@link Button}.
 */
export interface IButtonOptions {

    /**
     * The ID of the button.
     */
    readonly id: string;

    /**
     * Icon of the button.
     */
    readonly icon?: Icons;

    /**
     * A list of class names for the button to be added when rendering.
     */
    readonly classes?: string[];

    /** 
     * The text label for the button.
     */
    readonly label?: string;

    /** 
     * The background color of the button.
     */
    readonly buttonBackground?: string;

    /**
     * The foreground color of the button. (e.g text color)
     */
    readonly buttonForeground?: string;
}


export interface IButton extends IWidget {
    
    // [getter or setter]

    readonly id: string;
    
    readonly icon?: Icons;

    readonly enabled: boolean;

    // [event]

    /** Event fires when the button is clicked. */
    readonly onDidClick: Register<void>;

    /** Event fires when the button is hovered. */
    readonly onHover: Register<MouseEvent>;

    // [method]

    /**
     * @description Programmatically clicks the button.
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
    protected readonly _opts: IButtonOptions;

    // [event]

    protected readonly _onDidClick = this.__register(new Emitter<void>());
    public readonly onDidClick = this._onDidClick.registerListener;

    protected readonly _onHover = this.__register(new Emitter<MouseEvent>());
    public readonly onHover = this._onHover.registerListener;

    // [constructor]

    constructor(opts: IButtonOptions) {
        super();
        this._opts = opts;
        this._enabled = true;
    }

    // [getter]

	get enabled() { return this.rendered && this._enabled; }
    get id() { return this._opts.id; }

    // [protected override methods]

    protected override __render(element: HTMLElement): void {
        // set icon if provided
        if (this._opts?.icon) {
            const iconElement = createIcon(this._opts.icon);
            element.appendChild(iconElement);
        }
        
        // set label if provided
        if (this._opts?.label) {
            const label = document.createElement('span');
            label.textContent = this._opts.label;
            element.appendChild(label);
        }

        // set styles if provided
        if (this._opts?.buttonBackground) {
            element.style.backgroundColor = this._opts.buttonBackground;
        }
        if (this._opts?.buttonForeground) {
            element.style.color = this._opts.buttonForeground;
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
