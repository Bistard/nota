import { Widget } from "src/base/browser/basic/widget";
import { Register } from "src/base/common/event";


export interface IButtonOptions {
    src: string
}

export interface IButton {
    // TODO
    enabled: boolean;

    onDidClick: Register<Event>;
}

export class Button extends Widget implements IButton {
    
    protected _imgElement: HTMLImageElement | undefined;
    public opts: IButtonOptions | undefined;

    /** @readonly Constructor */
    constructor(opts?: IButtonOptions) {
        
        super();

        this.opts = opts;
    }

    set enabled(value: boolean) {
		if (this._element) {
            if (value) {
                this._element.classList.remove('disabled');
                this._element.setAttribute('disabled', String(false));
                this._element.tabIndex = 0;
            } else {
                this._element.classList.add('disabled');
                this._element.setAttribute('disabled', String(true));
            }
        }
	}

	get enabled(): boolean {
		return this._element?.classList.contains('disabled') === false;
	}

    public override render(container: HTMLElement): void {
        super.render(container);

        if (this._element === undefined) {
            return;
        }

        // add onClick event listener
        this.onClick(this._element, (event: any) => {
            if (this.enabled === false) {
                return;
            }
        });

        // add mouseover event listener
        this.onMouseover(this._element, (event: any) => {
            if (this._element!.classList.contains('disabled') === false) {
				// TODO:
                // this.setHoverBackground();
			}
        });

        // add mouseout event listener (restore standard styles)
        this.onMouseout(this._element, (event: any) => {
            // TODO:
            // this.applyStyles();
		});
    }

}