import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from "electron";
import { ILogService } from "src/base/common/logger";
import { IS_MAC } from "src/base/common/platform";
import { CommandID, IMenuService, MenuTemplate } from "src/platform/menu/common/menuService";

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
    }

    private buildMenu() {
        const menu = Menu.buildFromTemplate(this.getMenuTemplate());
        Menu.setApplicationMenu(menu);
        if (IS_MAC) {
            app.dock.setMenu(menu);
        }

        this.logService.trace('MainMenuService', 'Application menu has been set.');
    }

    private getMenuTemplate(): MenuItemConstructorOptions[] {
        return MenuTemplate.map((menuItem) => {
            const { label, submenu } = menuItem;
            const electronMenuItem: MenuItemConstructorOptions = { label };
            if (submenu && Array.isArray(submenu)) {
                electronMenuItem.submenu = submenu.map((subItem) => {
                    const { commandId } = subItem;

                    if (commandId) {
                        subItem.click = () => this.handleMenuClick(commandId);
                    }

                    return subItem;
                });
            }
            return electronMenuItem;
        });
    }

    private handleMenuClick(commandID: string) {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.send(IPC_CHANNEL_MENU_ITEM_CLICKED, commandID);
            this.logService.debug('MainMenuService', `Executing CommandID '${commandID}' to renderer process...`);
        }
    }
}
