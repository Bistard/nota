import { Widget } from "src/base/browser/basic/widget";
import { Register } from "src/base/common/event";


export interface IButtonOptions {
    src: string,
    classes?: string[],
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
    }

}