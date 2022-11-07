import { Disposable } from "src/base/common/dispose";

/**
 * @class The base class for top view part in the side view.
 */
export class SideViewTitlePart extends Disposable {

    protected _element: HTMLElement;

    constructor() {
        super();

        this._element = document.createElement('div');
        this._element.className = 'side-view-title';
    }
    
    /**
     * @description Renders the title part into the provided container.
     * @param container The HTMLElement to be inserted below.
     */
    public render(container: HTMLElement): void {
        if (this._element === undefined) {
            return;
        }
        
        container.appendChild(this._element);
    }
    
    public hide(value: boolean): void {
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

    public hidden(): boolean {
        return this._element?.classList.contains('disabled') === false;
    }
}
