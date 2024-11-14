import { app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions } from "electron";
import { ILogService } from "src/base/common/logger";
import { IS_MAC } from "src/base/common/platform";
import { CommandID, IMenuService, MenuTemplate } from "src/platform/menu/common/menuService";

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
        const menu = Menu.buildFromTemplate(this.getMenuTemplate());
        Menu.setApplicationMenu(menu);
        
        if (IS_MAC) {
            app.dock.setMenu(menu);
            this.logService.info('MainMenuService', 'Initialized macOS system menu');
        } else {
            this.logService.info('MainMenuService', 'Windows - custom renderer menu');
        }
    }

    private getMenuTemplate(): MenuItemConstructorOptions[] {
        return MenuTemplate.map((menuItem) => {
            const { label, submenu } = menuItem;
            const electronMenuItem: MenuItemConstructorOptions = { label };

            if (submenu && Array.isArray(submenu)) {
                electronMenuItem.submenu = submenu.map((subItem) => {
                    const { label, role, type, commandId } = subItem;
                    const menuItem: MenuItemConstructorOptions = {};

                    if (role) {
                        menuItem.role = role;
                    } else if (type) {
                        menuItem.type = type as MenuItemConstructorOptions['type'];
                    } else if (label) {
                        menuItem.label = label;
                    }

                    if (commandId) {
                        menuItem.click = () => this.handleMenuClick(commandId);
                    }

                    return menuItem;
                });
            }
            return electronMenuItem;
        });
    }

    private handleMenuClick(commandID: CommandID) {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.send('menu-item-clicked', commandID);
            this.logService.info('MainMenuService', `MenuItem clicked - ${commandID}`);
        } else {
            this.logService.warn('MainMenuService', 'No focused window to send menu command');
        }
    }

    private registerIPCEvents() {
        ipcMain.on('menu-request', (event) => {
            event.reply('menu-response', 'Menu data');
        });
    }
}
