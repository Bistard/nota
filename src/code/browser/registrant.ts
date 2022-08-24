import 'src/code/platform/configuration/browser/configuration.register';
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { registerSingleton } from "src/code/platform/instantiation/common/serviceCollection";
import { CommandService, ICommandService } from "src/code/platform/command/common/commandService";
import { IKeyboardScreenCastService, KeyboardScreenCastService } from "src/code/browser/service/keyboard/keyboardScreenCastService";
import { IKeyboardService, keyboardService } from "src/code/browser/service/keyboard/keyboardService";
import { BrowserDialogService, IDialogService } from 'src/code/platform/dialog/browser/browserDialogService';
import { IShortcutService, ShortcutService } from 'src/code/browser/service/shortcut/shortcutService';

/*******************************************************************************
 * Registraion for desktop browser-side non-important microservices.
 ******************************************************************************/

registerSingleton(IKeyboardService, new ServiceDescriptor(keyboardService));
registerSingleton(IShortcutService, new ServiceDescriptor(ShortcutService));
registerSingleton(IKeyboardScreenCastService, new ServiceDescriptor(KeyboardScreenCastService));
registerSingleton(ICommandService, new ServiceDescriptor(CommandService));
registerSingleton(IDialogService, new ServiceDescriptor(BrowserDialogService));