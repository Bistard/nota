import { app, Menu, MenuItemConstructorOptions } from "electron";
import { ILogService } from "src/base/common/logger";
import { IS_MAC } from "src/base/common/platform";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { IMenuService, MenuTemplate } from "src/platform/menu/common/menuService";
import { IMainWindowService } from "src/platform/window/electron/mainWindowService";
import { IWindowInstance } from "src/platform/window/electron/windowInstance";

export class MainMenuService implements IMenuService {

    // Marker for service injection
    declare _serviceMarker: undefined;

    constructor(
        @ILogService private readonly logService: ILogService,
        @IMainWindowService private readonly mainWindowService: IMainWindowService
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
        return MenuTemplate.map((menuItem) => {
            const { label, submenu } = menuItem;
            const electronMenuItem: MenuItemConstructorOptions = { label };
    
            if (submenu && Array.isArray(submenu)) {
                electronMenuItem.submenu = submenu.map((subItem) => {
                    const { label, type, role } = subItem;
    
                    // Only add a click handler if commandId is defined and exclude commandId from Electron properties
                    const electronSubItem: MenuItemConstructorOptions = { label, type, role };
                    if (subItem.commandId) {
                        electronSubItem.click = () => this.handleMenuClick(subItem.commandId as string);
                    }
    
                    return electronSubItem;
                });
            }
            return electronMenuItem;
        });
    }

    // Handles menu item clicks by sending the command to the focused window
    private handleMenuClick(commandID: string) {
        const window: IWindowInstance = this.mainWindowService.open({});
        window.sendIPCMessage(IpcChannel.rendererRunCommand, {
            commandID: commandID,
            args: []
        });
        this.logService.debug('MainMenuService', `Executing CommandID '${commandID}' to renderer process`);
    }
}
