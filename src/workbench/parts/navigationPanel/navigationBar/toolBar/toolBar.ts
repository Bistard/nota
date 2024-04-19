import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { IActionBarService } from './actionBar';
import { IFilterBarService } from './filterBar';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { ILogService } from 'src/base/common/logger';

export const IToolBarService = createService<IToolBarService>('tool-bar-service');

export const enum ToolBarType {
    Action,
    Filter
}

export interface IToolBarService extends IComponent, IService {
    
    /**
     * @description Switches the toolbar to display the specified bar.
     * @param type The type of bar for switching.
     */
    switchTo(type: ToolBarType): void;
}

export class ToolBar extends Component implements IToolBarService {

    declare _serviceMarker: undefined;

    // [field]

    public static readonly HEIGHT = 60;

    // [event]

    // [constructor]

    constructor(
        @IActionBarService private readonly actionBarService: IActionBarService,
        @IFilterBarService private readonly filterBarService: IFilterBarService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super("tool-bar", null, themeService, componentService, logService);
    }

    // [public method]

    public switchTo(barType: ToolBarType): void {
        switch (barType) {
            case ToolBarType.Action:
                this.actionBarService.setVisible(true);
                
                // Set all other services to be invisible
                this.filterBarService.setVisible(false);
                break;
            case ToolBarType.Filter:
                this.filterBarService.setVisible(true);

                // Set all other services to be invisible
                this.actionBarService.setVisible(false);
                break;
        }
    }

    // [protected override method]

    protected override _createContent(): void {
        this.actionBarService.create(this);
        this.actionBarService.setVisible(true);

        this.filterBarService.create(this);
        this.filterBarService.setVisible(false);
    }

    protected override _registerListeners(): void {
        
    }
}