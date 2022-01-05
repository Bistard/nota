import { Icons } from "src/base/browser/icon/icons";
import { WidgetBar } from "src/base/browser/secondary/widgetBar/widgetBar";
import { Orientation } from "src/base/common/domNode";
import { ipcRendererOn } from "src/base/electron/register";
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
            {id: 'min-btn', icon: Icons.Minus, message: 'minApp', classes: []},
            {id: 'max-btn', icon: Icons.Square, message: 'maxResApp', classes: []},
            {id: 'close-btn', icon: Icons.Cross, message: 'closeApp', classes: ['closeToggleBtn']},
        ]
        .forEach(( {id, icon, message, classes} ) => {
            const button = new WindowButton({
                icon: icon, 
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
    public changeMaxResBtn(isMaxApp: boolean): void {
        // TODO: refactor
        // const maxBtn = document.getElementById('max-btn') as HTMLElement;
        // const maxBtnImg = maxBtn.childNodes[0] as HTMLImageElement;
        // if (isMaxApp) {
        //     maxBtnImg.src = getSvgPathByName(SvgType.base, 'multi-layer');
        // } else {
        //     maxBtnImg.src = getSvgPathByName(SvgType.base, 'max');
        // }
    }

}

