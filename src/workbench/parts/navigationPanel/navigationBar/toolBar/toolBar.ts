import 'src/workbench/parts/navigationPanel/navigationBar/toolBar/media/toolBar.scss';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { ActionBar } from './actionBar';
import { FilterBar } from './filterBar';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { ILogService } from 'src/base/common/logger';
import { Emitter } from 'src/base/common/event';
import { INavigationBarButtonClickEvent } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBar';
import { NavigationButton, INavigationButtonOptions } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBarButton';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';

export const IToolBarService = createService<IToolBarService>('tool-bar-service');

export const enum ToolBarType {
    Action,
    Filter
}

export interface IToolBarService extends IComponent, IService {
    /**
     * @description Returns a button by provided a button ID.
     * @param ID The ID of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getButton(ID: string): NavigationButton | undefined;

    /**
     * @description Returns a primary button by provided a button ID.
     * @param ID The ID of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getPrimaryButton(ID: string): NavigationButton | undefined;

    /**
     * @description Register a new primary button.
     * @param opts The options to construct the button.
     * @returns A boolean indicates if the button has created.
     */
    registerPrimaryButton(opts: INavigationButtonOptions): boolean;  
    
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

    private readonly actionBarService: ActionBar;
    private readonly filterBarService: FilterBar;

    // [event]

    private readonly _onDidClick = new Emitter<INavigationBarButtonClickEvent>();
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super("tool-bar", null, themeService, componentService, logService);
        this.actionBarService = new ActionBar(componentService, themeService, logService);
        this.filterBarService = new FilterBar(componentService, themeService, logService);
    }

    public getButton(ID: string): NavigationButton | undefined {
        return this.getPrimaryButton(ID);
    }

    public getPrimaryButton(ID: string): NavigationButton | undefined {
        return this.actionBarService._primary.getItem(ID);
    }

    public registerPrimaryButton(opts: INavigationButtonOptions): boolean {
        return this.__registerButton(opts, this.actionBarService._primary);
    }

    // [public method]

    public switchTo(barType: ToolBarType): void {
        switch (barType) {
            case ToolBarType.Action:
                this.actionBarService.setVisible(true);
                this.filterBarService.setVisible(false);
                break;
            case ToolBarType.Filter:
                this.filterBarService.setVisible(true);
                this.actionBarService.setVisible(false);
                break;
        }
    }

    // [protected override method]

    protected override _createContent(): void {
        this.actionBarService.create(this);
        this.filterBarService.create(this);
        
        this.actionBarService.setVisible(true);
        this.filterBarService.setVisible(false);
    }

    protected override _registerListeners(): void {
 
    }

    // [private method]

    private __registerButton(opts: INavigationButtonOptions, widgetBar: WidgetBar<NavigationButton>): boolean {
        const button = new NavigationButton(opts);

        if (widgetBar.hasItem(opts.id)) {
            this.logService.warn('ToolBarService', `Cannot register the tool bar button with duplicate ID.`, { ID: opts.id });
            return false;
        }

        widgetBar.addItem({
            id: opts.id,
            item: button,
            dispose: button.dispose,
        });

        return true;
    }
}