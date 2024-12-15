import { IS_MAC } from "src/base/common/platform";
import { IMenuItemRegistration, MenuTypes } from "src/platform/menu/common/menu";
import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";
import { AllCommands } from "src/workbench/services/workbench/commandList";

export function createMenuRecentOpenTemplate(): IMenuItemRegistration[] {
    return <IMenuItemRegistration[]>[
        {
            group: '1_recent',
            title: 'Reopen Recent Closed',
            command: {
                commandID: "",
                keybinding: IS_MAC ? 'Shift+Cmd+T' : 'Ctrl+Shift+T',
            },
        },
        {
            group: '3_clear',
            title: 'Clear Recent Opened',
            command: { commandID: AllCommands.fileTreeClearRecentOpened },
        },
    ];
}

// MenuTypes.FileRecentOpen
export const menuRecentOpenRegister = createRegister(
    RegistrantType.Menu,
    '',
    registrant => {
        for (const item of createMenuRecentOpenTemplate()) {
            registrant.registerMenuItem(MenuTypes.FileRecentOpen, item);
        }
    }
);