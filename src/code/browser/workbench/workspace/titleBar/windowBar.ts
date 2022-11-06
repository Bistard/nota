import { Icons } from "src/base/browser/icon/icons";
import { WidgetBar } from "src/base/browser/secondary/widgetBar/widgetBar";
import { Orientation } from "src/base/browser/basic/dom";
import { IComponentService } from "src/code/browser/service/component/componentService";
import { IThemeService } from "src/code/browser/service/theme/themeService";
import { Component } from "src/code/browser/service/component/component";
import { TitleBarComponentType } from "src/code/browser/workbench/workspace/titleBar/titleBar";
import { WindowButton } from "src/code/browser/workbench/workspace/titleBar/windowButton";
import { IHostService } from "src/code/platform/host/common/hostService";

export class WindowBarComponent extends Component {

    protected _widgetBar: WidgetBar<WindowButton> | undefined;

    constructor(
        @IComponentService componentService: IComponentService,
        @IHostService private readonly hostService: IHostService,
        @IThemeService themeService: IThemeService,
    ) {
        super(TitleBarComponentType.windowBar, null, themeService, componentService);

    }

    protected override _createContent(): void {
        
        this._widgetBar = this.__register(this.__createWidgetBar(this.element.element));
        
    }

    protected __createWidgetBar(container: HTMLElement): WidgetBar<WindowButton> {
        
        // constructs a new widgetBar
        const widgetBar = new WidgetBar<WindowButton>(container, {
            orientation: Orientation.Horizontal
        });
        
        // creates all the window buttons
        [
            {id: 'min-btn', icon: Icons.Minuss, classes: [], fn: () => this.hostService.minimizeWindow()},
            {id: 'max-btn', icon: Icons.Square, classes: [], fn: () => this.hostService.toggleMaximizeWindow()},
            {id: 'close-btn', icon: Icons.Cross, classes: ['closeToggleBtn'], fn: () => this.hostService.closeWindow()},
        ]
        .forEach(( { id, icon, classes, fn } ) => {
            const button = new WindowButton({
                icon: icon, 
                classes: classes, 
            });
            button.onDidClick(fn);

            widgetBar.addItem({
                id: id,
                item: button,
                dispose: button.dispose
            });
        });

        return widgetBar;
    }

    protected override _registerListeners(): void {
        
        this.hostService.onDidMaximizeWindow(() => {
            this.changeMaxResBtn(true);
        });
        
        this.hostService.onDidUnmaximizeWindow(() => {
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

