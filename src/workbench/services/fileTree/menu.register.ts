import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";
import { MenuTypes, IMenuItemRegistration } from "src/platform/menu/common/menu";
import { IS_MAC, IS_WINDOWS } from "src/base/common/platform";
import { AllCommands } from "src/workbench/services/workbench/commandList";
import { WorkbenchContextKey } from "src/workbench/services/workbench/workbenchContextKeys";
import { CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";

export const menuFileTreeContextRegister = createRegister(
    RegistrantType.Menu,
    'menuFileTreeContextRegister',
    (registrant) => {
        const revealID = 
            IS_MAC      ? 'Reveal in Finder' : 
            IS_WINDOWS  ? 'Reveal in File Explorer' 
            /* Linux */ : 'Reveal in Files';

        const menuItems: IMenuItemRegistration[] = [
            {
                group: 'open',
                title: 'Open',
                command: {
                    commandID: "",
                    when: WorkbenchContextKey.inReleaseContext,
                },
            },
            {
                group: 'open',
                title: 'Open in New Tab',
                command: {
                    commandID: "",
                },
            },
            {
                group: 'open',
                title: 'New file...',
                command: {
                    commandID: AllCommands.fileTreeNewFile,
                },
            },
            {
                group: 'open',
                title: 'New folder...',
                command: {
                    commandID: AllCommands.fileTreeNewFolder,
                },
            },
            {
                group: 'open',
                title: revealID,
                command: {
                    commandID: AllCommands.fileTreeRevealInOS,
                    keybinding: 'Shift+Alt+R',
                },
            },
            {
                group: 'move',
                title: 'Cut',
                command: {
                    commandID: AllCommands.fileTreeCut,
                    keybinding: 'Ctrl+X',
                    mac: 'Meta+X',
                },
            },
            {
                group: 'move',
                title: 'Copy',
                command: {
                    commandID: AllCommands.fileTreeCopy,
                    keybinding: 'Ctrl+C',
                    mac: 'Meta+C',
                },
            },
            {
                group: 'move',
                title: 'Paste',
                command: {
                    commandID: AllCommands.fileTreePaste,
                    keybinding: 'Ctrl+V',
                    mac: 'Meta+V',
                },
            },
            {
                group: 'edit',
                title: 'Rename...',
                command: {
                    commandID: "",
                    keybinding: 'F2',
                },
            },
            {
                group: 'edit',
                title: 'Delete',
                command: {
                    commandID: AllCommands.fileTreeDelete,
                    keybinding: 'Delete',
                },
            },
            {
                group: 'copy',
                title: 'Copy Path',
                command: {
                    commandID: AllCommands.fileTreeCopyPath,
                    keybinding: 'Shift+Alt+C',
                },
            },
            {
                group: 'copy',
                title: 'Copy Relative Path',
                command: {
                    commandID: AllCommands.fileTreeCopyRelativePath,
                    keybinding: 'Ctrl+Shift+C',
                    mac: 'Meta+Shift+C',
                },
            },
            
        ];

        for (const item of menuItems) {
            registrant.registerMenuItem(MenuTypes.FileTreeContext, item);
        }
    }
);
