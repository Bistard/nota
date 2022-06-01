import { Component } from 'src/code/browser/workbench/component';
import { WindowBarComponent } from 'src/code/browser/workbench/workspace/titleBar/windowBar';
import { WorkspaceComponentType } from 'src/code/browser/workbench/workspace/workspace';
import { IComponentService } from 'src/code/browser/service/componentService';
import { IInstantiationService } from 'src/code/common/service/instantiationService/instantiation';

export const enum TitleBarComponentType {
    functionBar = 'function-bar',
    windowBar = 'window-bar',
}

/**
 * @class TitleBarComponent stores and handles all the titleBar and functionBar 
 * relevant business. 
 */
export class TitleBarComponent extends Component {
    
    windowBarComponent!: WindowBarComponent;

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
    ) {
        super(WorkspaceComponentType.titleBar, null, componentService);
    }

    protected override _createContent(): void {
        this._createWindowBar();
    }

    protected override _registerListeners(): void {
        
        // component registration
        this.windowBarComponent.registerListeners();
        
    }

    private _createWindowBar(): void {
        this.windowBarComponent = this.instantiationService.createInstance(WindowBarComponent);
        this.windowBarComponent.create(this);
    }
    
}
