import { INotebookGroupService, NotebookGroup } from "src/code/platform/notebook/electron/notebookGroup";
import { ContextMenuService, IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { IComponentService } from "src/code/browser/service/componentService";
import { WorkbenchLayout } from "src/code/browser/workbench/layout";
import { i18n, Ii18nOpts, Ii18nService, LanguageType } from "src/code/platform/i18n/i18n";
import { IShortcutService } from "src/code/browser/service/keyboard/shortcutService";
import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { IWorkbenchService } from "src/code/browser/service/workbenchService";
import { IKeyboardScreenCastService } from "src/code/browser/service/keyboard/keyboardScreenCastService";
import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { BuiltInConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { IHostService } from "src/code/platform/host/common/hostService";

/**
 * @class Workbench represents all the Components in the web browser.
 */
export class Workbench extends WorkbenchLayout implements IWorkbenchService {

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        @IConfigService private readonly configService: IConfigService,
        @IComponentService componentService: IComponentService,
        @IHostService private readonly hostService: IHostService,
    ) {
        super(instantiationService, componentService);
    }

    public async init(): Promise<void> {
        await this.__initServices();
        
        this.create();
        this.registerListeners();
    }

    protected async __initServices(): Promise<void> {

        /** {@link Workbench} (self registration) */
        this.instantiationService.register(IWorkbenchService, this);

        /** {@link i18n} */
        const i18nOption: Ii18nOpts = {
            language: this.configService.get<LanguageType>('workbench.language'),
            localeOpts: {
                extension: '.json',
                prefix: '{',
                suffix: '}',
            }
        };
        const i18nService = this.instantiationService.createInstance(i18n, i18nOption);
        await i18nService.init();
        this.instantiationService.register(Ii18nService, i18nService);

        /** {@link ContextMenuService} */
        this.instantiationService.register(IContextMenuService, new ServiceDescriptor(ContextMenuService));

        /** {@link NotebookGroup} */
        this.instantiationService.register(INotebookGroupService, new ServiceDescriptor(NotebookGroup));
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
        this.__registerLayout();
        this.__registerShortcuts();
        this.__registerConfigurationChange();
    }

    // [private helper methods]

    /**
     * @description Shortcut registration.
     */
    private __registerShortcuts(): void {

        const shortcutService = this.instantiationService.getOrCreateService(IShortcutService);
        
        shortcutService.register({
            commandID: 'workbench.open-develop-tool',
            whenID: 'N/A',
            shortcut: new Shortcut(true, true, false, false, KeyCode.KeyI),
            when: null,
            command: () => {
                this.hostService.toggleDevTools();
            },
            override: false,
            activate: true
        });

        shortcutService.register({
            commandID: 'workbench.reload-window',
            whenID: 'N/A',
            shortcut: new Shortcut(true, false, false, false, KeyCode.KeyR),
            when: null,
            command: () => {
                this.hostService.reloadWebPage();
            },
            override: false,
            activate: true
        });
    }

    /**
     * @description Responses to configuration change.
     */
    private __registerConfigurationChange(): void {
        this.__registerGlobalConfigurationChange();
        this.__registerUserConfigurationChange();
    }

    private __registerGlobalConfigurationChange(): void {
        const ifEnabled = this.configService.get<boolean>('workbench.keyboardScreenCast');
        
        let screenCastService: IKeyboardScreenCastService;

        if (ifEnabled) {
            screenCastService = this.instantiationService.getOrCreateService(IKeyboardScreenCastService);
            screenCastService.start();
        }

        this.configService.onDidChange<boolean>(BuiltInConfigScope.Application, 'workbench.keyboardScreenCast', ifEnabled => {
            if (ifEnabled) {
                screenCastService.start();
            } else {
                screenCastService.dispose();
            }
        });
    }

    private __registerUserConfigurationChange(): void {

    }

}
