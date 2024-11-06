import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { ShortcutWeight } from "src/workbench/services/shortcut/shortcutRegistrant";
import { WorkbenchContextKey } from "src/workbench/services/workbench/workbenchContextKeys";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { AllCommands } from "src/workbench/services/workbench/commandList";

export const rendererWorkbenchShortcutRegister = createRegister(
    RegistrantType.Shortcut,
    'rendererWorkbench',
    (registrant) => {
        registrant.register(
            AllCommands.toggleDevTool, {
            shortcut: new Shortcut(true, true, false, false, KeyCode.KeyI),
            weight: ShortcutWeight.Core,
            when: WorkbenchContextKey.inDevelopContext,
            commandArgs: [],
        });
    
        registrant.register(
            AllCommands.reloadWindow, {
            shortcut: new Shortcut(true, false, false, false, KeyCode.KeyR),
            weight: ShortcutWeight.Core,
            when: WorkbenchContextKey.inDevelopContext,
            commandArgs: [],
        });
    
        registrant.register(
            AllCommands.closeApplication, {
            shortcut: new Shortcut(true, false, false, false, KeyCode.KeyQ),
            weight: ShortcutWeight.Core,
            when: WorkbenchContextKey.inDevelopContext,
            commandArgs: [],
        });
        
        registrant.register(
            AllCommands.zoomIn, {
            shortcut: new Shortcut(true, false, false, false, KeyCode.Equal),
            weight: ShortcutWeight.Core,
            when: null,
            commandArgs: [],
        });

        registrant.register(
            AllCommands.zoomOut, {
            shortcut: new Shortcut(true, false, false, false, KeyCode.Minus),
            weight: ShortcutWeight.Core,
            when: null,
            commandArgs: [],
        });
    },
);