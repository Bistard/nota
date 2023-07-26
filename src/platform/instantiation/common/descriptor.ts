import { AnyConstructor } from "src/base/common/util/type";
import { NonServiceArguments } from "src/platform/instantiation/common/instantiation";

export class ServiceDescriptor<T extends AnyConstructor> {

	constructor(
        public readonly ctor: T, 
        public readonly args: NonServiceArguments<ConstructorParameters<T>>, 
        public readonly supportsDelayedInstantiation: boolean = false
    ) {
        this.ctor = ctor;
        this.supportsDelayedInstantiation = supportsDelayedInstantiation;
    }
}
