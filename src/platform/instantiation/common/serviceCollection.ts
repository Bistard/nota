import { ServiceDescriptor } from "src/platform/instantiation/common/descriptor";
import { IService, ServiceIdentifier } from "src/platform/instantiation/common/decorator";
import { Constructor } from "src/base/common/util/type";
import { NonServiceArguments } from "src/platform/instantiation/common/instantiation";

export class ServiceCollection {

	// stores either T | ServiceDescriptor<T>
	private readonly _services: Map<ServiceIdentifier<any>, any | ServiceDescriptor<any>>;

	constructor(...services: [ServiceIdentifier<any>, any][]) {
		this._services = new Map();
		for (const [id, service] of services) {
			this.set(id, service);
		}
	}

	public set<T extends IService, TCtor extends Constructor>(id: ServiceIdentifier<T>, instanceOrDescriptor: T | ServiceDescriptor<TCtor>): T | ServiceDescriptor<TCtor> | undefined {
		const result = this._services.get(id);
		this._services.set(id, instanceOrDescriptor);
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

export function registerSingleton<T extends IService, TCtor extends Constructor>(id: ServiceIdentifier<T>, descriptor: ServiceDescriptor<any>): void;
export function registerSingleton<T extends IService, TCtor extends Constructor>(id: ServiceIdentifier<T>, ctor: TCtor,                                        args: NonServiceArguments<ConstructorParameters<TCtor>>,  supportsDelayedInstantiation?: boolean): void;
export function registerSingleton<T extends IService, TCtor extends Constructor>(id: ServiceIdentifier<T>, ctorOrDescriptor: TCtor | ServiceDescriptor<TCtor>, args?: NonServiceArguments<ConstructorParameters<TCtor>>, supportsDelayedInstantiation?: boolean): void {
	if (!(ctorOrDescriptor instanceof ServiceDescriptor)) {
		if (!args) {
			throw new Error('Arguments parameter must be provided when a constructor is registered.');
		}
		ctorOrDescriptor = new ServiceDescriptor(ctorOrDescriptor, args, supportsDelayedInstantiation);
	}

	const registered = _singletonDependencies.get(id);
	if (!registered) {
		_singletonDependencies.set(id, ctorOrDescriptor);
	} else {
		console.warn(`duplicate registerSingelton is called with id: ${id}`);
	}
}

export function getSingletonServiceDescriptors(): Map<ServiceIdentifier<any>, ServiceDescriptor<any>> {
	return _singletonDependencies;
}