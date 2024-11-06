import 'src/workbench/parts/workspace/titleBar/media/titleBar.scss';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { WindowBar } from 'src/workbench/parts/workspace/titleBar/windowBar';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { ILogService } from 'src/base/common/logger';
import { createService, IService } from 'src/platform/instantiation/common/decorator';

export const IWindowsTitleBarService = createService<IWindowsTitleBarService>('windows-title-bar-service');

/**
 * This interface is only for {@link WindowsTitleBar}.
 */
export interface IWindowsTitleBarService extends IComponent, IService {
    
}

/**
 * @note This is only for Windows-only user interfaces.
 */
export class WindowsTitleBar extends Component implements IWindowsTitleBarService {

    declare _serviceMarker: undefined;

    public static readonly TITLE_BAR_HEIGHT = 40;
    private windowBar?: WindowBar;

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('title-bar', null, themeService, componentService, logService);
        this.element.raw.style.setProperty('--nota-title-bar-height', `${WindowsTitleBar.TITLE_BAR_HEIGHT}px`);
    }

    protected override _createContent(): void {
        this.windowBar = this.instantiationService.createInstance(WindowBar);
        this.windowBar.create(this);
    }

    protected override _registerListeners(): void {
        this.windowBar?.registerListeners();
    }

    // [private helper methods]
}
