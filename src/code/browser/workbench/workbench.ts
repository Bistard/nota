import { INotebookManagerService, NotebookManager } from "src/code/common/model/notebookManager";
import { ipcRendererOn, ipcRendererSend } from "src/base/electron/register";
import { ContextMenuService, IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { IInstantiationService, InstantiationError } from "src/code/common/service/instantiationService/instantiation";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IComponentService } from "src/code/browser/service/componentService";
import { getSingletonServiceDescriptors } from "src/code/common/service/instantiationService/serviceCollection";
import { IGlobalConfigService } from "src/code/common/service/configService/configService";
import { EGlobalSettings, IGlobalApplicationSettings } from "src/code/common/service/configService/configService";
import { WorkbenchLayout } from "src/code/browser/workbench/layout";
import { i18n, Ii18nOpts, Ii18nService } from "src/code/platform/i18n/i18n";
import { IShortcutService, ShortcutService } from "src/code/browser/service/shortcutService";
import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { IpcCommand } from "src/base/electron/ipcCommand";
import { IWorkbenchService } from "src/code/browser/service/workbenchService";
import { IIpcService } from "src/code/browser/service/ipcService";

/**
 * @class Workbench represents all the Components in the web browser.
 */
export class Workbench extends WorkbenchLayout implements IWorkbenchService {

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        @IComponentService componentService: IComponentService,
        @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
        @IIpcService ipcService: IIpcService,
    ) {
        super(instantiationService, componentService, ipcService);
    }

    public async init(): Promise<void> {
        await this.__initServices();
        
        this.create();
        this.registerListeners();

        this._onDidFinishLayout.fire();
    }

    protected async __initServices(): Promise<void> {

        // WorkbenchLayoutService (self)
        this.instantiationService.register(IWorkbenchService, this);

        // TODO: move to browser.ts
        // singleton initialization
        for (const [serviceIdentifer, serviceDescriptor] of getSingletonServiceDescriptors()) {
			this.instantiationService.register(serviceIdentifer, serviceDescriptor);
		}

        // shortcutService
        this.instantiationService.register(IShortcutService, new ServiceDescriptor(ShortcutService));

        // i18nService
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

        // ContextMenuService
        this.instantiationService.register(IContextMenuService, new ServiceDescriptor(ContextMenuService));

        // NotebookManagerService
        this.instantiationService.register(INotebookManagerService, new ServiceDescriptor(NotebookManager));

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
            
        // TODO: below codes requires refactor

        this.container.addEventListener('click', (ev: MouseEvent) => {
            const service = this.instantiationService.getService(IContextMenuService);
            if (service) {
                service.removeContextMenu();
            }
            const menu = document.querySelector(".toastui-editor-context-menu") as HTMLElement;
            menu.style.display = 'none';
        });

        ipcRendererOn('closeContextMenu', () => {
            const service = this.instantiationService.getService(IContextMenuService);
            if (service) {
                service.removeContextMenu();
            }
        });

    }

    // [private helper methods]

    /**
     * @description Shortcut registration.
     */
    private __registerShortcuts(): void {

        const shortcutService = this.instantiationService.getService(IShortcutService);
        if (shortcutService === null) {
            throw new InstantiationError('workbench', IShortcutService);
        }

        shortcutService.register({
            commandID: 'workbench.open-develop-tool',
            whenID: 'N/A',
            shortcut: new Shortcut(true, true, false, false, KeyCode.KeyI),
            when: null,
            command: () => {
                ipcRendererSend(IpcCommand.OpenDevelopTool);
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
                ipcRendererSend(IpcCommand.ReloadWindow);
            },
            override: false,
            activate: true
        });

    }

}
