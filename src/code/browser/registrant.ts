import 'src/code/platform/configuration/browser/configuration.register';
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { registerSingleton } from "src/code/platform/instantiation/common/serviceCollection";
import { CommandService, ICommandService } from "src/code/platform/command/common/commandService";
import { IKeyboardScreenCastService, KeyboardScreenCastService } from "src/code/browser/service/keyboard/keyboardScreenCastService";
import { IKeyboardService, keyboardService } from "src/code/browser/service/keyboard/keyboardService";
import { BrowserDialogService, IDialogService } from 'src/code/platform/dialog/browser/browserDialogService';
import { IShortcutService, ShortcutService } from 'src/code/browser/service/shortcut/shortcutService';
import { IThemeService, ThemeService } from 'src/code/browser/service/theme/themeService';
import { SideBar, ISideBarService } from 'src/code/browser/workbench/sideBar/sideBar';
import { IWorkspaceService, WorkspaceComponent } from 'src/code/browser/workbench/workspace/workspace';
import { SideViewService, ISideViewService } from 'src/code/browser/workbench/sideView/sideView';
import { ExplorerTreeService, IExplorerTreeService } from 'src/code/browser/service/explorerTree/explorerTreeService';

/*******************************************************************************
 * Registraion for desktop browser-side non-important microservices.
 ******************************************************************************/

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

// utilities && tools
// TODO: contextService
// TODO: performanceService
// TODO: folderTreeService
// TODO: notebookTreeService
