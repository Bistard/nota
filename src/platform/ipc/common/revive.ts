import { URI } from "src/base/common/files/uri";
import { panic } from "src/base/common/utilities/panic";
import { Constructor, isObject } from "src/base/common/utilities/type";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";

export type PrototypeMatcher = (obj: object) => boolean;

/**
 * An interface only for {@link ReviverRegistrant}.
 */
export interface IReviverRegistrant extends IRegistrant<RegistrantType.Reviver> {
    /**
     * @description Register a prototype for future reviving process.
     * @param prototype The prototype to be registered.
     * @param matcher A matcher function to match if the given object mathces 
     *                this registered prototype, if yes, the object will be 
     *                recreated with the prototype.
     */
    registerPrototype<Ctor extends Constructor<any>>(prototype: Ctor, matcher: PrototypeMatcher): void;

    /**
     * @description Revives the given object with the correct prototype.
     * @param obj The given object (could be array).
     */
    revive<T extends object>(obj: T): T;
}

/**
 * When processes are communicating with each other under IPC. After the 
 * deserialization process of `JSON.stringify` and `JSON.parse` the new 
 * serialized object will not inherit the original prototype which may cause 
 * unexpected behaviours during the runtime.
 * 
 * To solve the above situation, you may register a prototype with a given 
 * matcher to match the object when reviving. When invoking `this.revive(object)`
 * and the given object is matched with any registered prototype then it will be
 * re-created with that prototype and returned.
 * 
 * @note
 * When we are designing the matcher function, there is not really a perfect 
 * approach to determine whether an object with a null prototype matches any 
 * registered one. The way we do it is by checking whether the object has all 
 * the required property names from the registered prototypes.
 */
export class ReviverRegistrant implements IReviverRegistrant {

    public readonly type = RegistrantType.Reviver;

    private readonly _prototypes = new Map<Constructor<any>, PrototypeMatcher>();

    constructor() { }

    public initRegistrations(): void {
        
        /**
         * Since the {@link ReviverRegistrant} is constructed in both main
         * and renderer process. Do not register here unless it is shared in 
         * both processes.
         */

        // URI-reviver
        this.registerPrototype(URI, (obj: unknown) => {
            if (Object.prototype.hasOwnProperty.call(obj, 'scheme') &&
                Object.prototype.hasOwnProperty.call(obj, 'authority') &&
                Object.prototype.hasOwnProperty.call(obj, 'path') &&
                Object.prototype.hasOwnProperty.call(obj, 'query') &&
                Object.prototype.hasOwnProperty.call(obj, 'fragment')
            ) {
                return true;
            }
            return false;
        });
    }

    public registerPrototype(prototype: Constructor<any>, matcher: PrototypeMatcher): void {
        if (typeof prototype !== 'function') {
            panic('[ReviverRegistrant] The prototype is not a constructor.');
        }

        const exist = this._prototypes.has(prototype);
        if (exist) {
            panic('[ReviverRegistrant] The prototype is already registered.');
        }

        this._prototypes.set(prototype, matcher);
    }

    public revive<T extends object>(obj: T): T {

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                obj[i] = this.revive(obj[i]);
            }
            return obj;
        }

        if (isObject(obj)) {
            for (const [prototype, matcher] of this._prototypes) {
                if (matcher(obj)) {
                    obj = Object.create(prototype.prototype, Object.getOwnPropertyDescriptors(obj));
                    return obj;
                }
            }
        }

        return obj;
    }
}