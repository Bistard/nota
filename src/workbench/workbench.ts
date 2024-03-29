import 'src/workbench/media/workbench.scss';
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IComponentService } from "src/workbench/services/component/componentService";
import { WorkbenchLayout } from "src/workbench/layout";
import { IWorkbenchService } from "src/workbench/services/workbench/workbenchService";
import { IKeyboardScreenCastService } from "src/workbench/services/keyboard/keyboardScreenCastService";
import { ISideBarService } from "src/workbench/parts/sideBar/sideBar";
import { ISideViewService } from "src/workbench/parts/sideView/sideView";
import { IWorkspaceService } from "src/workbench/parts/workspace/workspace";
import { Disposable } from 'src/base/common/dispose';
import { IContextService } from 'src/platform/context/common/contextService';
import { IContextKey } from 'src/platform/context/common/contextKey';
import { IS_LINUX, IS_MAC, IS_WINDOWS } from 'src/base/common/platform';
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from 'src/platform/lifecycle/browser/browserLifecycleService';
import { IBrowserEnvironmentService, IEnvironmentService } from 'src/platform/environment/common/environment';
import { IContextMenuService } from 'src/workbench/services/contextMenu/contextMenuService';
import { ILayoutService } from 'src/workbench/services/layout/layoutService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { IConfigurationService } from 'src/platform/configuration/common/configuration';
import { WorkbenchConfiguration } from 'src/code/browser/configuration.register';
import { SideViewConfiguration } from 'src/workbench/parts/sideView/configuration.register';
import { ILogService } from 'src/base/common/logger';

/**
 * @class Workbench represents all the Components in the web browser.
 */
export class Workbench extends WorkbenchLayout implements IWorkbenchService {

    declare _serviceMarker: undefined;

    // [field]

    private _contextHub?: WorkbenchContextHub;

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        @ILogService logService: ILogService,
        @ILayoutService layoutService: ILayoutService,
        @IConfigurationService configurationService: IConfigurationService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ISideBarService sideBarService: ISideBarService,
        @ISideViewService sideViewService: ISideViewService,
        @IWorkspaceService workspaceService: IWorkspaceService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @IContextMenuService contextMenuService: IContextMenuService,
    ) {
        super(instantiationService, logService, layoutService, componentService, themeService, sideBarService, sideViewService, workspaceService, configurationService, contextMenuService);
        logService.trace('Workbench', 'Workbench constructed.');
    }

    // [public methods]

    public init(): void {
        this.logService.trace('Workbench', 'Initializing...');

        // initialization services
        this.initServices();

        // create each UI part of the workbench
        this.create();

        // register all the relavent listeners
        this.registerListeners();

        // once everything is done we layout the workbench
        this.layout();

        this.logService.trace('Workbench', 'Initialized.');
    }

    protected initServices(): void {

        // workbench-service
        this.instantiationService.register(IWorkbenchService, this);
    }

    /**
     * @description calls 'create()' and '_registerListeners()' for each component.
     */
    protected override _createContent(): void {
        this.__createLayout();

        // open the side view with default one
        const defaultView = this.configurationService.get<string>(SideViewConfiguration.DefaultSideView, 'explorer');
        this.sideViewService.switchView(defaultView);
    }

    /**
     * @description register renderer process global listeners.
     */
    protected override _registerListeners(): void {
        
        // listen to layout changes
        this.__registerLayoutListeners();
        
        // listen to configuration changes
        this.__registerConfigurationListeners();

        // initialize all the context keys only when the application is ready
        this.lifecycleService.when(LifecyclePhase.Ready)
        .then(() => {
            this._contextHub = this.instantiationService.createInstance(WorkbenchContextHub);
            this.__register(this._contextHub);
        });
    }

    // [private helper methods]

    /**
     * @description Responses to configuration change.
     */
    private __registerConfigurationListeners(): void {
        
        // KeyboardScreenCastService
        {
            const screenCastService = this.instantiationService.getOrCreateService(IKeyboardScreenCastService);
            
            // init
            const ifEnable = this.configurationService.get<boolean>(WorkbenchConfiguration.KeyboardScreenCast);
            ifEnable && screenCastService.start();

            // on configuraiton change
            this.__register(this.configurationService.onDidConfigurationChange(e => {
                if (e.affect(WorkbenchConfiguration.KeyboardScreenCast)) {
                    const ifEnable = this.configurationService.get(WorkbenchConfiguration.KeyboardScreenCast);
                    if (ifEnable) {
                        screenCastService.start();
                    } else {
                        screenCastService.dispose();
                    }
                }
            }));
        }
    }
}

export class WorkbenchContextHub extends Disposable {

    // [context - platform]

    // [context - side view]

    private readonly visibleSideView: IContextKey<boolean>;
    private readonly focusedSideView: IContextKey<boolean>;

    // [constructor]

    constructor(
        @IContextService contextService: IContextService,
        @ISideViewService private readonly sideViewService: ISideViewService,
        @IEnvironmentService environmentService: IBrowserEnvironmentService,
    ) {
        super();

        // constant contexts
        {
            // platform
            contextService.createContextKey('isMac', IS_MAC, 'If the running platform is macOS');
            contextService.createContextKey('isLinux', IS_LINUX, 'If the running platform is Linux');
            contextService.createContextKey('isWindows', IS_WINDOWS, 'If the running platform is Windows');

            // environment
            contextService.createContextKey('isPackaged', environmentService.isPackaged, 'Whether the application is in release mode or develop mode');
        }

        // side view
        this.visibleSideView = contextService.createContextKey('visibleSideView', false, 'Whether a side view is visible');
        this.focusedSideView = contextService.createContextKey('focusedSideView', false, 'Whether a side view is focused');

        // auto updates the context keys
        this.__registerListeners();
    }

    // [private helper methods]

    private __registerListeners(): void {

        // side view
        const currSideView = this.sideViewService.currView();
        this.visibleSideView.set(!!currSideView);
        this.__register(this.sideViewService.onDidViewChange(e => this.visibleSideView.set(!!e.view)));
        this.__register(this.sideViewService.onDidFocusChange(isFocused => this.focusedSideView.set(isFocused)));
    }
}