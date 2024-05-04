import { CollapseState, DomUtility, Orientation } from "src/base/browser/basic/dom";
import { IComponentService } from "src/workbench/services/component/componentService";
import { Component, IAssembleComponentOpts } from "src/workbench/services/component/component";
import { IWorkspaceService } from "src/workbench/parts/workspace/workspace";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { Priority } from "src/base/common/event";
import { ExplorerView } from "src/workbench/contrib/explorer/explorer";
import { IContextMenuService } from "src/workbench/services/contextMenu/contextMenuService";
import { ILayoutService } from "src/workbench/services/layout/layoutService";
import { IThemeService } from "src/workbench/services/theme/themeService";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { ILogService } from "src/base/common/logger";
import { INavigationBarService } from "src/workbench/parts/navigationPanel/navigationBar/navigationBar";
import { INavigationViewService} from "src/workbench/parts/navigationPanel/navigationView/navigationView";
import { INavigationPanelService, NavigationPanel, NavigationBarBuilder} from "src/workbench/parts/navigationPanel/navigationPanel";
import { IFunctionBarService } from "src/workbench/parts/navigationPanel/functionBar/functionBar";
import { IDimension } from "src/base/common/utilities/size";
import { IToolBarService } from "src/workbench/parts/navigationPanel/navigationBar/toolBar/toolBar";
import { assert } from "src/base/common/utilities/panic";

/**
 * @description A base class for Workbench to create and manage the behavior of
 * each sub-component.
 */
export abstract class WorkbenchLayout extends Component {

    // [fields]

    // [constructor]

    constructor(
        protected readonly instantiationService: IInstantiationService,
        @ILogService logService: ILogService,
        @ILayoutService protected readonly layoutService: ILayoutService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @INavigationBarService protected readonly navigationBarService: INavigationBarService,
        @IToolBarService protected readonly toolBarService: IToolBarService,
        @IFunctionBarService protected readonly functionBarService: IFunctionBarService,
        @INavigationViewService protected readonly navigationViewService: INavigationViewService,
        @INavigationPanelService protected readonly navigationPanelService: INavigationPanelService,
        @IWorkspaceService protected readonly workspaceService: IWorkspaceService,
        @IConfigurationService protected readonly configurationService: IConfigurationService,
        @IContextMenuService protected readonly contextMenuService: IContextMenuService,
    ) {
        super('workbench', layoutService.parentContainer, themeService, componentService, logService);
        this.__registerNavigationViews();
    }

    // [protected methods]

    public override layout(): IDimension {
        /**
         * This line of code make sure the workbench will fit the whole window 
         * during window resizing.
         */
        DomUtility.Modifiers.setFastPosition(this.element, 0, 0, 0, 0, 'relative');
        return super.layout(undefined, undefined);
    }

    // [protected helper methods]

    protected __createLayout(): void {

        // register tool buttons
        const navigationBarBuilder = new NavigationBarBuilder(this.toolBarService);
        navigationBarBuilder.registerButtons();

        // assembly the workbench layout
        this.__assemblyWorkbenchComponents();
    }

    protected __registerLayoutListeners(): void {

        /**
         * Listens to each NavigationBar button click events and notifies the 
         * navigationView to switch the view.
         */
        this.__register(this.navigationBarService.onDidClick(e => {
            this.navigationViewService.switchView(e.ID);
        }));

        this.__register(this.navigationPanelService.onDidCollapseStateChange(state => {
            // TODO
        }));
    }

    // [private helper functions]

    private __registerNavigationViews(): void {
        this.navigationViewService.registerView('explorer', ExplorerView);
        // TODO: other navigation-views are also registered here.
    }

    private __assemblyWorkbenchComponents(): void {
        const workbenchConfigurations: IAssembleComponentOpts[] = [
            { 
                component: this.navigationPanelService,
                minimumSize: NavigationPanel.WIDTH,
                initSize: NavigationPanel.WIDTH,
                maximumSize: NavigationPanel.WIDTH * 2,
                priority: Priority.Normal,
            },
            { 
                component: this.workspaceService,
                minimumSize: 0,
                initSize: NavigationPanel.WIDTH,
                maximumSize: null,
                priority: Priority.High,
            },
        ];
    
        this.assembleComponents(Orientation.Horizontal, workbenchConfigurations);
    } 
}