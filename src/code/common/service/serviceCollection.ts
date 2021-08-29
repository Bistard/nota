import { ServiceDescriptor } from "src/code/common/service/descriptor";
import { ServiceIdentifier } from "src/code/common/service/decorator";

export class ServiceCollection {

    private _services: Map<ServiceIdentifier<any>, any> = new Map();

    constructor(...services: [ServiceIdentifier<any>, any][]) {
        for (let [id, service] of services) {
            this.set(id, service);
        }
    }

    set<T>(id: ServiceIdentifier<T>, instanceOrDescriptor: T | ServiceDescriptor<T>): T | ServiceDescriptor<T> {
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