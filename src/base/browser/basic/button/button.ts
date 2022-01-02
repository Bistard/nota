import { Widget } from "src/base/browser/basic/widget";
import { Disposable } from "src/base/common/dispose";
import { addDisposableListener, EventType } from "src/base/common/domNode";
import { Emitter, Register } from "src/base/common/event";


export interface IButtonOptions {
    
}

export interface IButton {
    id: string;
    element: HTMLElement;
    imgElement?: HTMLImageElement;
    enabled: boolean;

    onDidClick: Register<Event>;
    setClass(classes: string[]): void;
    setImage(src: string): void;
    setImageID(id: string): void;
    setImageClass(classes: string[]): void;
}

export class Button extends Widget implements IButton {
    
    /* Events */
    private readonly _onDidClick = this.__register( new Emitter<Event>() );
    public readonly onDidClick = this._onDidClick.registerListener;

    public element: HTMLElement;
    public imgElement?: HTMLImageElement;

    /** @readonly Constructor */
    constructor(id: string, container: HTMLElement, opts?: IButtonOptions) {
        
        super();

        this.element = document.createElement('div');
        this.element.id = id;
        
        container.appendChild(this.element);

        // add onClick event listener
        this.onClick(this.element, (event: any) => {
            if (this.enabled === false) {
                return;
            }
            this._onDidClick.fire(event);
        });

        // add mouseover event listener
        this.onMouseover(this.element, (event: any) => {
            if (!this.element.classList.contains('disabled')) {
				// TODO:
                // this.setHoverBackground();
			}
        });

        // add mouseout event listener (restore standard styles)
        this.onMouseout(this.element, (event: any) => {
            // TODO:
            // this.applyStyles();
		});
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