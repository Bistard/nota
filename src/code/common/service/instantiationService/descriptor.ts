
export class ServiceDescriptor<T> {
    public readonly ctor: any;
	public readonly arguments: any[];
    public readonly supportsDelayedInstantiation: boolean;
    
	constructor(
        ctor: new (...args: any[]) => T, 
        args: any[] = [], 
        supportsDelayedInstantiation: boolean = false
    ) {
        this.ctor = ctor;
		this.arguments = args;
        this.supportsDelayedInstantiation = supportsDelayedInstantiation;
    }
}
