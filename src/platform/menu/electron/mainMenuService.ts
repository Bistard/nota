import { app, Menu, MenuItemConstructorOptions } from "electron";
import { ILogService } from "src/base/common/logger";
import { IS_MAC } from "src/base/common/platform";
import { IContextService } from "src/platform/context/common/contextService";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { IMenuItemRegistration, MenuTypes } from "src/platform/menu/common/menuRegistrant";
import { IMenuService } from "src/platform/menu/common/menuService";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { IMainWindowService } from "src/platform/window/electron/mainWindowService";

export class MainMenuService implements IMenuService {

    // Marker for service injection
    declare _serviceMarker: undefined;

    constructor(
        @ILogService private readonly logService: ILogService,
        @IMainWindowService private readonly mainWindowService: IMainWindowService,
        @IRegistrantService private readonly registrantService: IRegistrantService,
        @IContextService private readonly contextService: IContextService
    ) { 
        this.init();
    }

    private init() {
        this.buildMenu();
    }

    // Builds and sets the application menu
    private buildMenu() {
        const menu = Menu.buildFromTemplate(this.getMenuTemplate());
        Menu.setApplicationMenu(menu);
        if (IS_MAC) {
            app.dock.setMenu(menu);
        }

        this.logService.debug('MainMenuService', 'Application menu has been set.');
    }

    // Creates the menu template with click handlers for each command
    private getMenuTemplate(): MenuItemConstructorOptions[] {
        const menuRegistrant = this.registrantService.getRegistrant(RegistrantType.Menu);

        const topMenus: MenuTypes[] = [
            MenuTypes.TitleBarFile,
            MenuTypes.TitleBarEdit,
            MenuTypes.TitleBarView,
        ];

        // Build the menu template
        const menuTemplate: MenuItemConstructorOptions[] = topMenus.map((menuType) => {
            const menuItems = menuRegistrant.getMenuitems(menuType);
            const menuLabel = this.getMenuLabelForType(menuType);

            const submenu = this.buildSubmenu(menuItems);

            return {
                label: menuLabel,
                submenu: submenu.length > 0 ? submenu : undefined,
            };
        });

        return menuTemplate;
    }

    private getMenuLabelForType(menuType: MenuTypes): string {
        switch (menuType) {
            case MenuTypes.TitleBarFile:
                return 'File';
            case MenuTypes.TitleBarEdit:
                return 'Edit';
            case MenuTypes.TitleBarView:
                return 'View';
            default:
                return '';
        }
    }

    private buildSubmenu(menuItems: IMenuItemRegistration[]): MenuItemConstructorOptions[] {
        const electronSubmenuItems: MenuItemConstructorOptions[] = [];

        // Group the menu items by 'group' and sort them
        const groupedItems = new Map<string, IMenuItemRegistration[]>();
        for (const item of menuItems) {
            const group = item.group || '';
            if (!groupedItems.has(group)) {
                groupedItems.set(group, []);
            }
            groupedItems.get(group)!.push(item);
        }

        // Sort groups if necessary
        const groupNames = Array.from(groupedItems.keys()).sort();

        groupNames.forEach((group, index) => {
            const items = groupedItems.get(group)!;

            items.forEach((item) => {
                // Evaluate 'when' conditions
                if (this.contextService.contextMatchExpr(item.when ?? null)) {
                    const accelerator = IS_MAC ? item.command.mac || item.command.keybinding : item.command.keybinding;
                    const enabled = this.contextService.contextMatchExpr(item.command.when ?? null);

                    const electronMenuItem: MenuItemConstructorOptions = {
                        label: item.title,
                        accelerator,
                        click: () => this.handleMenuClick(item.command.commandID),
                        enabled,
                        type: item.command.toggled ? 'checkbox' : undefined,
                        checked: item.command.toggled ? this.contextService.contextMatchExpr(item.command.toggled) : undefined,
                    };

                    electronSubmenuItems.push(electronMenuItem);
                }
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                    submenu: hasSubmenu ? this.buildSubmenu(item.submenu!) : undefined
            });

            // Add separator between groups if not the last group
            if (index < groupNames.length - 1 && items.length > 0) {
                electronSubmenuItems.push({ type: 'separator' });
            }
        });

        return electronSubmenuItems;
    }

    // Handles menu item clicks by sending the command to the focused window
    private handleMenuClick(commandID: string) {
        let window = this.mainWindowService.getFocusedWindow();
        
        if (!window) {
			const lastActiveWindow = this.mainWindowService.getPrevFocusedWindow();
            if (lastActiveWindow) {
			// if (lastActiveWindow?.isMinimized()) {
				window = lastActiveWindow;
			}
		}

        if (window) {
            window.sendIPCMessage(IpcChannel.rendererRunCommand, {
                commandID: commandID,
                args: []
            });
            this.logService.debug('MainMenuService', `Executing CommandID '${commandID}' to renderer process`);
        }
    }
}
