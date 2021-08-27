import { Button } from "src/base/browser/basic/button";
import { getSvgPathByName, SvgType } from "src/base/common/string";
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from "src/base/electron/register";
import { Component } from "src/code/workbench/browser/component";
import { EditorComponentType } from "src/code/workbench/browser/editor/editor";

export class WindowBarComponent extends Component {

    constructor(parentComponent: Component) {
        super(EditorComponentType.windowBar, parentComponent);

    }

    protected override _createContainer(): void {
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
            button.setImage(getSvgPathByName(SvgType.base, src));
            button.setImageClass(['vertical-center']);
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
            maxBtnImg.src = getSvgPathByName(SvgType.base, 'max-restore');
        } else {
            maxBtnImg.src = getSvgPathByName(SvgType.base, 'max');
        }
    }

}

