import { ActionViewComponent, IActionViewService } from "src/code/browser/workbench/actionView/actionView";
import { ActionBarComponent, IActionBarService } from "src/code/browser/workbench/actionBar/actionBar";
import { EditorComponent, IEditorService } from "src/code/browser/workbench/editor/editor";
import { INoteBookManagerService, LOCAL_MDNOTE_DIR_NAME, NoteBookManager } from "src/code/common/model/notebookManager";
import { ipcRendererOn, ipcRendererSend } from "src/base/electron/register";
import { ContextMenuService, IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { IInstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IComponentService } from "src/code/browser/service/componentService";
import { ExplorerViewComponent, IExplorerViewService } from "src/code/browser/workbench/actionView/explorer/explorer";
import { getSingletonServiceDescriptors, registerSingleton } from "src/code/common/service/instantiationService/serviceCollection";
import { DEFAULT_CONFIG_FILE_NAME, DEFAULT_CONFIG_PATH, GLOBAL_CONFIG_FILE_NAME, GLOBAL_CONFIG_PATH, IGlobalConfigService, IUserConfigService, LOCAL_CONFIG_FILE_NAME } from "src/code/common/service/configService/configService";
import { URI } from "src/base/common/file/uri";
import { resolve } from "src/base/common/file/path";
import { EGlobalSettings, IGlobalApplicationSettings, IGlobalNotebookManagerSettings } from "src/code/common/service/configService/configService";
import { WorkbenchLayout } from "src/code/browser/workbench/layout";
import { i18n, Ii18nOpts, Ii18nService } from "src/code/platform/i18n/i18n";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { IShortcutService, ShortcutService } from "src/code/browser/service/shortcutService";
import { IKeyboardService, keyboardService } from "src/code/browser/service/keyboardService";
import { KeyCode, Shortcut } from "src/base/common/keyboard";

// ShortcutService
registerSingleton(IKeyboardService, new ServiceDescriptor(keyboardService));
// ActionBarService
registerSingleton(IActionBarService, new ServiceDescriptor(ActionBarComponent));
// ActionViewService
registerSingleton(IActionViewService, new ServiceDescriptor(ActionViewComponent));
registerSingleton(IExplorerViewService, new ServiceDescriptor(ExplorerViewComponent));
// EditorService
registerSingleton(IEditorService, new ServiceDescriptor(EditorComponent));

/**
 * @class Workbench represents all the Components in the web browser.
 */
export class Workbench extends WorkbenchLayout {

    private _noteBookManager!: NoteBookManager;

    constructor(
        instantiationService: IInstantiationService,
        componentService: IComponentService,
        private readonly globalConfigService: IGlobalConfigService,
        private readonly userConfigService: IUserConfigService,
    ) {
        super(instantiationService, componentService);

        this.initServices().then(() => {
            
            this.create();
            this.registerListeners();
            
        });
    }

    public async initServices(): Promise<void> {

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

        // once the main process notifies this renderer process, we try to 
        // finish the following job.
        ipcRendererOn('closingApp', () => {
            
            // get notebook configuration
            const notebookConfig = this.globalConfigService.get<IGlobalNotebookManagerSettings>(EGlobalSettings.NotebookManager);
            
            // save global configuration first
            notebookConfig.previousNoteBookManagerDir = this._noteBookManager.getRootPath();
            this.globalConfigService.save(URI.fromFile(resolve(GLOBAL_CONFIG_PATH, GLOBAL_CONFIG_FILE_NAME)))
            .then(() => {
                // get application configuration
                const appConfig = this.globalConfigService.get<IGlobalApplicationSettings>(EGlobalSettings.Application);
                
                // save local or default configuration
                if (appConfig.defaultConfigOn) {
                    return this.userConfigService.save(URI.fromFile(resolve(DEFAULT_CONFIG_PATH, DEFAULT_CONFIG_FILE_NAME)));
                }
                return this.userConfigService.save(URI.fromFile(resolve(this._noteBookManager.getRootPath(), LOCAL_MDNOTE_DIR_NAME, LOCAL_CONFIG_FILE_NAME)));
            })
            .then(() => {
                ipcRendererSend('rendererReadyForClosingApp');
            });

        });

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
        })

    }

}
