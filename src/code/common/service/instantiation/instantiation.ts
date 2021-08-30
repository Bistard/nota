import { ServiceIdentifier, _ServiceUtil } from "src/code/common/service/instantiation/decorator";
import { ServiceDescriptor } from "src/code/common/service/instantiation/descriptor";
import { ServiceCollection } from "src/code/common/service/instantiation/serviceCollection";

export class InstantiationService {

    private readonly _serviceCollections: ServiceCollection;

    constructor(serviceCollections: ServiceCollection = new ServiceCollection()) {
        this._serviceCollections = serviceCollections;
    }

    /**
     * @description passing into a constructor or ServiceDescriptor<any> to 
     * create an instance.
     */
    public createInstance(ctorOrDescriptor: any | ServiceDescriptor<any>, ...rest: any[]): any {
        let res: any;
        if (ctorOrDescriptor instanceof ServiceDescriptor) {
            res = this._createInstance(ctorOrDescriptor.ctor, ctorOrDescriptor.arguments.concat(rest));
        } else {
            res = this._createInstance(ctorOrDescriptor, rest);
        }
        return res;
    }

    private _createInstance<T>(ctor: any, args: any[] = []): T {
        let serviceDependencies = _ServiceUtil.getServiceDependencies(ctor).sort((a, b) => a.index  - b.index);
        let servicesArgs: any[] = [];
        for (const dependency of serviceDependencies) {
            let service = this._getOrCreateDependencyInstance(dependency.id);
            if (!service && !dependency.optional) {
				throw new Error(`[createInstance] ${ctor.name} depends on UNKNOWN service ${dependency.id}.`);
			}
            servicesArgs.push(service);
        }

        // ...

        return <T>new ctor(...[...args, ...servicesArgs]);
    }

    private _getOrCreateDependencyInstance<T>(id: ServiceIdentifier<T>): T {
        let instanceOrDesc = this._serviceCollections.get(id);
        if (instanceOrDesc instanceof ServiceDescriptor) {
            return this._createAndCacheServiceInstance(id, instanceOrDesc)!;
        } else {
            return instanceOrDesc;
        }
    }

    // TODO
    private _createAndCacheServiceInstance<T>(id: ServiceIdentifier<T>, desc: ServiceDescriptor<T>): T | null {
        return null;
    }

}