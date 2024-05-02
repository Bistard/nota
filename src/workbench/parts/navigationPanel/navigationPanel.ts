import "src/workbench/parts/navigationPanel/media/navigationPanel.scss";
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

export interface INavigationPanelService extends IComponent, IService {

}

export class NavigationPanel extends Component implements INavigationPanelService {

    // [fields]
    declare _serviceMarker: undefined;
    public static readonly WIDTH = 300;
    private isPanelVisible: boolean = true;

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
        this.__assemblyParts();
        this.toggleNavPanelButton();
    }

    protected override _registerListeners(): void {
        // Register any listeners needed for the navigation panel
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

    private toggleNavPanelButton(): void {
        const buttonWrapper = document.createElement('div');
        buttonWrapper.classList.add('button-wrapper');
    
        const button = document.createElement('button');
        button.addEventListener('click', () => {
            this.isPanelVisible = !this.isPanelVisible;
            this.updatePanelVisibility();
        });
    
        const topPart = document.createElement('div');
        topPart.classList.add('button-part', 'button-top');
    
        const bottomPart = document.createElement('div');
        bottomPart.classList.add('button-part', 'button-bottom');

        const textLabel = document.createElement('span');
        textLabel.classList.add('button-text');
        textLabel.textContent = "Close sidebar";
        button.appendChild(textLabel);

        button.appendChild(topPart);
        button.appendChild(bottomPart);
        buttonWrapper.appendChild(button);
    
        this.element?.appendChild(buttonWrapper);
    }       

    private updatePanelVisibility(): void {
        const panel = document.querySelector('.navigation-panel');
        if (panel) {
            panel.classList.toggle('hidden');
        }
    }
}

export class NavigationBarBuilder {

    constructor(
        private readonly toolBarService: IToolBarService,
    ) {
    }

    public registerButtons(): void {

        /**
         * primary button configurations
         */
        [
            {
                id: 'folder-open',
                icon: Icons.FolderOpen,
            },
            {
                id: 'add-new',
                icon: Icons.AddNew,
            },
        ]
            .forEach(({ id, icon}) => {
                this.toolBarService.registerPrimaryButton({
                    id: id,
                    icon: icon,
                    isPrimary: true,
                });
            });
    }
}