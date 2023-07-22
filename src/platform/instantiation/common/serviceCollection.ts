import { ServiceDescriptor } from "src/platform/instantiation/common/descriptor";
import { ServiceIdentifier } from "src/platform/instantiation/common/decorator";

export class ServiceCollection {

	// stores either T | ServiceDescriptor<T>
	private readonly _services: Map<ServiceIdentifier<any>, any> = new Map();

	constructor(...services: [ServiceIdentifier<any>, any][]) {
		for (const [id, service] of services) {
			this.set(id, service);
		}
	}

	set<T>(id: ServiceIdentifier<T>, instanceOrDescriptor: T | ServiceDescriptor<T>): T | ServiceDescriptor<T> | undefined {
		const result = this._services.get(id);
		this._services.set(id, instanceOrDescriptor);
		return result;
	}

	has(id: ServiceIdentifier<any>): boolean {
		return this._services.has(id);
	}

	get<T>(id: ServiceIdentifier<T>): T | ServiceDescriptor<T> {
		return this._services.get(id);
	}

}

/*******************************************************************************
 *                       singleton dependency injection
 ******************************************************************************/

const _singletonDependencies = new Map<ServiceIdentifier<any>, ServiceDescriptor<any>>();

export function registerSingleton<T, Services>(id: ServiceIdentifier<T>, ctor: new (...services: Services[]) => T, supportsDelayedInstantiation?: boolean): void;
export function registerSingleton<T, Services>(id: ServiceIdentifier<T>, descriptor: ServiceDescriptor<any>): void;
export function registerSingleton<T, Services>(id: ServiceIdentifier<T>, ctorOrDescriptor: { new(...services: Services[]): T; } | ServiceDescriptor<any>, supportsDelayedInstantiation?: boolean): void {
	if (!(ctorOrDescriptor instanceof ServiceDescriptor)) {
		ctorOrDescriptor = new ServiceDescriptor<T>(ctorOrDescriptor as new (...args: any[]) => T, [], supportsDelayedInstantiation);
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
