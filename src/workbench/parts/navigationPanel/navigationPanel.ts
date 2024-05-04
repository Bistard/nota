import "src/workbench/parts/navigationPanel/navigationPanel.scss";
import { IComponentService } from "src/workbench/services/component/componentService";
import { Component, IAssembleComponentOpts, IComponent } from "src/workbench/services/component/component";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IThemeService } from "src/workbench/services/theme/themeService";
import { CollapseState, EventType, Orientation, addDisposableListener } from "src/base/browser/basic/dom";
import { INavigationViewService, NavView} from "src/workbench/parts/navigationPanel/navigationView/navigationView";
import { INavigationBarService, NavigationBar } from "src/workbench/parts/navigationPanel/navigationBar/navigationBar";
import { FunctionBar, IFunctionBarService } from "src/workbench/parts/navigationPanel/functionBar/functionBar";
import { ILogService } from "src/base/common/logger";
import { Icons } from "src/base/browser/icon/icons";
import { IToolBarService } from "src/workbench/parts/navigationPanel/navigationBar/toolBar/toolBar";
import { assert } from "src/base/common/utilities/panic";
import { Emitter, Register } from "src/base/common/event";

export const INavigationPanelService = createService<INavigationPanelService>('navigation-panel-service');

export interface INavigationPanelService extends IComponent, IService {

    /**
     * // TODO
     */
    readonly onDidCollapseStateChange: Register<CollapseState>;
}

export class NavigationPanel extends Component implements INavigationPanelService {

    // [fields]
    
    declare _serviceMarker: undefined;
    public static readonly WIDTH = 300;
    
    private _collapseState: CollapseState;
    private _collapseStateButton?: HTMLElement;

    // [event]

    private readonly _onDidCollapseStateChange = this.__register(new Emitter<CollapseState>());
    public readonly onDidCollapseStateChange = this._onDidCollapseStateChange.registerListener;

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
        this._collapseState = CollapseState.Expand;
    }

    // [protected override methods]

    protected override _createContent(): void {
        this.__assemblyParts();
        this.__toggleNavPanelButton();
    }

    protected override _registerListeners(): void {
        const button = assert(this._collapseStateButton);

        this.__register(addDisposableListener(button, EventType.click, () => {
            this._collapseState = (this._collapseState === CollapseState.Collapse)
                ? CollapseState.Expand
                : CollapseState.Collapse;

            this._onDidCollapseStateChange.fire(this._collapseState);
        }));
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

    private __toggleNavPanelButton(): void {
        const buttonWrapper = document.createElement('div');
        buttonWrapper.classList.add('button-wrapper');
    
        const button = document.createElement('button');
        this._collapseStateButton = button;
    
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
    
        this.element.appendChild(buttonWrapper);
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