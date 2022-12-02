import { ErrorHandler } from "src/base/common/error";
import { Constructor } from "src/base/common/util/type";

/**
 * The type of built-in registrants.
 */
export const enum RegistrantType {
    Test = 'test',
    Command = 'command',
    Configuration = 'configuration',
    Shortcut = 'shortcut',
    Reviver = 'reviver',
    DocumentNode = 'document-node',
    EditorExtension = 'editor-extension',
}

export interface IRegistrantIdentifier<T> {
    (...args: any[]): void;
	type: T;
}

const _identifiers = new Map<RegistrantType, IRegistrantIdentifier<any>>();
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
 */
export function createRegistrant<T>(registrantID: RegistrantType, ...args: any[]): IRegistrantIdentifier<T> {
    let registrantIdentifier = _identifiers.get(registrantID);
    
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
 * registrants which are registred into this universal registrant through the
 * decorator that are created by {@link createRegistrant}.
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