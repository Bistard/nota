import 'src/workbench/parts/navigationPanel/navigationBar/quickAccessBar/media/quickAccessBar.scss';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { Icons } from 'src/base/browser/icon/icons';
import { Button } from 'src/base/browser/basic/button/button';
import { OPERATING_SYSTEM, Platform } from 'src/base/common/platform';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { IContextMenuService } from 'src/workbench/services/contextMenu/contextMenuService';
import { MenuTypes } from 'src/platform/menu/common/menu';

export const IQuickAccessBarService = createService<IQuickAccessBarService>('quick-access-bar-service');

export interface IQuickAccessBarService extends IComponent, IService {

}

export class QuickAccessBar extends Component implements IQuickAccessBarService {
    
    // [fields]

    declare _serviceMarker: undefined;
    public static readonly HEIGHT = 30;

    private _menuButton?: Button;

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        @IContextMenuService private readonly contextMenuService: IContextMenuService,
    ) {
        super('quick-access-bar', null, instantiationService);
    }

    // [public methods]
    
    // [protected methods]

    protected override __createContent(): void {
        if (OPERATING_SYSTEM !== Platform.Mac) {
            this._menuButton = this.__register(this.__createMenuButton());
            this.element.appendChild(this._menuButton.element);
        }
    }

    protected override __registerListeners(): void {}

    // [private methods]

    private __createMenuButton(): Button {
        const button = this.__renderMenuButton();
        this.__registerMenuButton(button);
        return button;
    }

    private __renderMenuButton(): Button {
        const button = new Button({
            id: 'menu', icon: Icons.Menu, classes: ['menu-button']
        });
        button.render(document.createElement('div'));
        return button;
    }

    private __registerMenuButton(button: Button): void {
        this.__register(button.onDidClick(() => {
            this.contextMenuService.showContextMenu({
                getAnchor: () => button.element,
                getContext: () => undefined,
                menu: MenuTypes.TitleBar,
            });
        }));
    }
}