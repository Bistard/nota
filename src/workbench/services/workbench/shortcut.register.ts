import { ShortcutWeight } from "src/workbench/services/shortcut/shortcutRegistrant";
import { WorkbenchContextKey } from "src/workbench/services/workbench/workbenchContextKeys";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { AllCommands } from "src/workbench/services/workbench/commandList";

export const rendererWorkbenchShortcutRegister = createRegister(
    RegistrantType.Shortcut,
    'rendererWorkbench',
    (registrant) => {
        registrant.registerBasic(
            AllCommands.toggleDevTool, {
            key: 'Ctrl+Shift+I',
            mac: 'Meta+Shift+I',
            weight: ShortcutWeight.Core,
            when: WorkbenchContextKey.inDevelopContext,
            commandArgs: [],
        });

        registrant.registerBasic(
            AllCommands.toggleInspector, {
            key: 'Ctrl+Alt+I',
            mac: 'Meta+Alt+I',
            weight: ShortcutWeight.Core,
            when: WorkbenchContextKey.inDevelopContext,
            commandArgs: [],
        });
        
        registrant.registerBasic(
            AllCommands.reloadWindow, {
            key: 'Ctrl+R',
            mac: 'Meta+R',
            weight: ShortcutWeight.Core,
            when: WorkbenchContextKey.inDevelopContext,
            commandArgs: [],
        });
        
        registrant.registerBasic(
            AllCommands.closeApplication, {
            key: 'Ctrl+Q',
            mac: 'Meta+Q',
            weight: ShortcutWeight.Core,
            when: WorkbenchContextKey.inDevelopContext,
            commandArgs: [],
        });
        
        registrant.registerBasic(
            AllCommands.zoomIn, {
            key: 'Ctrl+=',
            mac: 'Meta+=',
            weight: ShortcutWeight.Core,
            when: null,
            commandArgs: [],
        });
        
        registrant.registerBasic(
            AllCommands.zoomOut, {
            key: 'Ctrl+-',
            mac: 'Meta+-',
            weight: ShortcutWeight.Core,
            when: null,
            commandArgs: [],
        });
    },
);