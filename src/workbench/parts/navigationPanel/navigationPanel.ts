import "src/workbench/parts/navigationPanel/navigationPanel.scss";
import { IComponentService } from "src/workbench/services/component/componentService";
import { Component, IAssembleComponentOpts, IComponent } from "src/workbench/services/component/component";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IThemeService } from "src/workbench/services/theme/themeService";
import { CollapseState, DirectionX, Orientation } from "src/base/browser/basic/dom";
import { INavigationViewService, NavView} from "src/workbench/parts/navigationPanel/navigationView/navigationView";
import { INavigationBarService, NavigationBar } from "src/workbench/parts/navigationPanel/navigationBar/navigationBar";
import { FunctionBar, IFunctionBarService } from "src/workbench/parts/navigationPanel/functionBar/functionBar";
import { ILogService } from "src/base/common/logger";
import { Icons } from "src/base/browser/icon/icons";
import { IToolBarService } from "src/workbench/parts/navigationPanel/navigationBar/toolBar/toolBar";
import { Register } from "src/base/common/event";
import { ToggleCollapseButton } from "src/base/browser/secondary/toggleCollapseButton/toggleCollapseButton";
import { assert } from "src/base/common/utilities/panic";

export const INavigationPanelService = createService<INavigationPanelService>('navigation-panel-service');

/**
 * An interface only for {@link NavigationPanel}.
 */
export interface INavigationPanelService extends IComponent, IService {

    /**
     * Fires when the navigation panel wether collapsed.
     */
    readonly onDidCollapseStateChange: Register<CollapseState>;
}

export class NavigationPanel extends Component implements INavigationPanelService {

    // [fields]
    
    declare _serviceMarker: undefined;
    public static readonly WIDTH = 300;
    
    private _button?: ToggleCollapseButton;

    // [event]

    get onDidCollapseStateChange() { return assert(this._button).onDidCollapseStateChange; }
    
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
        this._button = undefined;
    }

    // [protected override methods]

    protected override _createContent(): void {
        this.__assemblyParts();
        
        // collapse button
        this._button = new ToggleCollapseButton({
            position: DirectionX.Right,
            positionOffset: -20,
            direction: DirectionX.Left,
        });
        this._button.render(this.element.element);
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
            });
        });
    }
}