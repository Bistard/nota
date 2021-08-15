import { Button } from "src/base/browser/ui/button";
import { getSvgPathByName } from "src/base/common/string";
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from "src/base/ipc/register";
import { Component } from "src/code/workbench/browser/component";
import { IRegisterService } from "src/code/workbench/service/registerService";

export class WindowBarComponent extends Component {

    constructor(registerService: IRegisterService) {
        super('window-bar', registerService);

    }

    protected override _createContainer(): void {
        this.parent.appendChild(this.container);
        // customize...
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        
        [
            {id: 'min-btn', src: 'min'},
            {id: 'max-btn', src: 'max'},
            {id: 'close-btn', src: 'close'},
        ]
        .forEach(({id, src}) => {
            const button = new Button(id, this.container);
            button.setClass('toggleBtn');
            button.setImage(src);
            button.setImageClass('vertical-center');
            if (id == 'max-btn') {
                button.setImageID('maxBtnImg');
            } else if (id == 'close-btn') {
                button.setClass('closeToggleBtn');
            }
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
        const maxBtnImg = document.getElementById('maxBtnImg') as HTMLImageElement;
        if (isMaxApp) {
            maxBtnImg.src = getSvgPathByName('max-restore');
        } else {
            maxBtnImg.src = getSvgPathByName('max');
        }
    }

}

