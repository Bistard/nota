import { Constructor } from "src/base/common/util/type";

export class ServiceDescriptor<T> {

	constructor(
        public readonly ctor: Constructor<T>, 
        public readonly args: any[] = [], 
        public readonly supportsDelayedInstantiation: boolean = false
    ) {
        this.ctor = ctor;
        this.supportsDelayedInstantiation = supportsDelayedInstantiation;
    }
}
