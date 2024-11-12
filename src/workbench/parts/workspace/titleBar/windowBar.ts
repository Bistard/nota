import 'src/workbench/parts/workspace/titleBar/media/windowBar.scss';
import { Icons } from "src/base/browser/icon/icons";
import { WidgetBar } from "src/base/browser/secondary/widgetBar/widgetBar";
import { Orientation } from "src/base/browser/basic/dom";
import { Component } from "src/workbench/services/component/component";
import { WindowButton } from "src/workbench/parts/workspace/titleBar/windowButton";
import { IHostService } from "src/platform/host/common/hostService";
import { IBrowserLifecycleService, ILifecycleService } from 'src/platform/lifecycle/browser/browserLifecycleService';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';

export class WindowBar extends Component {

    protected _widgetBar: WidgetBar<WindowButton> | undefined;

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        @IHostService private readonly hostService: IHostService,
        @ILifecycleService private readonly lifeCycleService: IBrowserLifecycleService,
    ) {
        super('window-bar', null, instantiationService);

    }

    protected override _createContent(): void {
        this._widgetBar = this.__register(this.__createWidgetBar(this.element.raw));
    }

    protected __createWidgetBar(container: HTMLElement): WidgetBar<WindowButton> {

        // constructs a new widgetBar
        const widgetBar = new WidgetBar<WindowButton>('window-bar-buttons', {
            parentContainer: container,
            orientation: Orientation.Horizontal,
            render: true,
        });

        // creates all the window buttons
        [
            { id: 'more-btn', icon: Icons.MoreHoriz, classes: [], fn: () => { } },
            { id: 'min-btn', icon: Icons.MinimizeWindow, classes: [], fn: () => this.hostService.minimizeWindow() },
            { id: 'max-btn', icon: Icons.MaxmizeWindow, classes: [], fn: () => this.hostService.toggleMaximizeWindow() },
            { id: 'close-btn', icon: Icons.Close, classes: ['closeToggleBtn'], fn: () => this.lifeCycleService.quit() },
        ]
            .forEach(({ id, icon, classes, fn }) => {
                const button = new WindowButton({
                    id: id,
                    icon: icon,
                    classes: classes,
                });
                button.onDidClick(fn);

                widgetBar.addItem({
                    id: id,
                    data: button,
                    dispose: button.dispose.bind(button),
                });
            });

        return widgetBar;
    }

    protected override _registerListeners(): void {

        this.hostService.onDidMaximizeWindow(() => {
            this.changeMaxResBtn(true);
        });

        this.hostService.onDidUnMaximizeWindow(() => {
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

