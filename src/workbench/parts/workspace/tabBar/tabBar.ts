import 'src/workbench/parts/workspace/tabBar/media/tabBar.scss';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { createService, IService } from 'src/platform/instantiation/common/decorator';

export const ITabBarService = createService<ITabBarService>('windows-tab-bar-service');

/**
 * This interface is only for {@link TabBarView}.
 */
export interface ITabBarService extends IComponent, IService {
    
}

/**
 * @note This is only for Windows-only user interfaces.
 */
export class TabBarView extends Component implements ITabBarService {

    declare _serviceMarker: undefined;

    public static readonly TAB_BAR_HEIGHT = 29;

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super('tab-bar', null, instantiationService);
        this.element.raw.style.setProperty('--nota-tab-bar-height', `${TabBarView.TAB_BAR_HEIGHT}px`);
    }

    protected override _createContent(): void {
        
    }

    protected override _registerListeners(): void {
        
    }

    // [private helper methods]
}
