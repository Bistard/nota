import { INoteBookManagerService, NoteBookManager } from "src/code/common/model/notebookManager";
import { ipcRendererOn } from "src/base/electron/register";
import { ContextMenuService, IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { IInstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IComponentService } from "src/code/browser/service/componentService";
import { getSingletonServiceDescriptors } from "src/code/common/service/instantiationService/serviceCollection";
import { IGlobalConfigService, IUserConfigService } from "src/code/common/service/configService/configService";
import { EGlobalSettings, IGlobalApplicationSettings } from "src/code/common/service/configService/configService";
import { WorkbenchLayout } from "src/code/browser/workbench/layout";
import { i18n, Ii18nOpts, Ii18nService } from "src/code/platform/i18n/i18n";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { IShortcutService, ShortcutService } from "src/code/browser/service/shortcutService";

/**
 * @class Workbench represents all the Components in the web browser.
 */
export class Workbench extends WorkbenchLayout {

    private _noteBookManager!: NoteBookManager;

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        @IComponentService componentService: IComponentService,
        @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
    ) {
        super(instantiationService, componentService);

        this.initServices().then(() => {
            
            this.create();
            this.registerListeners();
            
        });
    }

    protected async initServices(): Promise<void> {

        // initializes all the singleton dependencies
        for (const [serviceIdentifer, serviceDescriptor] of getSingletonServiceDescriptors()) {
			this.instantiationService.register(serviceIdentifer, serviceDescriptor);
		}

        // shortcutService
        const shortcutService: IShortcutService = this.instantiationService.createInstance(ShortcutService);
        this.instantiationService.register(IShortcutService, shortcutService);

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
        const i18nService = new i18n(i18nOption, this.instantiationService.getService(IFileService)!);
        await i18nService.init();
        this.instantiationService.register(Ii18nService, i18nService);

        // ContextMenuService
        this.instantiationService.register(IContextMenuService, new ServiceDescriptor(ContextMenuService));

        // NoteBookManagerService (async)
        this._noteBookManager = this.instantiationService.createInstance(NoteBookManager);
        await this._noteBookManager.init();
        this.instantiationService.register(INoteBookManagerService, this._noteBookManager);

    }

    /**
     * @description calls 'create()' and '_registerListeners()' for each component.
     */
    protected override _createContent(): void {

        this.createLayout();

    }

    /**
     * @description register renderer process global listeners.
     */
    protected override _registerListeners(): void {
        
        this.registerLayout();

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

}
