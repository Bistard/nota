import { WidgetBar } from "src/base/browser/secondary/widgetBar/widgetBar";
import { addDisposableListener, Orientation } from "src/base/common/domNode";
import { getSvgPathByName, SvgType } from "src/base/common/string";
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from "src/base/electron/register";
import { IComponentService } from "src/code/browser/service/componentService";
import { Component } from "src/code/browser/workbench/component";
import { TitleBarComponentType } from "src/code/browser/workbench/editor/titleBar/titleBar";
import { WindowButton } from "src/code/browser/workbench/editor/titleBar/windowButton";

export class WindowBarComponent extends Component {

    protected _widgetBar: WidgetBar<WindowButton> | undefined;

    constructor(
        parentComponent: Component,
        @IComponentService componentService: IComponentService,
    ) {
        super(TitleBarComponentType.windowBar, parentComponent, null, componentService);

    }

    protected override _createContent(): void {
        
        this._widgetBar = this.__register(this._createWidgetBar(this.container));
        
    }

    protected _createWidgetBar(container: HTMLElement): WidgetBar<WindowButton> {
        
        // constructs a new widgetBar
        const widgetBar = new WidgetBar<WindowButton>(container, {
            orientation: Orientation.Horizontal
        });
        
        // creates all the window buttons
        [
            {id: 'min-btn', src: 'min', message: 'minApp', classes: []},
            {id: 'max-btn', src: 'max', message: 'maxResApp', classes: []},
            {id: 'close-btn', src: 'close', message: 'closeApp', classes: ['closeToggleBtn']},
        ]
        .forEach(( {id, src, message, classes} ) => {
            const button = new WindowButton({
                src: src, 
                classes: classes, 
                ipcMessage: message
            });
            widgetBar.addItem({
                id: id,
                item: button,
                dispose: button.dispose
            });
        })

        return widgetBar;
    }

    protected override _registerListeners(): void {
        
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

