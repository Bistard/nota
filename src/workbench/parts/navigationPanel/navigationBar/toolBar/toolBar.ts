import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { IActionBarService } from './actionBar';
import { IFilterBarService } from './filterBar';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { ILogService } from 'src/base/common/logger';

export const IToolBarService = createService<IToolBarService>('tool-bar-service');

export interface IToolBarService extends IComponent, IService {
    
    /**
     * Switches the toolbar to display the action bar.
     */
    switchToActionBar(): void;

    /**
     * Switches the toolbar to display the filter bar.
     */
    switchToFilterBar(): void;
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

    public switchToActionBar(): void {
        this.actionBarService.setVisible(true);
        this.filterBarService.setVisible(false);
    }

    public switchToFilterBar(): void {
        this.actionBarService.setVisible(false);
        this.filterBarService.setVisible(true);
    }

    protected override _createContent(): void {
        this.actionBarService.create(this);
        this.actionBarService.setVisible(true);

        this.filterBarService.create(this);
        this.filterBarService.setVisible(false);
    }

    protected override _registerListeners(): void {
        
    }
}