import { ServiceDescriptor } from "src/platform/instantiation/common/descriptor";
import { registerSingleton } from "src/platform/instantiation/common/serviceCollection";
import { CommandService, ICommandService } from "src/platform/command/common/commandService";
import { IKeyboardScreenCastService, KeyboardScreenCastService } from "src/workbench/service/keyboard/keyboardScreenCastService";
import { IKeyboardService, KeyboardService } from "src/workbench/service/keyboard/keyboardService";
import { BrowserDialogService, IDialogService } from 'src/platform/dialog/browser/browserDialogService';
import { IShortcutService, ShortcutService } from 'src/workbench/service/shortcut/shortcutService';
import { SideBar, ISideBarService } from 'src/workbench/parts/sideBar/sideBar';
import { IWorkspaceService, WorkspaceComponent } from 'src/workbench/parts/workspace/workspace';
import { SideViewService, ISideViewService } from 'src/workbench/parts/sideView/sideView';
import { ExplorerTreeService, IExplorerTreeService } from 'src/workbench/service/explorerTree/explorerTreeService';
import { ContextService, IContextService } from 'src/platform/context/common/contextService';
import { ContextMenuService, IContextMenuService } from "src/workbench/service/contextMenu/contextMenuService";
import { ILayoutService, LayoutService } from "src/workbench/service/layout/layoutService";
import { INotificationService, NotificationService } from "src/workbench/service/notification/notificationService";
import { IThemeService, ThemeService } from "src/workbench/service/theme/themeService";

/*******************************************************************************
 * Registraion for desktop browser-side non-important microservices.
 ******************************************************************************/

export function rendererServiceRegistrations(): void {

    // communication
    registerSingleton(IDialogService, new ServiceDescriptor(BrowserDialogService));

    // registration
    registerSingleton(IKeyboardService, new ServiceDescriptor(KeyboardService));
    registerSingleton(IShortcutService, new ServiceDescriptor(ShortcutService));
    registerSingleton(ICommandService, new ServiceDescriptor(CommandService));

    // User Interface
    registerSingleton(ILayoutService, new ServiceDescriptor(LayoutService));
    registerSingleton(ISideBarService, new ServiceDescriptor(SideBar));
    registerSingleton(IWorkspaceService, new ServiceDescriptor(WorkspaceComponent));
    registerSingleton(ISideViewService, new ServiceDescriptor(SideViewService));
    registerSingleton(IKeyboardScreenCastService, new ServiceDescriptor(KeyboardScreenCastService));
    registerSingleton(IThemeService, new ServiceDescriptor(ThemeService));
    registerSingleton(IExplorerTreeService, new ServiceDescriptor(ExplorerTreeService));
    registerSingleton(IContextMenuService, new ServiceDescriptor(ContextMenuService));

    // utilities && tools
    registerSingleton(IContextService, new ServiceDescriptor(ContextService));
    registerSingleton(INotificationService, new ServiceDescriptor(NotificationService)); // TODO: notificationService
    // TODO: performanceService
    // TODO: folderTreeService
    // TODO: notebookTreeService
}