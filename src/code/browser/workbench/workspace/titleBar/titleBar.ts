import { Component } from 'src/code/browser/service/component/component';
import { WindowBarComponent } from 'src/code/browser/workbench/workspace/titleBar/windowBar';
import { WorkspaceComponentType } from 'src/code/browser/workbench/workspace/workspace';
import { IComponentService } from 'src/code/browser/service/component/componentService';
import { IInstantiationService } from 'src/code/platform/instantiation/common/instantiation';
import { IThemeService } from 'src/code/browser/service/theme/themeService';

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
        @IThemeService themeService: IThemeService,
    ) {
        super(WorkspaceComponentType.titleBar, null, themeService, componentService);
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
