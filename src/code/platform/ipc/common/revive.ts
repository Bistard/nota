import { Constructor, isObject } from "src/base/common/util/type";
import { createRegistrant, RegistrantType } from "src/code/platform/registrant/common/registrant";

export const IReviverRegistrant = createRegistrant<IReviverRegistrant>(RegistrantType.Reviver);

export type PrototypeMatcher = (obj: Object) => boolean;

/**
 * An interface only for {@link ReviverRegistrant}.
 */
export interface IReviverRegistrant {
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
@IReviverRegistrant
class ReviverRegistrant implements IReviverRegistrant {

    private readonly _prototypes = new Map<Constructor<any>, PrototypeMatcher>();

    constructor() {}

    public registerPrototype(prototype: Constructor<any>, matcher: PrototypeMatcher): void {
        if (typeof prototype !== 'function') {
            throw new Error('The prototype is not a constructor.');
        }

        const exist = this._prototypes.has(prototype);
        if (exist) {
            throw new Error('The prototype is already registered.');
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