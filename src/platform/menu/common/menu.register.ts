import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";
import { MenuTypes, IMenuItemRegistration } from "src/platform/menu/common/menuRegistrant";
import { IS_MAC } from "src/base/common/platform";
import { CommandID } from "src/platform/menu/common/menuService";

export const mainMenuRegister = createRegister(
    RegistrantType.Menu,
    'mainMenuRegister',
    (registrant) => {
        // Register 'File' menu items
        const fileMenuItems: IMenuItemRegistration[] = [
            {
                group: '1_file_operations',
                title: 'New',
                command: {
                    commandID: CommandID.NewFile,
                    keybinding: IS_MAC ? 'Cmd+N' : 'Ctrl+N',
                },
            },
            {
                group: '1_file_operations',
                title: 'Open',
                command: {
                    commandID: CommandID.OpenFile,
                    keybinding: IS_MAC ? 'Cmd+O' : 'Ctrl+O',
                },
            },
            {
                group: '2_exit',
                title: IS_MAC ? 'Quit' : 'Exit',
                command: {
                    commandID: CommandID.ExitApp,
                    keybinding: IS_MAC ? 'Cmd+Q' : undefined,
                },
            },
        ];

        for (const item of fileMenuItems) {
            registrant.registerMenuItem(MenuTypes.TitleBarFile, item);
        }

        // Register 'Edit' menu items
        const editMenuItems: IMenuItemRegistration[] = [
            {
                group: '1_undo_redo',
                title: 'Undo',
                command: {
                    commandID: CommandID.Undo,
                    keybinding: IS_MAC ? 'Cmd+Z' : 'Ctrl+Z',
                },
            },
            {
                group: '1_undo_redo',
                title: 'Redo',
                command: {
                    commandID: CommandID.Redo,
                    keybinding: IS_MAC ? 'Shift+Cmd+Z' : 'Ctrl+Y',
                },
            },
        ];

        for (const item of editMenuItems) {
            registrant.registerMenuItem(MenuTypes.TitleBarEdit, item);
        }

        // Register 'Help' menu items
        const helpMenuItems: IMenuItemRegistration[] = [
            {
                group: '1_about',
                title: 'About',
                command: {
                    commandID: CommandID.About,
                },
            },
        ];

        for (const item of helpMenuItems) {
            registrant.registerMenuItem(MenuTypes.TitleBarView, item);
        }
    }
);
