import { Component, ComponentType } from "src/code/browser/workbench/component";
import { ActionViewComponent, IActionViewService } from "src/code/browser/workbench/actionView/actionView";
import { ActionBarComponent, IActionBarService } from "src/code/browser/workbench/actionBar/actionBar";
import { EditorComponent, IEditorService } from "src/code/browser/workbench/editor/editor";
import { LOCAL_MDNOTE_DIR_NAME, NoteBookManager } from "src/code/common/model/notebookManger";
import { APP_ROOT_PATH } from "src/base/electron/app";
import { ipcRendererOn, ipcRendererSend } from "src/base/electron/register";
import { ConfigModule, DEFAULT_CONFIG_FILE_NAME, DEFAULT_CONFIG_PATH, GlobalConfigModule, GLOBAL_CONFIG_FILE_NAME, GLOBAL_CONFIG_PATH, LOCAL_CONFIG_FILE_NAME } from "src/base/config";
import { pathJoin } from "src/base/common/string";
import { CONTEXT_MENU_SERVICE } from 'src/code/browser/service/contextMenuService';
import { IInstantiationService } from "src/code/common/service/instantiation/instantiation";
import { ServiceDescriptor } from "src/code/common/service/instantiation/descriptor";

/**
 * @description Workbench represents all the Components in the web browser.
 */
export class Workbench extends Component {

    private _noteBookManager: NoteBookManager;

    actionBarComponent!: ActionBarComponent;
    actionViewComponent!: ActionViewComponent;
    editorComponent!: EditorComponent;
    
    constructor(private readonly instantiationService: IInstantiationService) {
        super('mainApp', null, document.body);
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

        // ComponentService

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
            GlobalConfigModule.Instance.previousNoteBookManagerDir = this._noteBookManager.noteBookManagerRootPath;
            GlobalConfigModule.Instance.writeToJSON(GLOBAL_CONFIG_PATH, GLOBAL_CONFIG_FILE_NAME)
            .then(() => {
                // save local or default configuration
                if (GlobalConfigModule.Instance.defaultConfigOn) {
                    return ConfigModule.Instance.writeToJSON(
                        DEFAULT_CONFIG_PATH, 
                        DEFAULT_CONFIG_FILE_NAME
                    );
                }
                return ConfigModule.Instance.writeToJSON(
                    pathJoin(this._noteBookManager.noteBookManagerRootPath, LOCAL_MDNOTE_DIR_NAME), 
                    LOCAL_CONFIG_FILE_NAME
                );
            })
            .then(() => {
                ipcRendererSend('rendererReadyForClosingApp');
            });

        });

        document.getElementById('mainApp')!.addEventListener('click', (ev: MouseEvent) => {
            CONTEXT_MENU_SERVICE.removeContextMenu();
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
