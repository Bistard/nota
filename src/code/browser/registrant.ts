import 'src/code/platform/configuration/browser/configuration.register';
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { registerSingleton } from "src/code/platform/instantiation/common/serviceCollection";
import { CommandService, ICommandService } from "src/code/platform/command/common/commandService";
import { IKeyboardScreenCastService, KeyboardScreenCastService } from "src/code/browser/service/keyboard/keyboardScreenCastService";
import { IKeyboardService, keyboardService } from "src/code/browser/service/keyboard/keyboardService";
import { BrowserDialogService, IDialogService } from 'src/code/platform/dialog/browser/browserDialogService';
import { IShortcutService, ShortcutService } from 'src/code/browser/service/shortcut/shortcutService';
import { IThemeService, ThemeService } from 'src/code/browser/service/theme/themeService';
import { ActionBarComponent, IActionBarService } from 'src/code/browser/workbench/actionBar/actionBar';
import { IWorkspaceService, WorkspaceComponent } from 'src/code/browser/workbench/workspace/workspace';
import { ActionViewComponent, IActionViewService } from 'src/code/browser/workbench/actionView/actionView';
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
registerSingleton(IActionBarService, new ServiceDescriptor(ActionBarComponent));
registerSingleton(IWorkspaceService, new ServiceDescriptor(WorkspaceComponent));
registerSingleton(IActionViewService, new ServiceDescriptor(ActionViewComponent));
registerSingleton(IKeyboardScreenCastService, new ServiceDescriptor(KeyboardScreenCastService));
registerSingleton(IThemeService, new ServiceDescriptor(ThemeService)); // TODO: themeService
registerSingleton(IExplorerTreeService, new ServiceDescriptor(ExplorerTreeService));

// utilities && tools
// TODO: contextService
// TODO: performanceService
// TODO: folderTreeService
// TODO: notebookTreeService
