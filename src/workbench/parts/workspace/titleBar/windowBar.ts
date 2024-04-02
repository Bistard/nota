import 'src/workbench/parts/workspace/titleBar/media/windowBar.scss';
import { Icons } from "src/base/browser/icon/icons";
import { WidgetBar } from "src/base/browser/secondary/widgetBar/widgetBar";
import { Orientation } from "src/base/browser/basic/dom";
import { IComponentService } from "src/workbench/services/component/componentService";
import { Component } from "src/workbench/services/component/component";
import { WindowButton } from "src/workbench/parts/workspace/titleBar/windowButton";
import { IHostService } from "src/platform/host/common/hostService";
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { IBrowserLifecycleService, ILifecycleService } from 'src/platform/lifecycle/browser/browserLifecycleService';

export class WindowBar extends Component {

    protected _widgetBar: WidgetBar<WindowButton> | undefined;

    constructor(
        @IComponentService componentService: IComponentService,
        @IHostService private readonly hostService: IHostService,
        @IThemeService themeService: IThemeService,
        @ILifecycleService private readonly lifeCycleService: IBrowserLifecycleService,
    ) {
        super('window-bar', null, themeService, componentService);

    }

    protected override _createContent(): void {

        this._widgetBar = this.__register(this.__createWidgetBar(this.element.element));

    }

    protected __createWidgetBar(container: HTMLElement): WidgetBar<WindowButton> {

        // constructs a new widgetBar
        const widgetBar = new WidgetBar<WindowButton>(container, {
            orientation: Orientation.Horizontal,
            render: true,
        });

        // creates all the window buttons
        [
            { id: 'dropdown-btn', icon: Icons.AngleDown, classes: [], fn: () => { } },
            { id: 'min-btn', icon: Icons.Minuss, classes: [], fn: () => this.hostService.minimizeWindow() },
            { id: 'max-btn', icon: Icons.Square, classes: [], fn: () => this.hostService.toggleMaximizeWindow() },
            { id: 'close-btn', icon: Icons.Cross, classes: ['closeToggleBtn'], fn: () => this.lifeCycleService.quit() },
        ]
            .forEach(({ id, icon, classes, fn }) => {
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

