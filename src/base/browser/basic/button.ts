import { IWidget } from "src/base/browser/basic/widget";
import { Disposable } from "src/base/common/dispose";
import { addDisposableListener } from "src/base/common/domNode";
import { Emitter, Register } from "src/base/common/event";

// TODO: complete
export interface IButtonStyles {

}

export interface IButtonOptions extends IButtonStyles {

}

export interface IButton extends IWidget {
    
    id: string;
    element: HTMLElement;
    imgElement?: HTMLImageElement;
    enabled: boolean;

    onDidClick: Register<Event>;
    
}

export class Button extends Disposable implements IButton {
    
    /* Events */
    private readonly _onDidClick = this.__register( new Emitter<Event>() );
    public readonly onDidClick = this._onDidClick.registerListener;

    public element: HTMLElement;
    public imgElement?: HTMLImageElement;

    /** @readonly Constructor */
    constructor(id: string, container: HTMLElement) {
        
        super();

        this.element = document.createElement('div');
        this.element.id = id;
        
        container.appendChild(this.element);

        // add onClick event listener
        this.__register(addDisposableListener(this.element, 'click', (event: any) => {
            if (this.enabled === false) {
                return;
            }
            this._onDidClick.fire(event);
        }));

        // add mouseover event listener
        this.__register(addDisposableListener(this.element, 'mouseover', (event: any) => {
            if (!this.element.classList.contains('disabled')) {
				// TODO:
                // this.setHoverBackground();
			}
        }));

        // add mouseout event listener (restore standard styles)
        this.__register(addDisposableListener(this.element, 'mouseout', (event: any) => {
            // TODO:
            // this.applyStyles();
		}));
    }

    set enabled(value: boolean) {
		if (value) {
			this.element.classList.remove('disabled');
			this.element.setAttribute('disabled', String(false));
			this.element.tabIndex = 0;
		} else {
			this.element.classList.add('disabled');
			this.element.setAttribute('disabled', String(true));
		}
	}

	get enabled(): boolean {
		return !this.element.classList.contains('disabled');
	}

    set id (newID: string) {
        this.element.id = newID;
    }

    get id(): string {
        return this.element.id;
    }

    public setClass(classes: string[]): void {
        this.element.classList.add(...classes);
    }

    public setImage(src: string): void {
        this.imgElement = document.createElement('img');
        this.imgElement.src = src;
        
        this.element.appendChild(this.imgElement);
    }

    public setImageID(id: string): void {
        if (this.imgElement) {
            this.imgElement.id = id;
        }
    }

    public setImageClass(classes: string[]): void {
        if (this.imgElement) {
            this.imgElement.classList.add(...classes);
        }
    }

}