import { INotebookGroupService, NotebookGroup } from "src/code/platform/notebook/electron/notebookGroup";
import { ipcRendererSend } from "src/base/electron/register";
import { ContextMenuService, IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { IComponentService } from "src/code/browser/service/componentService";
import { IGlobalConfigService } from "src/code/platform/configuration/electron/configService";
import { EGlobalSettings, IGlobalApplicationSettings } from "src/code/platform/configuration/electron/configService";
import { WorkbenchLayout } from "src/code/browser/workbench/layout";
import { i18n, Ii18nOpts, Ii18nService } from "src/code/platform/i18n/i18n";
import { IShortcutService, ShortcutService } from "src/code/browser/service/keyboard/shortcutService";
import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { IpcChannel } from "src/base/common/ipcChannel";
import { IWorkbenchService } from "src/code/browser/service/workbenchService";
import { IIpcService } from "src/code/browser/service/ipcService";
import { IKeyboardScreenCastService, KeyboardScreenCastService } from "src/code/browser/service/keyboard/keyboardScreenCastService";

/**
 * @class Workbench represents all the Components in the web browser.
 */
export class Workbench extends WorkbenchLayout implements IWorkbenchService {

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
        @IIpcService ipcService: IIpcService,
        @IComponentService componentService: IComponentService,
    ) {
        super(instantiationService, ipcService, componentService);
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
        const appConfig = this.globalConfigService.get<IGlobalApplicationSettings>(EGlobalSettings.Application);
        const i18nOption: Ii18nOpts = {
            language: appConfig.displayLanguage,
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
                ipcRendererSend(IpcChannel.ToggleDevelopTool);
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
                ipcRendererSend(IpcChannel.ReloadWindow);
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
        const globalConfiguration = this.globalConfigService.get<IGlobalApplicationSettings>(EGlobalSettings.Application);
        
        let screenCastService: IKeyboardScreenCastService;

        if (globalConfiguration.keyboardScreenCast) {
            screenCastService = this.instantiationService.getOrCreateService(IKeyboardScreenCastService);
            screenCastService.start();
        }

        this.globalConfigService.onDidChangeApplicationSettings(event => {
            if (event.keyboardScreenCast) {
                screenCastService.start();
            } else {
                screenCastService.dispose();
            }
        });
    }

    private __registerUserConfigurationChange(): void {

    }

}
