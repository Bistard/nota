import { Component, ComponentType } from "src/code/workbench/browser/component";
import { IRegisterService } from "src/code/workbench/service/registerService";
import { ActionViewComponent } from "src/code/workbench/browser/actionView/actionView";
import { ActionBarComponent } from "src/code/workbench/browser/actionBar/actionBar";
import { EditorComponent } from "src/code/workbench/browser/editor/editor";

/**
 * @description this module is loaded by the web directly. Most of the modules 
 * are instantiating in here. Also convinents for passing diferent modules into
 * others.
 */
class Workbench implements IRegisterService {

    private mainAppContainer = document.getElementById('mainApp') as HTMLElement;

    private componentMap = new Map<string, Component>();

    actionViewComponent!: ActionViewComponent;
    actionBarComponent!: ActionBarComponent;
    editorComponent!: EditorComponent;
    
    constructor() {    
        this.initComponents();
        this.renderComponents();
    }

    /**
     * @description only initialize the class object, not ready for actual 
     * rendering.
     */
    private initComponents(): void {
        this.actionViewComponent = new ActionViewComponent(this);
        this.actionBarComponent = new ActionBarComponent(this, this.actionViewComponent);
        this.editorComponent = new EditorComponent(this);
    }

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

    public getComponentById(id: string): Component {
        const component = this.componentMap.get(id);
        if (!component) {
            throw new Error(`trying to get unknown component ${id}`);
        }
        return component;
    }

    public registerComponent(component: Component): void {
        this.componentMap.set(component.getId(), component);
    }

}

// since it is loaded by the web which is sepreated by the main.js, it needs to 
// be instantiated individually.
new Workbench();

