import { Component, ComponentType } from "src/code/workbench/browser/component";
import { IRegisterService } from "src/code/workbench/service/registerService";
import { ActionViewComponent } from "src/code/workbench/browser/actionView/actionView";
import { ActionBarComponent } from "src/code/workbench/browser/actionBar/actionBar";
import { EditorComponent } from "src/code/workbench/browser/editor/editor";
import { LOCAL_MDNOTE_DIR_NAME, NoteBookManager } from "src/code/common/notebookManger";
import { APP_ROOT_PATH } from "src/base/electron/app";
import { ipcRendererOn, ipcRendererSend } from "src/base/electron/register";
import { ConfigModule, DEFAULT_CONFIG_FILE_NAME, DEFAULT_CONFIG_PATH, GlobalConfigModule, GLOBAL_CONFIG_FILE_NAME, GLOBAL_CONFIG_PATH, LOCAL_CONFIG_FILE_NAME } from "src/base/config";
import { pathJoin } from "src/base/common/string";

/**
 * @description this module is loaded by the web directly. Most of the modules 
 * are instantiating in here. Also convinents for passing diferent modules into
 * others.
 */
class Workbench implements IRegisterService {

    private mainAppContainer = document.getElementById('mainApp') as HTMLElement;

    private componentMap = new Map<string, Component>();

    private noteBookManager: NoteBookManager;

    actionBarComponent!: ActionBarComponent;
    actionViewComponent!: ActionViewComponent;
    editorComponent!: EditorComponent;
    
    constructor() {
        this.noteBookManager = new NoteBookManager();
        this.noteBookManager.init(APP_ROOT_PATH);

        this.initComponents();
        this.renderComponents();
        this.registerListeners();
    }

    /**
     * @description only initialize the class object, not ready for actual 
     * rendering.
     */
    private initComponents(): void {
        this.actionBarComponent = new ActionBarComponent(this);
        this.actionViewComponent = new ActionViewComponent(this, this.noteBookManager);
        this.editorComponent = new EditorComponent(this);
    }

    /**
     * @description calls 'create()' and 'registerListeners()' for each component.
     */
    private renderComponents(): void {
        [
            {id: ComponentType.ActionBar, classes: []},
            {id: ComponentType.ActionView, classes: []},
            {id: ComponentType.editor, classes: []},
        ]
        .forEach(({ id, classes }) => {
            const component = this.getComponentById(id);
            
            // 
            component.create(this.mainAppContainer);
            
            // 
            component.registerListeners();
        });
    }

    /**
     * @description register renderer process global listeners.
     */
    private registerListeners(): void {

        // once the main process notifies this renderer process, we try to 
        // finish the following job.
        ipcRendererOn('closingApp', () => {
            
            // save global configuration first
            GlobalConfigModule.Instance.previousNoteBookManagerDir = this.noteBookManager.noteBookManagerRootPath;
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
                    pathJoin(this.noteBookManager.noteBookManagerRootPath, LOCAL_MDNOTE_DIR_NAME), 
                    LOCAL_CONFIG_FILE_NAME
                );
            })
            .then(() => {
                ipcRendererSend('rendererReadyForClosingApp');
            });

        });

    }

    public getComponentById(id: string): Component {
        const component = this.componentMap.get(id);
        if (!component) {
            throw new Error(`trying to get an unknown component ${id}`);
        }
        return component;
    }

    public registerComponent(component: Component): void {
        this.componentMap.set(component.getId(), component);
    }

}

// since it is loaded by the web which is sepreated from main.js, it needs to 
// be instantiated individually.
new Workbench();

