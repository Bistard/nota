import 'src/workbench/parts/navigationPanel/navigationBar/media/navigationBar.scss';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { Orientation } from 'src/base/browser/basic/dom';
import { Emitter, Priority, Register } from 'src/base/common/event';
import { ILogService } from 'src/base/common/logger';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { IQuickAccessBarService, QuickAccessBar } from 'src/workbench/parts/navigationPanel/navigationBar/quickAccessBar';
import { ActionBar, IActionBarService } from 'src/workbench/parts/navigationPanel/navigationBar/actionBar';

export const INavigationBarService = createService<INavigationBarService>('navigation-bar-service');

export const enum NavigationButtonType {
    NONE = 'none',
    LOGO = 'logo',

    EXPLORER = 'explorer',
    OUTLINE = 'outline',
    SEARCH = 'search',
    GIT = 'git',

    HELPER = 'helper',
    SETTINGS = 'setting',
}

export interface INavigationBarButtonClickEvent {

    /**
     * The ID of button is clicked.
     */
    readonly ID: string;

    /**
     * The previous ID of button was clicked.
     */
    readonly prevType: string;

    /**
     * If the button clicked is primary.
     */
    readonly isPrimary: boolean;
}

/**
 * An interface only for {@link NavigationBar}.
 */
export interface INavigationBarService extends IComponent, IService {

    /**
     * Events fired when the button is clicked.
     */
    readonly onDidClick: Register<INavigationBarButtonClickEvent>;
}

/**
 * @class NavigationBar provides access to each view and handles the state 
 * transition between each button and display corresponding view.
 */
export class NavigationBar extends Component implements INavigationBarService {

    declare _serviceMarker: undefined;

    // [field]

    public static readonly HEIGHT = 100;

    private readonly _onDidClick = this.__register(new Emitter<INavigationBarButtonClickEvent>());
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        @IQuickAccessBarService private readonly quickAccessBarService: IQuickAccessBarService,
        @IActionBarService private readonly actionBarService: IActionBarService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('navigation-bar', null, themeService, componentService, logService);
    }

    // [public method]

    // [protected override method]

    protected override _createContent(): void {

        // Register buttons along with future development
        // Now registered one in layout.ts - EXPLORE folder icon

        const partConfigurations = [
            { 
                component: this.quickAccessBarService,
                minimumSize: QuickAccessBar.HEIGHT,
                maximumSize: QuickAccessBar.HEIGHT,
                initSize: QuickAccessBar.HEIGHT,
                priority: Priority.Normal,
            },
            { 
                component: this.actionBarService,
                minimumSize: ActionBar.HEIGHT,
                maximumSize: Number.MAX_VALUE,
                initSize: ActionBar.HEIGHT,
                priority: Priority.Normal,
            },
        ];
        this.assembleComponents(Orientation.Vertical, partConfigurations); 
    }

    protected override _registerListeners(): void {

    }
}