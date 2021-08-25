import { Component } from 'src/code/workbench/browser/component';
import { IRegisterService } from 'src/code/workbench/service/registerService';
import { TabBarComponent } from 'src/code/workbench/browser/editor/titleBar/tabBar';
import { WindowBarComponent } from 'src/code/workbench/browser/editor/titleBar/windowBar';
import { ToolBarComponent } from 'src/code/workbench/browser/editor/titleBar/toolBar';
import { IEventEmitter } from 'src/base/common/event';
import { EditorComponentType } from 'src/code/workbench/browser/editor/editor';

/**
 * @description TitleBarComponent stores and handles all the titleBar and toolBar 
 * relevant business. 
 */
export class TitleBarComponent extends Component {
    
    toolBarComponent!: ToolBarComponent;
    tabBarComponent!: TabBarComponent;
    windowBarComponent!: WindowBarComponent;

    constructor(parent: HTMLElement,
                registerService: IRegisterService) {
        super(EditorComponentType.titleBar, parent, registerService);
    }

    protected override _createContainer(): void {
        this.parent.appendChild(this.container);
        // customize..
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        
        this._createToolBar();
        this._createTabBar();
        this._createWindowBar();
        
    }

    protected override _registerListeners(): void {
        
        // component registration
        this.toolBarComponent.registerListeners();
        this.tabBarComponent.registerListeners();
        this.windowBarComponent.registerListeners();
        
    }

    private _createToolBar(): void {
        this.toolBarComponent = new ToolBarComponent(this.container, this);
        this.toolBarComponent.create();
    }

    private _createTabBar(): void {
        this.tabBarComponent = new TabBarComponent(this.container, this);
        this.tabBarComponent.create();
    }

    private _createWindowBar(): void {
        this.windowBarComponent = new WindowBarComponent(this.container, this);
        this.windowBarComponent.create();
    }
    
}
