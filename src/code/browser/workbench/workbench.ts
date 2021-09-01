import { Component, ComponentType } from "src/code/browser/workbench/component";
import { ActionViewComponent } from "src/code/browser/workbench/actionView/actionView";
import { ActionBarComponent } from "src/code/browser/workbench/actionBar/actionBar";
import { EditorComponent } from "src/code/browser/workbench/editor/editor";
import { LOCAL_MDNOTE_DIR_NAME, NoteBookManager } from "src/code/common/model/notebookManger";
import { APP_ROOT_PATH } from "src/base/electron/app";
import { ipcRendererOn, ipcRendererSend } from "src/base/electron/register";
import { ConfigModule, DEFAULT_CONFIG_FILE_NAME, DEFAULT_CONFIG_PATH, GlobalConfigModule, GLOBAL_CONFIG_FILE_NAME, GLOBAL_CONFIG_PATH, LOCAL_CONFIG_FILE_NAME } from "src/base/config";
import { pathJoin } from "src/base/common/string";
import { CONTEXT_MENU_SERVICE } from 'src/code/browser/service/contextMenuService';

/**
 * @description this module is loaded by the web directly. Most of the modules 
 * are instantiating in here. Also convinents for passing diferent modules into
 * others.
 */
class Workbench extends Component {

    private _noteBookManager: NoteBookManager;

    actionBarComponent!: ActionBarComponent;
    actionViewComponent!: ActionViewComponent;
    editorComponent!: EditorComponent;
    
    constructor() {
        super('mainApp', null, document.body);
        this._noteBookManager = new NoteBookManager();
        this._noteBookManager.init(APP_ROOT_PATH);

        this.startup();
        
    }

    public startup(): void {
        this.initServices();
        this.create();
        this.registerListeners();
    }

    private initServices(): void {

    }

    /**
     * @description calls 'create()' and '_registerListeners()' for each component.
     */
    protected override _createContent(): void {
        this.actionBarComponent = new ActionBarComponent(this);
        this.actionViewComponent = new ActionViewComponent(this, this._noteBookManager);
        this.editorComponent = new EditorComponent(this);
        
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

// since it is loaded by the web which is sepreated from main.js, it needs to 
// be instantiated individually.
new Workbench();

