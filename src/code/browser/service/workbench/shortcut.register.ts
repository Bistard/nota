import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { IShortcutRegistrant, ShortcutWeight } from "src/code/browser/service/shortcut/shortcutRegistrant";
import { WorkbenchCommand } from "src/code/browser/service/workbench/command.register";
import { inDevelopContext } from "src/code/browser/service/workbench/context";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";

const registrant = REGISTRANTS.get(IShortcutRegistrant);

registrant.register({
    commandID: WorkbenchCommand.toggleDevTool,
    shortcut: new Shortcut(true, true, false, false, KeyCode.KeyI),
    weight: ShortcutWeight.Core,
    when: inDevelopContext,
});

registrant.register({
    commandID: WorkbenchCommand.reloadWindow,
    shortcut: new Shortcut(true, false, false, false, KeyCode.KeyR),
    weight: ShortcutWeight.Core,
    when: inDevelopContext,
});

registrant.register({
    commandID: WorkbenchCommand.closeApplication,
    shortcut: new Shortcut(true, false, false, false, KeyCode.KeyQ),
    weight: ShortcutWeight.Core,
    when: inDevelopContext,
});