import { Component } from 'src/code/workbench/browser/component';
import { WindowBarComponent } from 'src/code/workbench/browser/editor/titleBar/windowBar';
import { FunctionBarComponent } from 'src/code/workbench/browser/editor/titleBar/functionBar';
import { EditorComponentType } from 'src/code/workbench/browser/editor/editor';

/**
 * @description TitleBarComponent stores and handles all the titleBar and functionBar 
 * relevant business. 
 */
export class TitleBarComponent extends Component {
    
    functionBarComponent!: FunctionBarComponent;
    // tabBarComponent!: TabBarComponent;
    windowBarComponent!: WindowBarComponent;

    constructor(parentComponent: Component) {
        super(EditorComponentType.titleBar, parentComponent);
    }

    protected override _createContent(): void {
        
        this._createfunctionBar();
        // this._createTabBar();
        this._createWindowBar();
        
    }

    protected override _registerListeners(): void {
        
        // component registration
        this.functionBarComponent.registerListeners();
        // this.tabBarComponent.registerListeners();
        this.windowBarComponent.registerListeners();
        
    }

    private _createfunctionBar(): void {
        this.functionBarComponent = new FunctionBarComponent(this);
        this.functionBarComponent.create();
    }

    // private _createTabBar(): void {
    //     this.tabBarComponent = new TabBarComponent(this);
    //     this.tabBarComponent.create();
    // }

    private _createWindowBar(): void {
        this.windowBarComponent = new WindowBarComponent(this);
        this.windowBarComponent.create();
    }
    
}
