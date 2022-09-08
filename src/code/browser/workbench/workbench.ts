import { ContextMenuService, IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { IComponentService } from "src/code/browser/service/component/componentService";
import { WorkbenchLayout } from "src/code/browser/workbench/layout";
import { IWorkbenchService } from "src/code/browser/service/workbench/workbenchService";
import { IKeyboardScreenCastService } from "src/code/browser/service/keyboard/keyboardScreenCastService";
import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { BuiltInConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { IThemeService } from "src/code/browser/service/theme/themeService";
import { IActionBarService } from "src/code/browser/workbench/actionBar/actionBar";
import { IActionViewService } from "src/code/browser/workbench/actionView/actionView";
import { IWorkspaceService } from "src/code/browser/workbench/workspace/workspace";

/**
 * @class Workbench represents all the Components in the web browser.
 */
export class Workbench extends WorkbenchLayout implements IWorkbenchService {

    constructor(
        parent: HTMLElement,
        @IInstantiationService instantiationService: IInstantiationService,
        @IConfigService private readonly configService: IConfigService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @IActionBarService actionBarService: IActionBarService,
        @IActionViewService actionViewService: IActionViewService,
        @IWorkspaceService workspaceService: IWorkspaceService,
    ) {
        super(parent, instantiationService, componentService, themeService, actionBarService, actionViewService, workspaceService);
    }

    public init(): void {
        // initialization services
        this.initServices();
        
        // create each UI part of the workbench
        this.create();

        // register all the relavent listeners
        this.registerListeners();

        // once everything is done we layout the workbench
        this.layout();
    }

    protected initServices(): void {

        // workbench-service
        this.instantiationService.register(IWorkbenchService, this);

        // @deprecated
        this.instantiationService.register(IContextMenuService, new ServiceDescriptor(ContextMenuService));
    }

    /**
     * @description calls 'create()' and '_registerListeners()' for each component.
     */
    protected override _createContent(): void {
        this.__createLayout();
    }

    /**
     * @description register renderer process global listeners.
     */
    protected override _registerListeners(): void {
        this.__registerLayoutListeners();
        this.__registerConfigurationChange();
    }

    // [private helper methods]

    /**
     * @description Responses to configuration change.
     */
    private __registerConfigurationChange(): void {
        this.__registerGlobalConfigurationChange();
    }

    private __registerGlobalConfigurationChange(): void {
        const ifEnabled = this.configService.get<boolean>(BuiltInConfigScope.User, 'workbench.keyboardScreenCast');
        
        let screenCastService: IKeyboardScreenCastService;

        if (ifEnabled) {
            screenCastService = this.instantiationService.getOrCreateService(IKeyboardScreenCastService);
            screenCastService.start();
        }

        this.configService.onDidChange<boolean>(BuiltInConfigScope.User, 'workbench.keyboardScreenCast', ifEnabled => {
            if (ifEnabled) {
                screenCastService.start();
            } else {
                screenCastService.dispose();
            }
        });
    }
}
