import { IWidget } from "src/base/browser/basic/widget";
import { getSvgPathByName } from "src/base/common/string";


export type Role = "normal" | "seperator" | "subMenu" | "checkBox"


export interface IMenuItem extends IWidget {

}

export class MenuItem implements IMenuItem {
    
    public id: string = 'button';
    public element: HTMLElement;
    public imgElement?: HTMLImageElement;
    public spanElement?: HTMLSpanElement;
    private _role: Role;
    // private _options: IButtonOptions;

    constructor(id: string, container: HTMLElement, role: Role) {
        this.element = document.createElement('li');
        this.element.id = id;
        this._role = role;
        // this._options = options || Object.create(null);
        // ...
        
        container.appendChild(this.element);
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

    public setItem(textContent: string): void {
        this.spanElement = document.createElement('span');
        this.spanElement.textContent = textContent
        
        this.element.appendChild(this.spanElement);
    }

    public setItemClass(classes: string[]): void {
        if (this.imgElement) {
            this.imgElement.classList.add(...classes);
        }
    }

}