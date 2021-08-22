import { Component } from 'src/code/workbench/browser/component';
import { IRegisterService } from 'src/code/workbench/service/registerService';
import { TabBarComponent } from 'src/code/workbench/browser/editor/titleBar/tabBar';
import { WindowBarComponent } from 'src/code/workbench/browser/editor/titleBar/windowBar';
import { ToolBarComponent } from 'src/code/workbench/browser/editor/titleBar/toolBar';
import { IEventEmitter } from 'src/base/common/event';

/**
 * @description TitleBarComponent stores and handles all the titleBar and toolBar 
 * relevant business. 
 */
export class TitleBarComponent extends Component {
    
    private _eventEmitter: IEventEmitter;

    toolBarComponent!: ToolBarComponent;
    tabBarComponent!: TabBarComponent;
    windowBarComponent!: WindowBarComponent;

    constructor(registerService: IRegisterService,
                _eventEmitter: IEventEmitter
    ) {
        super('title-bar', registerService);

        this._eventEmitter = _eventEmitter;
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
        this.toolBarComponent = new ToolBarComponent(this, this._eventEmitter);
        this.toolBarComponent.create(this.container);
    }

    private _createTabBar(): void {
        this.tabBarComponent = new TabBarComponent(this);
        this.tabBarComponent.create(this.container);
    }

    private _createWindowBar(): void {
        this.windowBarComponent = new WindowBarComponent(this);
        this.windowBarComponent.create(this.container);
    }
    
}
