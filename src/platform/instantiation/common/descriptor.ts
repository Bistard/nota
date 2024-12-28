import { Constructor } from "src/base/common/utilities/type";
import { InstantiationRequiredParameters } from "src/platform/instantiation/common/instantiation";

export class ServiceDescriptor<T extends Constructor> {
	constructor(
        public readonly ctor: T, 
        public readonly args: InstantiationRequiredParameters<T>, 
        public readonly supportsDelayedInstantiation: boolean = false
    ) {}
}
