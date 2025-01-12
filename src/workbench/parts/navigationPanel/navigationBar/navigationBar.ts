import 'src/workbench/parts/navigationPanel/navigationBar/media/navigationBar.scss';
import { Component, IAssembleComponentOpts, IComponent } from 'src/workbench/services/component/component';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { Orientation } from 'src/base/browser/basic/dom';
import { IQuickAccessBarService, QuickAccessBar } from 'src/workbench/parts/navigationPanel/navigationBar/quickAccessBar/quickAccessBar';
import { ToolBarType, IToolBarService, ToolBar } from 'src/workbench/parts/navigationPanel/navigationBar/toolBar/toolBar';
import { assert } from 'src/base/common/utilities/panic';
import { IBrowserZoomService } from 'src/workbench/services/zoom/zoomService';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';

export const INavigationBarService = createService<INavigationBarService>('navigation-bar-service');

/**
 * An interface only for {@link NavigationBar}.
 */
export interface INavigationBarService extends IComponent, IService {

}

/**
 * @class NavigationBar provides access to each view and handles the state 
 * transition between each button and display corresponding view.
 */
export class NavigationBar extends Component implements INavigationBarService {

    declare _serviceMarker: undefined;

    // [field]

    public static readonly HEIGHT = 100;

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        @IQuickAccessBarService private readonly quickAccessBarService: IQuickAccessBarService,
        @IToolBarService private readonly toolBarService: IToolBarService,
    ) {
        super('navigation-bar', null, instantiationService);
    }

    // [public method]

    // [protected override method]

    protected override __createContent(): void {

        // Register buttons along with future development
        // Now registered one in layout.ts - EXPLORE folder icon

        const partConfigurations: IAssembleComponentOpts[] = [
            { 
                component: this.quickAccessBarService,
                fixed: true,
                fixedSize: QuickAccessBar.HEIGHT,
            },
            { 
                component: this.toolBarService,
                minimumSize: ToolBar.HEIGHT,
                initSize: ToolBar.HEIGHT,
                maximumSize: null,
            },
        ];
        this.assembleComponents(Orientation.Vertical, partConfigurations); 
    }

    protected override __registerListeners(): void {
        
    }
}