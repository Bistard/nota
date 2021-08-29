import { IWidget } from "src/base/browser/basic/widget";

export type Role = "normal" | "seperator" | "subMenu" | "checkBox";

export interface IMenuItem extends IWidget {
    element: HTMLElement;
    option: IMenuItemOption;
}

export interface IMenuItemOption {
    id?: string;
    classes?: string[],
    text: string;
    role: Role;
    shortcut?: string;
    tip?: string;
    enable?: boolean;
}

export class MenuItem implements IMenuItem {
    
    public readonly element: HTMLElement;
    public imgElement?: HTMLImageElement;
    public spanElement?: HTMLSpanElement;
    
    public readonly option: IMenuItemOption;

    constructor(container: HTMLElement, option: IMenuItemOption) {
        this.element = document.createElement('li');
        this.option = option;
        container.appendChild(this.element);
        this.apply(option);
    }

    public apply(opt: IMenuItemOption): void {
        
        this.setItem(opt.text);
        if (opt.id) {
            this.element.id = opt.id;
        }
        if (opt.classes) {
            this.setClass(opt.classes);
        }
        if (opt.enable) {
            // TODO: menuItem turns grey
        }
        if (opt.shortcut) {
            this.setShortcut(opt.shortcut);
        }
        if (opt.tip) {
            this.setTip(opt.tip);
        }
        switch (opt.role) {
            case 'normal':
                this.setClass(['context-menu-button']);
                break;
            case 'checkBox':
                break;
            default:
               console.log(`Invalid Menu Item Type`);
        }

    }

    public setClass(classes: string[]): void {
        this.element.classList.add(...classes);
    }

    // public setImage(src: string): void {
    //     this.imgElement = document.createElement('img');
    //     this.imgElement.src = src;
        
    //     this.element.appendChild(this.imgElement);
    // }

    // public setImageID(id: string): void {
    //     if (this.imgElement) {
    //         this.imgElement.id = id;
    //     }
    // }

    // public setImageClass(classes: string[]): void {
    //     if (this.imgElement) {
    //         this.imgElement.classList.add(...classes);
    //     }
    // }

    public setItem(textContent: string): void {
        this.spanElement = document.createElement('span');
        this.spanElement.textContent = textContent;
        
        this.element.appendChild(this.spanElement);
    }

    public setItemClass(classes: string[]): void {
        if (this.imgElement) {
            this.imgElement.classList.add(...classes);
        }
    }

    public setShortcut(shortCut: string): void {

    }

    public setTip(tip: string): void {

    }

}