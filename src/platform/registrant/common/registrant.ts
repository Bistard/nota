import type { ShortcutRegistrant } from "src/workbench/services/shortcut/shortcutRegistrant";
import type { ColorRegistrant} from "src/workbench/services/theme/colorRegistrant";
import type { CommandRegistrant } from "src/platform/command/common/commandRegistrant";
import type { ReviverRegistrant } from "src/platform/ipc/common/revive";
import type { MenuRegistrant } from "src/platform/menu/browser/menuRegistrant";
import { ErrorHandler } from "src/base/common/error";
import { ILogService } from "src/base/common/logger";
import { executeOnce } from "src/base/common/utilities/function";
import { panic } from "src/base/common/utilities/panic";
import { Constructor } from "src/base/common/utilities/type";
import { ConfigurationRegistrant } from "src/platform/configuration/common/configurationRegistrant";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";

/**
 * An enumeration representing the different types of registrants.
 * 
 * @remarks
 * This is used to categorize (during runtime) and differentiate various 
 * services or functionalities within an application, such as configurations, 
 * commands, shortcuts, and revivers, and so on.
 */
export const enum RegistrantType {
    Configuration = 'Configuration',
    Shortcut = 'Shortcut',
    Command = 'Command',
    Reviver = 'Reviver',
    Color = 'Color',
    Menu = 'Menu'
}

/**
 * Describes the basic structure of a {@link IRegistrant}.
 * @template TType - A specific registrant type from the `RegistrantType` enum.
 * 
 * @remarks Registrants are key components in the system and they are 
 * responsible for initializing specific functionalities or services.
 */
export interface IRegistrant<TType extends RegistrantType> {
    
    /** 
     * Specifies the type of the registrant. 
     */
    readonly type: TType;
    
    /**
     * @description Initializes the registrations associated with the registrant.
     * @remarks Implementations should handle the logic required to set up the 
     * specific service or functionality.
     */
    initRegistrations(serviceProvider: IServiceProvider): void;
}

/**
 * A mapping between `RegistrantType` and the actual registrant implementations.
 * 
 * @remarks This type is useful for looking up the specific class or type 
 * associated with a given registrant type.
 */
type RegistrantTypeMapping = {
    [RegistrantType.Configuration]: ConfigurationRegistrant;
    [RegistrantType.Command]: CommandRegistrant;
    [RegistrantType.Shortcut]: ShortcutRegistrant;
    [RegistrantType.Reviver]: ReviverRegistrant;
    [RegistrantType.Color]: ColorRegistrant;
    [RegistrantType.Menu]: MenuRegistrant;
};

/**
 * Represents a union of all possible registrant types.
 * 
 * @remarks This type is especially useful when dealing with a function or 
 * method that can accept any kind of registrant without needing to specify its 
 * exact type.
 */
export type Registrants = RegistrantTypeMapping[keyof RegistrantTypeMapping];

/**
 * Fetches the specific registrant type based on the provided {@link RegistrantType}.
 * 
 * @template T - A specific registrant type from the `RegistrantType` enum.
 * 
 * @remarks This type provides a mechanism to dynamically look up the 
 * corresponding registrant type based on the provided `RegistrantType` value.
 */
export type GetRegistrantByType<T extends RegistrantType> = T extends (keyof RegistrantTypeMapping) ? RegistrantTypeMapping[T] : never;

/**
 * @description Creates a registration function for a specific registrant type.
 * 
 * @template T - The type of the registrant.
 * @param type - The type of the registrant to register.
 * @param description - A descriptive text for the registrant.
 * @param register - Function to execute once the registrant is retrieved.
 * 
 * @returns A function that takes a service provider and handles the registration process.
 */
export function createRegister<T extends RegistrantType>(
    type: T, 
    description: string,
    register: (registrant: GetRegistrantByType<T>) => void,
): (provider: IServiceProvider) => void 
{
    return executeOnce(
        (provider: IServiceProvider) => {
            const logService = provider.getOrCreateService(ILogService);
            logService.trace('createRegister', `[${type}] registering: '${description}'...`);

            const service = provider.getOrCreateService(IRegistrantService);
            const registrant = service.getRegistrant(type);
            try {
                register(registrant);
            } catch (error: any) {
                logService.error('createRegister', 'failed registering.', error, { type: type, description: description });
            }
        },
    );
}


