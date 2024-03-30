import 'functionBar.scss'; // TODO
import { Emitter, Register } from 'src/base/common/event';
import { SideButton, ISideButtonOptions } from 'src/workbench/parts/sideBar/sideBarButton';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { ILogService } from 'src/base/common/logger';
import { IThemeService } from 'src/workbench/services/theme/themeService';

export interface IFunctionBarButtonClickEvent {
    readonly id: string;
}

export class FunctionBar extends Component {
    protected override _createContent(): void {
        
    }
    protected override _registerListeners(): void {
        
    }
    private buttons: SideButton[] = [];
    private readonly onDidButtonClick = new Emitter<IFunctionBarButtonClickEvent>();

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService private readonly logService: ILogService,
    ) {
        super('function-bar', null, themeService, componentService);
    }

    // TODO: add a button to the function bar

    public get onButtonClick(): Register<IFunctionBarButtonClickEvent> {
        return this.onDidButtonClick.registerListener;
    }
}
