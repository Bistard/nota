import 'src/workbench/parts/navigationPanel/navigationBar/quickAccessBar/media/macWindowBar.scss';
import { IHostService } from 'src/platform/host/common/hostService';
import { ILogService } from 'src/base/common/logger';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { addDisposableListener } from 'src/base/browser/basic/dom';

export class MacWindowBar extends Component implements IComponent {
    
    private _closeButton?: HTMLElement;

    private _minimizeButton?: HTMLElement;
    private _maximizeButton?: HTMLElement;

    constructor(
        @IComponentService componentService: IComponentService,
        @IHostService private readonly hostService: IHostService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('mac-window-bar', null, themeService, componentService, logService);
        this._createContent();
    }

    public override dispose(): void {
        super.dispose();
    }

    protected override _createContent(): void {
        const container = document.createElement('div');
        container.className = 'mac-bar-container';

        this._closeButton = this._createButton('close-btn', this._onClose);
        this._minimizeButton = this._createButton('min-btn', this._onMinimize);
        this._maximizeButton = this._createButton('max-btn', this._onMaximize);

        container.appendChild(this._closeButton);
        container.appendChild(this._minimizeButton);
        container.appendChild(this._maximizeButton);

        this.element.appendChild(container);
    }

    protected override _registerListeners(): void {
        
    }

    private _createButton(className: string, onClick: () => void): HTMLElement {
        const button = document.createElement('div');
        button.className = `btn ${className}`;
        this.__register(addDisposableListener(button, 'click', onClick));
        return button;
    }

    private _onClose = () => {
        this.hostService.closeWindow();
    };

    private _onMinimize = () => {
        this.hostService.minimizeWindow();
    };

    private _onMaximize = () => {
        this.hostService.toggleFullScreenWindow();
    };
}
