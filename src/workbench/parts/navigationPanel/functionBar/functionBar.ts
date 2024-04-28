import 'src/workbench/parts/navigationPanel/functionBar/media/functionBar.scss';
import { NavigationButton } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBarButton';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { ILogService } from 'src/base/common/logger';
import { Icons } from 'src/base/browser/icon/icons';

export const IFunctionBarService = createService<IFunctionBarService>('function-bar-service');

/**
 * An interface only for {@link FunctionBar}.
 */
export interface IFunctionBarService extends IComponent, IService {

}

export class FunctionBar extends Component implements IFunctionBarService {
    
    declare _serviceMarker: undefined;

    // [field]
    
    public static readonly HEIGHT = 40;
    
    // [event]

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('function-bar', null, themeService, componentService, logService);
    }
    
    // [public method]

    public registerButtons(): void {
        
    }

    // [protected override method]

    protected override _createContent(): void {

        // lower button group
        const secondaryContainer = document.createElement('div');
        secondaryContainer.className = 'function-bar-button-container';
        const helpButton = this.__createHelpButton();
        this.element.appendChild(helpButton.element);
    }

    protected override _registerListeners(): void {
        
    }

    // [private helper method]
    private __createHelpButton(): NavigationButton {
        const outlineButton = new NavigationButton(
            { id: 'help', icon: Icons.Help, classes: ['help-button'], isPrimary: true });
        outlineButton.render(document.createElement('div'));
        return outlineButton;
    }
}
