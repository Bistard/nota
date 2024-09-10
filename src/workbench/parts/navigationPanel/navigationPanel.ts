import "src/workbench/parts/navigationPanel/navigationPanel.scss";
import { IComponentService } from "src/workbench/services/component/componentService";
import { Component, IAssembleComponentOpts, IComponent } from "src/workbench/services/component/component";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IThemeService } from "src/workbench/services/theme/themeService";
import { Orientation } from "src/base/browser/basic/dom";
import { INavigationViewService, NavView} from "src/workbench/parts/navigationPanel/navigationView/navigationView";
import { INavigationBarService, NavigationBar } from "src/workbench/parts/navigationPanel/navigationBar/navigationBar";
import { FunctionBar, IFunctionBarService } from "src/workbench/parts/navigationPanel/functionBar/functionBar";
import { ILogService } from "src/base/common/logger";
import { Icons } from "src/base/browser/icon/icons";
import { IToolBarService } from "src/workbench/parts/navigationPanel/navigationBar/toolBar/toolBar";

export const INavigationPanelService = createService<INavigationPanelService>('navigation-panel-service');

/**
 * An interface only for {@link NavigationPanel}.
 */
export interface INavigationPanelService extends IComponent, IService {

}

export class NavigationPanel extends Component implements INavigationPanelService {

    // [fields]
    
    declare _serviceMarker: undefined;
    public static readonly WIDTH = 300;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @INavigationViewService protected readonly navigationViewService: INavigationViewService,
        @INavigationBarService protected readonly navigationBarService: INavigationBarService,
        @IToolBarService protected readonly toolBarService: IToolBarService,
        @IFunctionBarService protected readonly functionBarService: IFunctionBarService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('navigation-panel', null, themeService, componentService, logService);
    }

    // [protected override methods]

    protected override _createContent(): void {
        const navigationBarBuilder = new NavigationBarBuilder(this.toolBarService);
        navigationBarBuilder.registerButtons();
        
        this.__assemblyParts();
    }

    protected override _registerListeners(): void {
        // noop
    }

    private __assemblyParts(): void {
        const partConfigurations: IAssembleComponentOpts[] = [
            { 
                component: this.navigationBarService,
                fixed: true,
                fixedSize: NavigationBar.HEIGHT,
            },
            { 
                component: this.navigationViewService,
                minimumSize: NavView.HEIGHT,
                initSize: NavView.HEIGHT,
                maximumSize: null,
            },
            { 
                component: this.functionBarService,
                fixed: true,
                fixedSize: FunctionBar.HEIGHT,
            },
        ];
        this.assembleComponents(Orientation.Vertical, partConfigurations);
    }
}

class NavigationBarBuilder {

    constructor(private readonly toolBarService: IToolBarService) {}

    public registerButtons(): void {
        [
            { id: 'folder-open', icon: Icons.FolderOpen, },
            { id: 'nota-ai-default', icon: Icons.NotaAiDefault, },
            { id: 'source-control-default', icon: Icons.SourceControlDefault, },
            { id: 'extension', icon: Icons.Extension, },
        ]
        .forEach(({ id, icon}) => {
            this.toolBarService.registerPrimaryButton({
                id: id,
                icon: icon,
            });
        });
    }
}