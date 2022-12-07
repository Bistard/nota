import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { IShortcutRegistrant, ShortcutWeight } from "src/code/browser/service/shortcut/shortcutRegistrant";
import { WorkbenchCommands } from "src/code/browser/service/workbench/command.register";
import { WorkbenchContextKey } from "src/code/browser/service/workbench/workbenchContextKeys";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";

export function workbenchShortcutRegistrations() {
    const registrant = REGISTRANTS.get(IShortcutRegistrant);

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
}