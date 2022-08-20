import 'src/code/platform/configuration/browser/configuration.registrant';
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { registerSingleton } from "src/code/platform/instantiation/common/serviceCollection";
import { CommandService, ICommandService } from "src/code/platform/command/common/commandService";
import { IKeyboardScreenCastService, KeyboardScreenCastService } from "src/code/browser/service/keyboard/keyboardScreenCastService";
import { IKeyboardService, keyboardService } from "src/code/browser/service/keyboard/keyboardService";

/*******************************************************************************
 * Registraion for desktop browser-side non-important microservices.
 ******************************************************************************/

registerSingleton(IKeyboardService, new ServiceDescriptor(keyboardService));
registerSingleton(IKeyboardScreenCastService, new ServiceDescriptor(KeyboardScreenCastService));
registerSingleton(ICommandService, new ServiceDescriptor(CommandService));