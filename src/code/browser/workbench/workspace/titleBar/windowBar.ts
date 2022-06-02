import { Icons } from "src/base/browser/icon/icons";
import { WidgetBar } from "src/base/browser/secondary/widgetBar/widgetBar";
import { Orientation } from "src/base/common/dom";
import { IpcCommand } from "src/base/electron/ipcCommand";
import { IComponentService } from "src/code/browser/service/componentService";
import { IIpcService } from "src/code/browser/service/ipcService";
import { Component } from "src/code/browser/workbench/component";
import { TitleBarComponentType } from "src/code/browser/workbench/workspace/titleBar/titleBar";
import { WindowButton } from "src/code/browser/workbench/workspace/titleBar/windowButton";

export class WindowBarComponent extends Component {

    protected _widgetBar: WidgetBar<WindowButton> | undefined;

    constructor(
        @IComponentService componentService: IComponentService,
        @IIpcService private readonly ipcService: IIpcService,
    ) {
        super(TitleBarComponentType.windowBar, null, componentService);

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
            {id: 'min-btn', icon: Icons.Minus, message: IpcCommand.WindowMinimize, classes: []},
            {id: 'max-btn', icon: Icons.Square, message: IpcCommand.WindowRestore, classes: []},
            {id: 'close-btn', icon: Icons.Cross, message: IpcCommand.WindowClose, classes: ['closeToggleBtn']},
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
        
        this.ipcService.onWindowMaximize(() => {
            this.changeMaxResBtn(true);
        });
        
        this.ipcService.onWindowUnmaximize(() => {
            this.changeMaxResBtn(false); 
        });
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

