import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { registerSingleton } from "src/code/platform/instantiation/common/serviceCollection";
import { IKeyboardScreenCastService, KeyboardScreenCastService } from "src/code/browser/service/keyboard/keyboardScreenCastService";
import { IKeyboardService, keyboardService } from "src/code/browser/service/keyboard/keyboardService";


/*******************************************************************************
 * Registraion for desktop browser-side non-important microservices.
 ******************************************************************************/

registerSingleton(IKeyboardService, new ServiceDescriptor(keyboardService));
registerSingleton(IKeyboardScreenCastService, new ServiceDescriptor(KeyboardScreenCastService));
