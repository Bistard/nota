import { ErrorHandler } from "src/base/common/error";
import { Constructor } from "src/base/common/util/type";
import { CommandRegistrant } from "src/platform/command/common/commandRegistrant";
import { ConfigurationRegistrant } from "src/platform/configuration/common/configurationRegistrant";
import { ReviverRegistrant } from "src/platform/ipc/common/revive";
import { ShortcutRegistrant } from "src/workbench/services/shortcut/shortcutRegistrant";

export const enum RegistrantType {
    Configuration = 'Configuration',
    Shortcut = 'Shortcut',
    Command = 'Command',
    Reviver = 'Reviver',
}

export interface IRegistrant<TType extends RegistrantType> {
    readonly type: TType;
    initRegistrations(): void;
}

type RegistrantTypeMapping = {
    [RegistrantType.Configuration]: ConfigurationRegistrant;
    [RegistrantType.Command]: CommandRegistrant;
    [RegistrantType.Shortcut]: ShortcutRegistrant;
    [RegistrantType.Reviver]: ReviverRegistrant;
};

export type Registrants = RegistrantTypeMapping[keyof RegistrantTypeMapping];

export type GetRegistrantByType<T extends RegistrantType> = T extends keyof RegistrantTypeMapping ? RegistrantTypeMapping[T] : never;


















/**
 * The type of built-in registrants.
 * @deprecated
 */
export const enum RegistrantTypeDeprecated {
    Test = 'test',
    Command = 'command',
    Configuration = 'configuration',
    Shortcut = 'shortcut',
    Reviver = 'reviver',
    DocumentNode = 'document-node',
    EditorExtension = 'editor-extension',
}

/**
 * @deprecated
 */
export interface IRegistrantIdentifier<T> {
    (...args: any[]): void;
	type: T;
}

const _identifiers = new Map<RegistrantTypeDeprecated, IRegistrantIdentifier<any>>();
const _registarnts = new Map<IRegistrantIdentifier<any>, any>();

/**
 * @description Generates a registrant decorator. The idea of `registrant` is a 
 * global singleton that has ability to register various of `things`. Most of 
 * registrations are usually completed once scanning all the javascript files
 * are done.
 * @returns A class decorator that can be only used once. Once the registrant 
 * class is decorated, the class will be automatically created and stored in
 * {@link REGISTRANTS}.
 * 
 * @note `Registrant` can only be accessed through {@link REGISTRANTS}.
 * @deprecated
 */
export function createRegistrant<T>(registrantID: RegistrantTypeDeprecated, ...args: any[]): IRegistrantIdentifier<T> {
    const registrantIdentifier = _identifiers.get(registrantID);
    
    if (registrantIdentifier) {
        return registrantIdentifier;
    }

    const newIdentifier = <any>(function<Ctor extends Constructor<any>> (ctor: Ctor) {
        const existed = _registarnts.get(newIdentifier);
        if (existed) {
            ErrorHandler.onUnexpectedError(new Error('Registering duplicate registrants'));
        }

        const registrant = <T>new ctor(...args);
        _registarnts.set(newIdentifier, registrant);
    });

    _identifiers.set(registrantID, newIdentifier);
    return newIdentifier;
}

/**
 * This is a universal registrant. It is the only way to get all the other
 * registrants which are registered into this universal registrant through the
 * decorator that are created by {@link createRegistrant}.
 * @deprecated
 */
export const REGISTRANTS = new class {

    /**
     * @description Get desired registrant.
     * @param id The identifier that is generated through {@link createRegistrant}.
     * @throws An exception will be thrown if the registrant is never registrant.
     */
    public get<T>(id: IRegistrantIdentifier<T>): T {
        const registrant = _registarnts.get(id);
        if (!registrant) {
            throw new Error(`Unknown registrant: ${id}`);
        }
        return registrant;
    }
};