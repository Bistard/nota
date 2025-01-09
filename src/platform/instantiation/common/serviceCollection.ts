import { ServiceDescriptor } from "src/platform/instantiation/common/descriptor";
import { IService, ServiceIdentifier } from "src/platform/instantiation/common/decorator";
import { Constructor } from "src/base/common/utilities/type";
import { InstantiationRequiredParameters } from "src/platform/instantiation/common/instantiation";
import { panic } from "src/base/common/utilities/panic";
import { Disposable, isDisposable } from "src/base/common/dispose";

export class ServiceCollection extends Disposable {

	// stores either T | ServiceDescriptor<T>
	private readonly _services: Map<ServiceIdentifier<any>, any | ServiceDescriptor<any>>;

	constructor(...services: [id: ServiceIdentifier<any>, serviceOrDescriptor: any][]) {
		super();
		this._services = new Map();
		for (const [id, service] of services) {
			this.set(id, service);
		}
	}

	public set<T extends IService, TCtor extends Constructor>(id: ServiceIdentifier<T>, instanceOrDescriptor: T | ServiceDescriptor<TCtor>): T | ServiceDescriptor<TCtor> | undefined {
		const result = this._services.get(id);
		this._services.set(id, instanceOrDescriptor);
		
		// bind lifecycle
		if (isDisposable(instanceOrDescriptor)) {
			this.__register(instanceOrDescriptor);
		}

		return result;
	}

	public has<T extends IService>(id: ServiceIdentifier<T>): boolean {
		return this._services.has(id);
	}

	public get<T extends IService, TCtor extends Constructor>(id: ServiceIdentifier<T>): T | ServiceDescriptor<TCtor> {
		return this._services.get(id);
	}
}

/*******************************************************************************
 *                       singleton dependency injection
 ******************************************************************************/

const _singletonDependencies = new Map<ServiceIdentifier<any>, ServiceDescriptor<any>>();

export function registerService<T extends IService, TCtor extends Constructor>(id: ServiceIdentifier<T>, descriptor: ServiceDescriptor<any>): void;
export function registerService<T extends IService, TCtor extends Constructor>(id: ServiceIdentifier<T>, ctor: TCtor,                                        args: InstantiationRequiredParameters<TCtor>,  supportsDelayedInstantiation?: boolean): void;
export function registerService<T extends IService, TCtor extends Constructor>(id: ServiceIdentifier<T>, ctorOrDescriptor: TCtor | ServiceDescriptor<TCtor>, args?: InstantiationRequiredParameters<TCtor>, supportsDelayedInstantiation?: boolean): void {
	if (!(ctorOrDescriptor instanceof ServiceDescriptor)) {
		if (!args) {
			panic(`[registerService] Arguments parameter must be provided when a service (${id}) is registered.`);
		}
		ctorOrDescriptor = new ServiceDescriptor(ctorOrDescriptor, args, supportsDelayedInstantiation);
	}

	const registered = _singletonDependencies.get(id);
	if (registered) {
		return;
	}

	_singletonDependencies.set(id, ctorOrDescriptor);
}

export function getSingletonServiceDescriptors(): Map<ServiceIdentifier<any>, ServiceDescriptor<any>> {
	return _singletonDependencies;
}