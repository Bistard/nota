import "src/workbench/parts/navigationPanel/navigationPanel.scss";
import { Component, IAssembleComponentOpts, IComponent } from "src/workbench/services/component/component";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { Orientation } from "src/base/browser/basic/dom";
import { INavigationViewService, NavView} from "src/workbench/parts/navigationPanel/navigationView/navigationView";
import { INavigationBarService, NavigationBar } from "src/workbench/parts/navigationPanel/navigationBar/navigationBar";
import { FunctionBar, IFunctionBarService } from "src/workbench/parts/navigationPanel/functionBar/functionBar";
import { Icons } from "src/base/browser/icon/icons";
import { IActionBarService } from "src/workbench/parts/navigationPanel/navigationBar/toolBar/actionBar";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { ExplorerViewID } from "src/workbench/contrib/explorer/explorerService";

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
        @IInstantiationService instantiationService: IInstantiationService,
        @INavigationViewService protected readonly navigationViewService: INavigationViewService,
        @INavigationBarService protected readonly navigationBarService: INavigationBarService,
        @IActionBarService protected readonly actionBarService: IActionBarService,
        @IFunctionBarService protected readonly functionBarService: IFunctionBarService,
    ) {
        super('navigation-panel', null, instantiationService);
    }

    // [protected override methods]

    protected override __createContent(): void {
        const navigationBarBuilder = new NavigationBarBuilder(this.actionBarService);
        navigationBarBuilder.registerButtons();
        
        this.__assemblyParts();
    }

    protected override __registerListeners(): void {
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
                minimumSize: 0,
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

    constructor(private readonly actionBarService: IActionBarService) {}

    public registerButtons(): void {
        [
            { id: ExplorerViewID, icon: Icons.FolderOpen, },
            { id: 'nota-ai-default', icon: Icons.NotaAiDefault, },
            { id: 'source-control-default', icon: Icons.SourceControlDefault, },
            { id: 'extension', icon: Icons.Extension, },
        ]
        .forEach(({ id, icon}) => {
            this.actionBarService.registerButton({
                id: id,
                icon: icon,
            });
        });
    }
}