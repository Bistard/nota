export const CONTEXT_MENU_ITEM_HEIGHT = 30;
export const CONTEXT_MENU_WIDTH = 150;
export const CONTEXT_MENU_SEPERATOR_HEIGHT = 4;

export type Role = "normal" | "seperator" | "subMenu" | "checkBox";

export interface IMenuItem {
    element: HTMLElement;
    option: IMenuItemOption;
}

export interface IMenuItemOption {
    id: string;
    classes?: string[],
    text: string;
    role: Role;
    shortcut?: string;
    tip?: string;
    enable?: boolean;
    checked?: boolean;
    subMenuItem?: IMenuItemOption[],
}

export class MenuItem implements IMenuItem {
    
    public readonly element: HTMLElement;
    public imgElement?: HTMLImageElement;
    public spanElement?: HTMLSpanElement;
    public hrElement?: HTMLHRElement;
    
    public readonly option: IMenuItemOption;

    constructor(container: HTMLElement, option: IMenuItemOption) {
        this.element = document.createElement('li');
        this.option = option;
        container.appendChild(this.element);
        this.apply(option);
    }

    public apply(opt: IMenuItemOption): void {
        
        //this.setText(opt.text);
        if (opt.id) {
            this.element.id = opt.id;
        }
        if (opt.classes) {
            this.setClass(opt.classes);
        }
        if (opt.tip) {
            this.setTip(opt.tip);
        }
        switch (opt.role) {
            case 'normal':
                this.setText(opt.text);
                this.setTextClass(['menu-item-text']);
                break;
            case 'checkBox':
                this.setImage('check-mark');
                if (opt.checked){
                    this.setImageClass(['filter-black', 'check-box']);
                    this.setImageID(opt.id + "-check-mark");
                } else {
                    this.setImageClass(['filter-grey', 'check-box']);
                    this.setImageID(opt.id + "-check-mark");
                }
                this.setText(opt.text);
                this.setTextClass(['menu-item-text']);


                break;
            case 'seperator':
                this.setSeperator();
                this.setSeperatorClass(['seperator']);
                break;
            case 'subMenu':
                this.setText(opt.text);
                this.setTextClass(['menu-item-text']);
                this.setImage('caret-right');
                this.setImageClass(['filter-black', 'caret-right']);
                this.setImageID(opt.id + "-caret-right");
                break
            default:
               throw new Error(`Invalid Menu Item Type`);
        }

        if (opt.enable === false) {
            this.element.style.pointerEvents= 'none';
            const disableButton = document.getElementById(opt.text+'-id');
            disableButton!.style.color = 'darkgrey';
        }

        if (opt.shortcut) {
            this.setShortcut(opt.shortcut);
        }

        if (opt.subMenuItem) {
            opt.subMenuItem
            .forEach((item) => {
                this.apply(item);
            })
        }

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

    public setText(textContent: string): void {
        this.spanElement = document.createElement('span');
        this.spanElement.id= textContent + '-id';
        this.spanElement.textContent = textContent;
        
        this.element.appendChild(this.spanElement);
    }

    public setTextClass(classes: string[]): void {
        if (this.spanElement) {
            this.spanElement.classList.add(...classes);
        }
    }

    public setShortcut(shortCut: string): void {
        this.setText(shortCut);
        this.setTextClass(['menu-item-shortcut']);
   }

   // TODO
   public setTip(tip: string): void {
      
   }

    public setSeperator(): void {
        this.hrElement = document.createElement('hr');
        
        this.element.appendChild(this.hrElement); 
    }

    public setSeperatorClass(classes: string[]): void {
        if (this.hrElement) {
            this.hrElement.classList.add(...classes);
        }
    }

}