import { ErrorHandler } from "src/base/common/error";

/**
 * The type of registrants nota currently have.
 */
export const enum RegistrantType {
    Test = 0,
    Command,
    Configuration,
}

export interface IRegistrantIdentifier<T> {
    (...args: any[]): void;
	type: T;
}

const _identifiers = new Map<RegistrantType, IRegistrantIdentifier<any>>();
const _registarnts = new Map<IRegistrantIdentifier<any>, any>();

export function createRegistrant<T>(registrantID: RegistrantType, ...args: any[]): IRegistrantIdentifier<T> {
    let registrantIdentifier = _identifiers.get(registrantID);
    
    if (registrantIdentifier) {
        return registrantIdentifier;
    }

    const newIdentifier = <any>(function<Ctor extends new (...args: any[]) => any> (ctor: Ctor) {
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
 * This is a universal regisrant. It is the only way to get all the other
 * registrants which are registred into this universal registrant through the
 * decorator that are created by {@link createRegistrant}.
 */
export const Registrants = new class {

    /**
     * @description Get desired registrant.
     * @param id The identifier that is generated through {@link createRegistrant}.
     * @throws An exception will be thrown if the registrant is never registrant.
     */
    public get<T>(id: IRegistrantIdentifier<T>): T {
        const regisrant = _registarnts.get(id);
        if (!regisrant) {
            throw new Error(`Unknown registrant: ${id}`);
        }
        return regisrant;
    }
};