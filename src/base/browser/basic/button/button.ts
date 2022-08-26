import { IWidget, Widget } from "src/base/browser/basic/widget";
import { Icons } from "src/base/browser/icon/icons";
import { Emitter, Register } from "src/base/common/event";


export interface IButtonOptions {
    icon?: Icons,
    classes?: string[],
}

export interface IButton extends IWidget {
    // TODO
    enabled: boolean;

    onDidClick: Register<MouseEvent>;
}

export class Button extends Widget implements IButton {
    
    /* Events */
    protected readonly _onDidClick = this.__register( new Emitter<MouseEvent>() );
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

        this.__registerListeners();
    }

    private __registerListeners(): void {

        // click event
        this.__register(this.onClick(this._element!, (e) => {
            if (this.enabled === false) {
                return;
            }

            this._onDidClick.fire(e);
        }));

    }
}
