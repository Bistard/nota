import { ServiceDescriptor } from "src/code/common/service//instantiation/descriptor";
import { ServiceIdentifier } from "src/code/common/service/instantiation/decorator";

export class ServiceCollection {

	// stores either T | ServiceDescriptor<T>
    private _services: Map<ServiceIdentifier<any>, any> = new Map();

    constructor(...services: [ServiceIdentifier<any>, any][]) {
        for (let [id, service] of services) {
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

/**
 * @internal
 */
const _singletonDependencies: [ServiceIdentifier<any>, ServiceDescriptor<any>][] = [];

export function registerSingleton<T, Services>(id: ServiceIdentifier<T>, ctor: new (...services: Services[]) => T, supportsDelayedInstantiation?: boolean): void;
export function registerSingleton<T, Services>(id: ServiceIdentifier<T>, descriptor: ServiceDescriptor<any>): void;
export function registerSingleton<T, Services>(id: ServiceIdentifier<T>, ctorOrDescriptor: { new(...services: Services[]): T } | ServiceDescriptor<any>, supportsDelayedInstantiation?: boolean): void {
	if (!(ctorOrDescriptor instanceof ServiceDescriptor)) {
		ctorOrDescriptor = new ServiceDescriptor<T>(ctorOrDescriptor as new (...args: any[]) => T, [], supportsDelayedInstantiation);
	}
	_singletonDependencies.push([id, ctorOrDescriptor]);
}

export function getSingletonServiceDescriptors(): [ServiceIdentifier<any>, ServiceDescriptor<any>][] {
	return _singletonDependencies;
}
