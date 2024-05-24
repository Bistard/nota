import 'src/workbench/parts/navigationPanel/navigationBar/quickAccessBar/media/quickAccessBar.scss';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { ILogService } from 'src/base/common/logger';
import { SearchBar } from 'src/base/browser/basic/searchbar/searchbar';
import { Icons } from 'src/base/browser/icon/icons';
import { Button } from 'src/base/browser/basic/button/button';
import { OPERATING_SYSTEM, Platform } from 'src/base/common/platform';

export const IQuickAccessBarService = createService<IQuickAccessBarService>('quick-access-bar-service');

export interface IQuickAccessBarService extends IComponent, IService {
    /**
     * Retrieves the search bar component.
     * 
     * @returns The search bar component, or undefined if it doesn't exist.
     */
    getSearchBar(): SearchBar | undefined;
}

export class QuickAccessBar extends Component implements IQuickAccessBarService {

    declare _serviceMarker: undefined;

    // [fields]

    public static readonly HEIGHT = 40;
    private _searchBar?: SearchBar;

    // [event]

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('quick-access-bar', null, themeService, componentService, logService);
    }

    // [public method]

    public registerButtons(): void {
        
    }

    public getSearchBar(): SearchBar | undefined {
        return this._searchBar;
    }

    // [protected override method]
    
    protected override _createContent(): void {
        let buttonContainer: HTMLElement;

        if (OPERATING_SYSTEM === Platform.Mac) {
            buttonContainer = this.__createMacButtons();
        } else {
            buttonContainer = this.__createOutlineButton().element;
        }
        
        this.element.appendChild(buttonContainer);

        const searchBar = this.__createSearchBar();
        this.element.appendChild(searchBar);
    }
    
    protected override _registerListeners(): void {
        
    } 

    // [private helper method]
    
    private __createOutlineButton(): Button {
        const outlineButton = new Button(
            { id: 'menu', icon: Icons.Menu, classes: ['menu-button'] });
        outlineButton.render(document.createElement('div'));
        return outlineButton;
    }

    private __createMacButtons(): HTMLElement {
        const macButtons = document.createElement('div');
        macButtons.className = 'mac-buttons-container';

        const closeButton = this.__createMacButton('close-btn');
        const minimizeButton = this.__createMacButton('min-btn');
        const maximizeButton = this.__createMacButton('max-btn');

        macButtons.appendChild(closeButton);
        macButtons.appendChild(minimizeButton);
        macButtons.appendChild(maximizeButton);

        return macButtons;
    }

    private __createMacButton(className: string): HTMLElement {
        const button = document.createElement('div');
        button.className = `btn ${className}`;
        return button;
    }

    private __createSearchBar(): HTMLElement {
        const utilityBar = document.createElement('div');
        utilityBar.className = 'quick-access-search-bar';

        if (OPERATING_SYSTEM === Platform.Mac) {
            utilityBar.classList.add('macos');
        }
        
        this._searchBar = this.__register(new SearchBar({
            icon: Icons.Search,
            placeHolder: "search for anything ...",
        }));
        this._searchBar.render(document.createElement('div'));
        
        utilityBar.appendChild(this._searchBar.element);
        return utilityBar;
    }
}
