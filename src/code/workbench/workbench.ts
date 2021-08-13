import { ConfigModule } from "src/base/config";
import { Component, ComponentType } from "src/code/workbench/browser/component";
import { IWorkbenchService } from "src/code/workbench/service/workbenchService";
import { ActionViewComponent } from "src/code/workbench/browser/actionView/actionView";
import { ActionBarComponent } from "src/code/workbench/browser/actionBar/actionBar";
import { FolderTree } from "src/code/workbench/browser/actionView/folderView/foldertree";
import { TabBarComponent } from "src/code/workbench/browser/actionView/folderView/tabBar";
// import { FolderModule } from "src/code/workbench/browser/actionView/folderView/folder";
// import { MarkdownModule } from "src/code/workbench/browser/content/markdown/markdown";
// import { TitleBarModule } from "src/code/workbench/browser/content/titleBar/titleBar";



/**
 * @description this module is loaded by the web directly. Most of the modules 
 * are instantiating in here. Also convinents for passing diferent modules into
 * others.
 */
class Workbench implements IWorkbenchService {

    private mainAppContainer = document.getElementById('mainApp') as HTMLElement;

    private componentMap = new Map<string, Component>();

    Config: ConfigModule;
    actionViewComponent!: ActionViewComponent;
    actionBarComponent!: ActionBarComponent;
    folderTree!: FolderTree;
    tabBarComponent!: TabBarComponent;
    // Folder: FolderModule;
    // Markdown: MarkdownModule;
    // TitleBar: TitleBarModule;

    constructor() {
        this.Config = new ConfigModule();
        
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
        this.tabBarComponent = new TabBarComponent(this, this.Config);
    }

    private renderComponents(): void {
        [
            {id: ComponentType.ActionBar, classes: []},
            {id: ComponentType.ActionView, classes: []},
            {id: ComponentType.TabBar, classes: []},
            // {id: ComponentType.ContentView, classes: []},
        ]
        .forEach(({ id, classes }) => {
            const component = this.getComponentById(id);
            
            // 
            component.create(this.mainAppContainer);
            
            // 
            component.register();
        });
    }

    private initComponentContainer(id: ComponentType, classes: string[]): HTMLElement {
        const component = document.createElement('div');
        component.classList.add(...classes);
        component.id = id;
        
        return component;
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

