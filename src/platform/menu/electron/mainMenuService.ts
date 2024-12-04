import { app, Menu, MenuItemConstructorOptions } from "electron";
import { Event } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { SafeIpcMain } from "src/platform/ipc/electron/safeIpcMain";
import { IMenuItemRegistrationResolved, MenuTypes } from "src/platform/menu/common/menuRegistrant";
import { IMenuService } from "src/platform/menu/common/menuService";
import { IMainWindowService } from "src/platform/window/electron/mainWindowService";

const mainMenuTypes = [
    MenuTypes.TitleBarApplication,
    MenuTypes.TitleBarFile,
    MenuTypes.TitleBarEdit,
    MenuTypes.TitleBarView
];

export class MainMenuService implements IMenuService {

    // Marker for service injection
    declare _serviceMarker: undefined;
    private menuItemsMap: Map<MenuTypes, IMenuItemRegistrationResolved[]> = new Map();

    constructor(
        @ILogService private readonly logService: ILogService,
        @IMainWindowService private readonly mainWindowService: IMainWindowService
    ) {
        this.registerListener();
    }

    private registerListener() {
        Event.once(this.mainWindowService.onDidOpenWindow)(window => {
            Event.once(window.onRendererReady)(() => {
                window.sendIPCMessage(IpcChannel.Menu, mainMenuTypes);
                SafeIpcMain.instance.once(IpcChannel.Menu, (_, menuItems: [MenuTypes, IMenuItemRegistrationResolved[]][]) => {
                    for (const [menuType, items] of menuItems) {
                        this.menuItemsMap.set(menuType, items);
                    }
                    this.buildMenu();
                });
            });
        });
    }

    // Builds and sets the application menu
    private buildMenu() {
        const menu = Menu.buildFromTemplate(this.getMenuTemplate());
        console.log("menu:", menu);
        // set application menu for the entire app
        Menu.setApplicationMenu(menu);
        // set the context menu for the macOS dock icon,
        // shown when right-clicking the app icon in the dock
        app.dock.setMenu(menu);
        this.logService.debug('MainMenuService', 'Application menu has been set.');
    }

    // Creates the menu template with click handlers for each command
    private getMenuTemplate(): MenuItemConstructorOptions[] {
        const topMenus: MenuTypes[] = [
            MenuTypes.TitleBarApplication,
            MenuTypes.TitleBarFile,
            MenuTypes.TitleBarEdit,
            MenuTypes.TitleBarView,
        ];

        // Build the menu template
        const menuTemplate: MenuItemConstructorOptions[] = topMenus.map((menuType) => {
            // retrieve menu items from the map populated via IPC
            const menuItems = this.menuItemsMap.get(menuType) || [];
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
            case MenuTypes.TitleBarApplication:
                return 'Nota';
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

    private buildSubmenu(menuItems: IMenuItemRegistrationResolved[]): MenuItemConstructorOptions[] {
        const electronSubmenuItems: MenuItemConstructorOptions[] = [];

        // group the menu items by 'group' and sort them
        const groupedItems = new Map<string, IMenuItemRegistrationResolved[]>();
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
                const accelerator = item.command.mac || item.command.keybinding;
                const hasSubmenu = item.submenu && item.submenu.length > 0;

                const electronMenuItem: MenuItemConstructorOptions = {
                    label: item.title,
                    accelerator,
                    click: () => this.handleMenuClick(item.command.commandID),
                    enabled: item.when ?? true,
                    type: item.command.toggled ? 'checkbox' : undefined,
                    checked: item.command.toggled,
                    submenu: hasSubmenu ? this.buildSubmenu(item.submenu!) : undefined
                };

                electronSubmenuItems.push(electronMenuItem);
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
