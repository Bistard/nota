import { app, BrowserWindow, ipcMain, Menu, MenuItem } from "electron";
import { ILogService } from "src/base/common/logger";
import { IS_MAC } from "src/base/common/platform";
import { IMenuService, MenuTemplate } from "src/platform/menu/common/menuService";

export class MainMenuService implements IMenuService {

    // [field]

    declare _serviceMarker: undefined;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
    ) { 

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

    private getMenuTemplate() {
        return MenuTemplate.map((menuItem) => {
            return {
                ...menuItem,
                submenu: menuItem.submenu?.map((subItem) => {
                    if (subItem.commandId) {
                        return {
                            ...subItem,
                            click: () => this.handleMenuClick(subItem.commandId),
                        };
                    }
                    return subItem;
                }),
            };
        });
    }

    private handleMenuClick(commandID: string) {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.send('menu-item-clicked', commandID);
            this.logService.info('MainMenuService', `MenuItem clicked - ${commandID}`);
        }
    }

    private registerIPCEvents() {
        ipcMain.on('menu-request', (event) => {
            event.reply('menu-response', 'Menu data');
        });
    }
}