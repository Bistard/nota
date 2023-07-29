import { ServiceDescriptor } from "src/platform/instantiation/common/descriptor";
import { registerService } from "src/platform/instantiation/common/serviceCollection";
import { CommandService, ICommandService } from "src/platform/command/common/commandService";
import { IKeyboardScreenCastService, KeyboardScreenCastService } from "src/workbench/services/keyboard/keyboardScreenCastService";
import { IKeyboardService, KeyboardService } from "src/workbench/services/keyboard/keyboardService";
import { BrowserDialogService, IDialogService } from 'src/platform/dialog/browser/browserDialogService';
import { IShortcutService, ShortcutService } from 'src/workbench/services/shortcut/shortcutService';
import { SideBar, ISideBarService } from 'src/workbench/parts/sideBar/sideBar';
import { IWorkspaceService, WorkspaceComponent } from 'src/workbench/parts/workspace/workspace';
import { SideViewService, ISideViewService } from 'src/workbench/parts/sideView/sideView';
import { ExplorerTreeService, IExplorerTreeService } from 'src/workbench/services/explorerTree/explorerTreeService';
import { ContextService, IContextService } from 'src/platform/context/common/contextService';
import { ContextMenuService, IContextMenuService } from "src/workbench/services/contextMenu/contextMenuService";
import { ILayoutService, LayoutService } from "src/workbench/services/layout/layoutService";
import { INotificationService, NotificationService } from "src/workbench/services/notification/notificationService";
import { IThemeService, ThemeService } from "src/workbench/services/theme/themeService";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { Editor } from "src/workbench/parts/workspace/editor/editor";

/*******************************************************************************
 * Registraion for desktop browser-side non-important microservices.
 ******************************************************************************/

export function rendererServiceRegistrations(): void {

    // communication
    registerService(IDialogService, new ServiceDescriptor(BrowserDialogService, []));

    // registration
    registerService(IKeyboardService, new ServiceDescriptor(KeyboardService, []));
    registerService(IShortcutService, new ServiceDescriptor(ShortcutService, []));
    registerService(ICommandService, new ServiceDescriptor(CommandService, []));

    // User Interface
    registerService(ILayoutService, new ServiceDescriptor(LayoutService, []));
    registerService(ISideBarService, new ServiceDescriptor(SideBar, []));
    registerService(IWorkspaceService, new ServiceDescriptor(WorkspaceComponent, []));
    registerService(IEditorService, new ServiceDescriptor(Editor, []));
    registerService(ISideViewService, new ServiceDescriptor(SideViewService, []));
    registerService(IKeyboardScreenCastService, new ServiceDescriptor(KeyboardScreenCastService, []));
    registerService(IThemeService, new ServiceDescriptor(ThemeService, []));
    registerService(IExplorerTreeService, new ServiceDescriptor(ExplorerTreeService, []));
    registerService(IContextMenuService, new ServiceDescriptor(ContextMenuService, []));

    // utilities && tools
    registerService(IContextService, new ServiceDescriptor(ContextService, []));
    registerService(INotificationService, new ServiceDescriptor(NotificationService, [])); // TODO: notificationService
    // TODO: performanceService
    // TODO: folderTreeService
    // TODO: notebookTreeService
}