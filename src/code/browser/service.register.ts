import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { registerSingleton } from "src/code/platform/instantiation/common/serviceCollection";
import { CommandService, ICommandService } from "src/code/platform/command/common/commandService";
import { IKeyboardScreenCastService, KeyboardScreenCastService } from "src/code/browser/service/keyboard/keyboardScreenCastService";
import { IKeyboardService, keyboardService } from "src/code/browser/service/keyboard/keyboardService";
import { BrowserDialogService, IDialogService } from 'src/code/platform/dialog/browser/browserDialogService';
import { IShortcutService, ShortcutService } from 'src/code/browser/service/shortcut/shortcutService';
import { IThemeService, ThemeService } from 'src/code/browser/service/theme/themeService';
import { SideBar, ISideBarService } from 'src/code/browser/workbench/parts/sideBar/sideBar';
import { IWorkspaceService, WorkspaceComponent } from 'src/code/browser/workbench/parts/workspace/workspace';
import { SideViewService, ISideViewService } from 'src/code/browser/workbench/parts/sideView/sideView';
import { ExplorerTreeService, IExplorerTreeService } from 'src/code/browser/service/explorerTree/explorerTreeService';
import { ContextService, IContextService } from 'src/code/platform/context/common/contextService';
import { ContextMenuService, IContextMenuService } from "src/code/browser/service/contextMenu/contextMenuService";

/*******************************************************************************
 * Registraion for desktop browser-side non-important microservices.
 ******************************************************************************/

export function rendererServiceRegistrations(): void {
    
    // communication
    registerSingleton(IDialogService, new ServiceDescriptor(BrowserDialogService));

    // registration
    registerSingleton(IKeyboardService, new ServiceDescriptor(keyboardService));
    registerSingleton(IShortcutService, new ServiceDescriptor(ShortcutService));
    registerSingleton(ICommandService, new ServiceDescriptor(CommandService));

    // User Interface
    registerSingleton(ISideBarService, new ServiceDescriptor(SideBar));
    registerSingleton(IWorkspaceService, new ServiceDescriptor(WorkspaceComponent));
    registerSingleton(ISideViewService, new ServiceDescriptor(SideViewService));
    registerSingleton(IKeyboardScreenCastService, new ServiceDescriptor(KeyboardScreenCastService));
    registerSingleton(IThemeService, new ServiceDescriptor(ThemeService)); // TODO: themeService
    registerSingleton(IExplorerTreeService, new ServiceDescriptor(ExplorerTreeService));
    registerSingleton(IContextMenuService, new ServiceDescriptor(ContextMenuService));

    // utilities && tools
    registerSingleton(IContextService, new ServiceDescriptor(ContextService));
    // TODO: performanceService
    // TODO: folderTreeService
    // TODO: notebookTreeService
}