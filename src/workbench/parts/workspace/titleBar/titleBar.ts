import 'src/workbench/parts/workspace/titleBar/media/titleBar.scss';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
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

    public static readonly TITLE_BAR_HEIGHT = 29;

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super('title-bar', null, instantiationService);
        this.element.raw.style.setProperty('--nota-title-bar-height', `${WindowsTitleBar.TITLE_BAR_HEIGHT}px`);
    }

    protected override _createContent(): void {
        
    }

    protected override _registerListeners(): void {
        
    }

    // [private helper methods]
}
