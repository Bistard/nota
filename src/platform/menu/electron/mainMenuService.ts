import { app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions } from "electron";
import { ILogService } from "src/base/common/logger";
import { IS_MAC } from "src/base/common/platform";
import { CommandID, IMenuService, IMenuState, MenuTemplate } from "src/platform/menu/common/menuService";

const IPC_CHANNEL_MENU_ITEM_CLICKED = 'menu-item-clicked';

export class MainMenuService implements IMenuService {

    // [field]

    declare _serviceMarker: undefined;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
    ) { 
        this.init();
    }

    // [public methods]

    // [private methods]

    private init() {
        this.buildMenu();
        this.registerIPCEvents();
    }

    private buildMenu() {
        // build menu
        const menu = Menu.buildFromTemplate(this.getMenuTemplate());
        Menu.setApplicationMenu(menu);
        this.logService.trace('MainMenuService', 'Application menu has been set.');
        
        if (IS_MAC) {
            app.dock.setMenu(menu);
            this.logService.info('MainMenuService', 'Initialized macOS system menu');
        } else {
            this.logService.info('MainMenuService', 'Customized window system menu');
        }
    }

    private getMenuTemplate(): MenuItemConstructorOptions[] {
        return MenuTemplate.map((menuItem) => {
            const { label, submenu } = menuItem;
            const electronMenuItem: MenuItemConstructorOptions = { label };

            if (submenu && Array.isArray(submenu)) {
                electronMenuItem.submenu = submenu.map((subItem) => {
                    const { label, role, type, commandId } = subItem;
                    const menuItemOptions: MenuItemConstructorOptions = {};

                    if (role) {
                        menuItemOptions.role = role;
                        this.logService.trace('MainMenuService', `Assigned role '${role}' to menu item '${label}'.`);
                    } else if (type) {
                        menuItemOptions.type = type as MenuItemConstructorOptions['type'];
                        this.logService.trace('MainMenuService', `Assigned type '${type}' to menu item '${label}'.`);
                    } else if (label) {
                        menuItemOptions.label = label;
                        this.logService.trace('MainMenuService', `Assigned label '${label}' to menu item.`);
                    }

                    if (commandId) {
                        menuItemOptions.click = () => this.handleMenuClick(commandId);
                    }

                    return menuItemOptions;
                });
            }
            return electronMenuItem;
        });
    }

    private handleMenuClick(commandID: CommandID) {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.send(IPC_CHANNEL_MENU_ITEM_CLICKED, commandID);
            this.logService.trace('MainMenuService', `Sent IPC message '${IPC_CHANNEL_MENU_ITEM_CLICKED}' with CommandID '${commandID}' to renderer process.`);
        } else {
            this.logService.warn('MainMenuService', 'No focused window to send menu command');
        }
    }

    private registerIPCEvents() {
        ipcMain.on('menu-request', (event) => {
            this.logService.debug('MainMenuService', 'Received IPC event \'menu-request\'.');
            event.reply('menu-response', 'Menu data');
        });
        this.logService.trace('MainMenuService', 'IPC events registered.');
    }
}
