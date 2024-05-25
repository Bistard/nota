import 'src/workbench/parts/navigationPanel/navigationBar/quickAccessBar/media/macWindowBar.scss';
import { IHostService } from 'src/platform/host/common/hostService';
import { ILogService } from 'src/base/common/logger';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { addDisposableListener } from 'src/base/browser/basic/dom';
import { IS_MAC } from 'src/base/common/platform';
import { panic } from 'src/base/common/utilities/panic';
import { IBrowserLifecycleService, ILifecycleService } from 'src/platform/lifecycle/browser/browserLifecycleService';

export class MacWindowBar extends Component implements IComponent {
    
    constructor(
        @IComponentService componentService: IComponentService,
        @IHostService private readonly hostService: IHostService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        if (!IS_MAC) {
            panic(`[MacWindowBar] cannot construct if the operating system is not MacOS`);
        }
        super('mac-window-bar', null, themeService, componentService, logService);
        this._createContent();
    }

    public override dispose(): void {
        super.dispose();
    }

    protected override _createContent(): void {
        const container = document.createElement('div');
        container.className = 'mac-bar-container';

        const close = this.__createButton('close-btn', this.__onClose.bind(this));
        const minimize = this.__createButton('min-btn', this.__onMinimize.bind(this));
        const fullscreen = this.__createButton('max-btn', this.__onFullscreen.bind(this));

        container.appendChild(close);
        container.appendChild(minimize);
        container.appendChild(fullscreen);
        this.element.appendChild(container);
    }

    protected override _registerListeners(): void {}

    private __createButton(className: string, onClick: () => void): HTMLElement {
        const button = document.createElement('div');
        button.className = `btn ${className}`;
        this.__register(addDisposableListener(button, 'click', onClick));
        return button;
    }

    private __onClose(): void {
        this.lifecycleService.quit();
    }

    private __onMinimize(): void {
        this.hostService.minimizeWindow();
    }

    private __onFullscreen(): void {
        this.hostService.toggleFullScreenWindow();
    }
}
