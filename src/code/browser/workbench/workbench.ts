import { Component, ComponentType } from "src/code/browser/workbench/component";
import { ActionViewComponent, IActionViewService } from "src/code/browser/workbench/actionView/actionView";
import { ActionBarComponent, IActionBarService } from "src/code/browser/workbench/actionBar/actionBar";
import { EditorComponent, IEditorService } from "src/code/browser/workbench/editor/editor";
import { LOCAL_MDNOTE_DIR_NAME, NoteBookManager } from "src/code/common/model/notebookManger";
import { APP_ROOT_PATH } from "src/base/electron/app";
import { ipcRendererOn, ipcRendererSend } from "src/base/electron/register";
import { ConfigService, DEFAULT_CONFIG_FILE_NAME, DEFAULT_CONFIG_PATH, GLOBAL_CONFIG_FILE_NAME, GLOBAL_CONFIG_PATH, LOCAL_CONFIG_FILE_NAME } from "src/code/common/service/configService";
import { pathJoin } from "src/base/common/string";
import { ContextMenuService, IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { IInstantiationService } from "src/code/common/service/instantiation/instantiation";
import { ServiceDescriptor } from "src/code/common/service/instantiation/descriptor";
import { ComponentService } from "src/code/browser/service/componentService";
import { GlobalConfigService } from "src/code/common/service/globalConfigService";

/**
 * @description Workbench represents all the Components in the web browser.
 */
export class Workbench extends Component {

    private _noteBookManager: NoteBookManager;

    actionBarComponent!: ActionBarComponent;
    actionViewComponent!: ActionViewComponent;
    editorComponent!: EditorComponent;
    
    constructor(
        private readonly instantiationService: IInstantiationService,
    ) {
        super('mainApp', null, document.body, instantiationService.createInstance(ComponentService));
        this._noteBookManager = new NoteBookManager();
        this._noteBookManager.init(APP_ROOT_PATH);

        this.initServices();
        this.create();
        this.registerListeners();
    }

    public initServices(): void {

        // ActionBarService (ActionBarComponent)
        this.instantiationService.register(IActionBarService, new ServiceDescriptor(ActionBarComponent));

        // ActionViewService (ActionViewComponent)
        this.instantiationService.register(IActionViewService, new ServiceDescriptor(ActionViewComponent));

        // EditorService (EditorComponent)
        this.instantiationService.register(IEditorService, new ServiceDescriptor(EditorComponent));

        // ContextMenuService
        this.instantiationService.register(IContextMenuService, new ServiceDescriptor(ContextMenuService));

    }

    /**
     * @description calls 'create()' and '_registerListeners()' for each component.
     */
    protected override _createContent(): void {
        
        this.actionBarComponent = this.instantiationService.createInstance(ActionBarComponent, this);
        this.actionViewComponent = this.instantiationService.createInstance(ActionViewComponent, this, this._noteBookManager);
        this.editorComponent = this.instantiationService.createInstance(EditorComponent, this);
        
        [
            {id: ComponentType.ActionBar, classes: []},
            {id: ComponentType.ActionView, classes: []},
            {id: ComponentType.editor, classes: []},
        ]
        .forEach(({ id, classes }) => {
            const component = this.getComponentById(id);
            component.create();
            component.registerListeners();
        });
    }

    /**
     * @description register renderer process global listeners.
     */
    protected override _registerListeners(): void {
        
        // once the main process notifies this renderer process, we try to 
        // finish the following job.
        ipcRendererOn('closingApp', () => {
            
            // save global configuration first
            GlobalConfigService.Instance.previousNoteBookManagerDir = this._noteBookManager.noteBookManagerRootPath;
            GlobalConfigService.Instance.writeToJSON(GLOBAL_CONFIG_PATH, GLOBAL_CONFIG_FILE_NAME)
            .then(() => {
                // save local or default configuration
                if (GlobalConfigService.Instance.defaultConfigOn) {
                    return ConfigService.Instance.writeToJSON(
                        DEFAULT_CONFIG_PATH, 
                        DEFAULT_CONFIG_FILE_NAME
                    );
                }
                return ConfigService.Instance.writeToJSON(
                    pathJoin(this._noteBookManager.noteBookManagerRootPath, LOCAL_MDNOTE_DIR_NAME), 
                    LOCAL_CONFIG_FILE_NAME
                );
            })
            .then(() => {
                ipcRendererSend('rendererReadyForClosingApp');
            });

        });

        document.getElementById('mainApp')!.addEventListener('click', (ev: MouseEvent) => {
            this.instantiationService.getService(IContextMenuService)!.removeContextMenu();
        });

    }

    public getComponentById(id: string): Component {
        const component = this.componentMap.get(id);
        if (!component) {
            throw new Error(`trying to get an unknown component ${id}`);
        }
        return component;
    }

}
