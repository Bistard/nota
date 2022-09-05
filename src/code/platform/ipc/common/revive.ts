import { Constructor, isObject } from "src/base/common/util/type";
import { createRegistrant, RegistrantType } from "src/code/platform/registrant/common/registrant";

export const IReviverRegistrant = createRegistrant<IReviverRegistrant>(RegistrantType.Reviver);

export type PrototypeMatcher = (obj: Object) => boolean;

export interface IReviverRegistrant {
    registerPrototype<Ctor extends Constructor<any>>(prototype: Ctor, matcher: PrototypeMatcher): void;
    revive<T>(obj: any): T;
}

/**
 * A reviver may be passed into `JSON.parse` so that the value computed by 
 * parsing is transformed before being returned.
 * 
 * When processes are communicating between each other using IPC. After the 
 * deserilization process of `JSON.stringify` and `JSON.parse` the new created 
 * object will not inherit the original prototype which will cause unexpected 
 * behaviours during the usage.
 * 
 * To solve the above situation, // REVIEW
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

    public revive<T>(obj: any): T {
        
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
				obj[i] = this.revive(obj[i]);
			}
            return <any>obj;
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