import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { ShortcutWeight } from "src/workbench/services/shortcut/shortcutRegistrant";
import { WorkbenchCommands } from "src/workbench/services/workbench/command.register";
import { WorkbenchContextKey } from "src/workbench/services/workbench/workbenchContextKeys";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";

export const rendererWorkbenchShortcutRegister = createRegister(
    RegistrantType.Shortcut,
    'rendererWorkbench',
    (registrant) => {
        registrant.register({
            commandID: WorkbenchCommands.toggleDevTool,
            shortcut: new Shortcut(true, true, false, false, KeyCode.KeyI),
            weight: ShortcutWeight.Core,
            when: WorkbenchContextKey.inDevelopContext,
        });
    
        registrant.register({
            commandID: WorkbenchCommands.reloadWindow,
            shortcut: new Shortcut(true, false, false, false, KeyCode.KeyR),
            weight: ShortcutWeight.Core,
            when: WorkbenchContextKey.inDevelopContext,
        });
    
        registrant.register({
            commandID: WorkbenchCommands.closeApplication,
            shortcut: new Shortcut(true, false, false, false, KeyCode.KeyQ),
            weight: ShortcutWeight.Core,
            when: WorkbenchContextKey.inDevelopContext,
        });
    },
);