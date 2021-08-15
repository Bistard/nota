import { IWidget } from "src/base/browser/ui/widget";
import { getSvgPathByName } from "src/base/common/string";

// TODO: complete
export interface IButtonStyles {

}

export interface IButtonOptions extends IButtonStyles {

}

export interface IButton extends IWidget {

}

export class Button implements IButton {
    
    public id: string = 'button';
    public element: HTMLElement;
    public imgElement?: HTMLImageElement;
    // private _options: IButtonOptions;

    constructor(id: string, container: HTMLElement, /* options?: IButtonOptions */) {
        this.element = document.createElement('div');
        this.element.id = id;
        
        // this._options = options || Object.create(null);
        // ...
        
        container.appendChild(this.element);
    }

    public setClass(...classes: string[]): void {
        this.element.classList.add(...classes);
    }

    public setImage(src: string): void {
        this.imgElement = document.createElement('img');
        this.imgElement.src = getSvgPathByName(src);
        
        this.element.appendChild(this.imgElement);
    }

    public setImageID(id: string): void {
        if (this.imgElement) {
            this.imgElement.id = id;
        }
    }

    public setImageClass(...classes: string[]): void {
        if (this.imgElement) {
            this.imgElement.classList.add(...classes);
        }
    }

}