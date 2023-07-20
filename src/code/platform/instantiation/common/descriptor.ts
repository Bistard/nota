import { Constructor } from "src/base/common/util/type";

export class ServiceDescriptor<T> {
    public readonly ctor: any;
	public readonly arguments: any[];
    public readonly supportsDelayedInstantiation: boolean;
    
	constructor(
        ctor: Constructor<T>, 
        args: any[] = [], 
        supportsDelayedInstantiation: boolean = false
    ) {
        this.ctor = ctor;
		this.arguments = args;
        this.supportsDelayedInstantiation = supportsDelayedInstantiation;
    }
}
