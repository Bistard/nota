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

// ActionBarService
registerSingleton(IActionBarService, new ServiceDescriptor(ActionBarComponent));
// ActionViewService
registerSingleton(IActionViewService, new ServiceDescriptor(ActionViewComponent));
registerSingleton(IExplorerViewService, new ServiceDescriptor(ExplorerViewComponent));
// EditorService
registerSingleton(IEditorService, new ServiceDescriptor(EditorComponent));

/**
 * @description Workbench represents all the Components in the web browser.
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

        this.initServices();
        this.create();
        this.registerListeners();
    }

    public initServices(): void {

        for (let [serviceIdentifer, serviceDescriptor] of getSingletonServiceDescriptors()) {
			this.instantiationService.register(serviceIdentifer, serviceDescriptor);
		}

        // ContextMenuService
        this.instantiationService.register(IContextMenuService, new ServiceDescriptor(ContextMenuService));

        // NoteBookManagerService (async)
        this._noteBookManager = this.instantiationService.createInstance(NoteBookManager);
        this._noteBookManager.init();
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
            if (notebookConfig === undefined) {
                throw new Error('cannot get configuration');
            }

            // save global configuration first
            notebookConfig.previousNoteBookManagerDir = this._noteBookManager.getRootPath();
            this.globalConfigService.save(URI.fromFile(resolve(GLOBAL_CONFIG_PATH, GLOBAL_CONFIG_FILE_NAME)))
            .then(() => {
                // get application configuration
                const appConfig = this.globalConfigService.get<IGlobalApplicationSettings>(EGlobalSettings.Application);
                if (appConfig === undefined) {
                    throw new Error('cannot get configuration');
                }

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
