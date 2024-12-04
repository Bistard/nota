import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";
import { MenuTypes, IMenuItemRegistration } from "src/platform/menu/common/menuRegistrant";
import { IS_MAC } from "src/base/common/platform";
import { CommandID } from "src/platform/menu/common/menuService";

export const menuTitleApplicationRegister = createRegister(
    RegistrantType.Menu,
    'menuTitleApplicationRegister',
    (registrant) => {
        const menuItems: IMenuItemRegistration[] = [
            {
                group: '1_about',
                title: 'About Nota',
                command: {
                    commandID: "",
                },
            },
            {
                group: '2_updates',
                title: 'Check for Updates...',
                command: {
                    commandID: "",
                },
            },
            {
                group: '3_settings',
                title: 'Settings...',
                command: {
                    commandID: "",
                },
            },
            {
                group: '4_services',
                title: 'Services',
                command: {
                    commandID: "",
                },
                submenu: [],
            },
            {
                group: '5_window',
                title: `Hide Nota`,
                command: {
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+H' : undefined,
                },
            },
            {
                group: '5_window',
                title: 'Hide Others',
                command: {
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+Alt+H' : undefined,
                },
            },
            {
                group: '5_window',
                title: 'Show All',
                command: {
                    commandID: "",
                },
            },
            {
                group: '6_quit',
                title: IS_MAC ? 'Quit Nota' : 'Exit Nota',
                command: {
                    commandID: "",
                    keybinding: IS_MAC ? 'Cmd+Q' : undefined,
                },
            },
        ];

        for (const item of menuItems) {
            registrant.registerMenuItem(MenuTypes.TitleBarApplication, item);
        }
    }
);

export const menuTitleFileRegister = createRegister(
    RegistrantType.Menu,
    'menuTitleFileRegister',
    (registrant) => {
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
                group: '1_file_operations',
                title: 'Recent Files',
                command: {
                    commandID: "",
                },
                submenu: [
                    {
                        group: '1_recent_files',
                        title: 'file1.txt',
                        command: {
                            commandID: "",
                        },
                        submenu: [
                            {
                                group: '2_file_details',
                                title: 'View Details',
                                command: {
                                    commandID: "",
                                },
                            },
                            {
                                group: '2_file_details',
                                title: 'Open in Explorer',
                                command: {
                                    commandID: "",
                                },
                            },
                        ],
                    },
                    {
                        group: '1_recent_files',
                        title: 'file2.txt',
                        command: {
                            commandID: "",
                        },
                    },
                    {
                        group: '1_recent_files',
                        title: 'file3.txt',
                        command: {
                            commandID: "",
                        },
                    },
                ],
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
    }
);

export const menuTitleEditRegister = createRegister(
    RegistrantType.Menu,
    'menuTitleEditRegister',
    (registrant) => {
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
    }
);

export const menuTitleViewRegister = createRegister(
    RegistrantType.Menu,
    'menuTitleViewRegister',
    (registrant) => {
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
