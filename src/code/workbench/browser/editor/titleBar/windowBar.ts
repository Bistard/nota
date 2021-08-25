import { Button } from "src/base/browser/basic/button";
import { getSvgPathByName } from "src/base/common/string";
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from "src/base/electron/register";
import { Component } from "src/code/workbench/browser/component";
import { EditorComponentType } from "src/code/workbench/browser/editor/editor";
import { IRegisterService } from "src/code/workbench/service/registerService";

export class WindowBarComponent extends Component {

    constructor(parent: HTMLElement,
                registerService: IRegisterService) {
        super(EditorComponentType.windowBar, parent, registerService);

    }

    protected override _createContainer(): void {
        this.parent.appendChild(this.container);
        // customize...
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        [
            {id: 'min-btn', src: 'min', classes: ['toggleBtn']},
            {id: 'max-btn', src: 'max', classes: ['toggleBtn']},
            {id: 'close-btn', src: 'close', classes: ['toggleBtn', 'closeToggleBtn']},
        ]
        .forEach(( {id, src, classes} ) => {
            const button = new Button(id, this.container);
            button.setClass(classes);
            button.setImage(src);
            button.setImageClass('vertical-center');
        })

    }

    protected override _registerListeners(): void {
        
        domNodeByIdAddListener('min-btn', 'click', () => {
            ipcRendererSend('minApp');
        });
        
        domNodeByIdAddListener('max-btn', 'click', () => {
            ipcRendererSend('maxResApp');
        });
        
        domNodeByIdAddListener('close-btn', 'click', () => {
            ipcRendererSend('closeApp');
        });
        
        ipcRendererOn('isMaximized', () => { 
            this.changeMaxResBtn(true);
        })

        ipcRendererOn('isRestored', () => { 
            this.changeMaxResBtn(false); 
        })
    }

    /**
     * @description handling .svg of maxResButton
     */
     changeMaxResBtn(isMaxApp: boolean): void {
        const maxBtn = document.getElementById('max-btn') as HTMLElement;
        const maxBtnImg = maxBtn.childNodes[0] as  HTMLImageElement;
        if (isMaxApp) {
            maxBtnImg.src = getSvgPathByName('max-restore');
        } else {
            maxBtnImg.src = getSvgPathByName('max');
        }
    }

}

