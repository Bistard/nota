import { Component } from 'src/code/workbench/browser/component';
import { IRegisterService } from 'src/code/workbench/service/registerService';
import { TabBarComponent } from 'src/code/workbench/browser/editor/titleBar/tabBar';
import { WindowBarComponent } from 'src/code/workbench/browser/editor/titleBar/windowBar';
import { FunctionBarComponent } from 'src/code/workbench/browser/editor/titleBar/functionBar';
import { EditorComponentType } from 'src/code/workbench/browser/editor/editor';

/**
 * @description TitleBarComponent stores and handles all the titleBar and functionBar 
 * relevant business. 
 */
export class TitleBarComponent extends Component {
    
    functionBarComponent!: FunctionBarComponent;
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
        
        this._createfunctionBar();
        this._createTabBar();
        this._createWindowBar();
        
    }

    protected override _registerListeners(): void {
        
        // component registration
        this.functionBarComponent.registerListeners();
        this.tabBarComponent.registerListeners();
        this.windowBarComponent.registerListeners();
        
    }

    private _createfunctionBar(): void {
        this.functionBarComponent = new FunctionBarComponent(this.container, this);
        this.functionBarComponent.create();
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
