import { Widget } from "src/base/browser/basic/widget";
import { Icons } from "src/base/browser/icon/icons";
import { Emitter, Register } from "src/base/common/event";


export interface IButtonOptions {
    icon?: Icons,
    classes?: string[],
}

export interface IButton {
    // TODO
    enabled: boolean;

    onDidClick: Register<Event>;
}

export class Button extends Widget implements IButton {
    
    /* Events */
    protected readonly _onDidClick = this.__register( new Emitter<Event>() );
    public readonly onDidClick = this._onDidClick.registerListener;

    public opts: IButtonOptions | undefined;

    /** @readonly Constructor */
    constructor(opts?: IButtonOptions) {
        super();

        this.opts = opts;
    }

    set enabled(value: boolean) {
		if (this._element) {
            if (value) {
                this._element.classList.add('disabled');
                this._element.setAttribute('disabled', String(true));
            } else {
                this._element.classList.remove('disabled');
                this._element.setAttribute('disabled', String(false));
                this._element.tabIndex = 0;
            }
        }
	}

	get enabled(): boolean {
		return this._element?.classList.contains('disabled') === false;
	}

    public override render(container: HTMLElement): void {
        super.render(container);

        this._registerListeners();
    }
    
    protected _registerListeners(): void {

        // left click event
        this.onClick(this._element!, (e) => {
            this._onDidClick.fire(e);
        });

    }
}
