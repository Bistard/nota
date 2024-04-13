// import 'src/workbench/parts/workspace/media/workspace.scss';
import { IComponentService } from "src/workbench/services/component/componentService";
import { Component, IAssembleComponentOpts, IComponent } from "src/workbench/services/component/component";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IThemeService } from "src/workbench/services/theme/themeService";
import { Priority } from "src/base/common/event";
import { Orientation } from "src/base/browser/basic/dom";
import { INavigationViewService, NavigationView, NavView} from "src/workbench/parts/navigationPanel/navigationView/navigationView";
import { IToolBarService, ToolBar } from "src/workbench/parts/navigationPanel/navigationBar/toolBar";
import { FunctionBar, IFunctionBarService } from "src/workbench/parts/navigationPanel/functionBar/functionBar";
import { ILogService } from "src/base/common/logger";

export const INavigationPanelService = createService<INavigationPanelService>('navigation-panel-service');

export interface INavigationPanelService extends IComponent, IService {

}

export class NavigationPanel extends Component implements INavigationPanelService {

    // [fields]
    declare _serviceMarker: undefined;
    public static readonly WIDTH = 300;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @INavigationViewService protected readonly navigationViewService: INavigationViewService,
        @IToolBarService protected readonly toolBarService: IToolBarService,
        @IFunctionBarService protected readonly functionBarService: IFunctionBarService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('navigation-panel', null, themeService, componentService, logService);
    }

    // [protected override methods]

    protected override _createContent(): void {
        this.__assemblyParts();
    }

    protected override _registerListeners(): void {
        // Register any listeners needed for the navigation panel
    }

    private __assemblyParts(): void {

        const partConfigurations: IAssembleComponentOpts[] = [
            { 
                component: this.toolBarService,
                minimumSize: ToolBar.HEIGHT,
                maximumSize: ToolBar.HEIGHT,
                initSize: ToolBar.HEIGHT,
            },
            { 
                component: this.navigationViewService,
                minimumSize: NavView.HEIGHT,
                maximumSize: null,
                initSize: NavView.HEIGHT,
            },
            { 
                component: this.functionBarService,
                minimumSize: FunctionBar.HEIGHT,
                maximumSize: FunctionBar.HEIGHT,
                initSize: FunctionBar.HEIGHT,
            },
        ];
        this.assembleComponents(Orientation.Vertical, partConfigurations);
    } 
}
