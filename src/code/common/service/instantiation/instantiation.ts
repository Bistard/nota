import { ServiceIdentifier, _ServiceUtil } from "src/code/common/service/instantiation/decorator";
import { Graph, Node } from "src/code/common/service/instantiation/dependencyGraph";
import { ServiceDescriptor } from "src/code/common/service/instantiation/descriptor";
import { IdleValue } from "src/code/common/service/instantiation/idle";
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
    public createInstance(
        ctorOrDescriptor: any | ServiceDescriptor<any>, 
        ...rest: any[]): any 
    {
        let res: any;
        if (ctorOrDescriptor instanceof ServiceDescriptor) {
            res = this._createInstance(ctorOrDescriptor.ctor, ctorOrDescriptor.arguments.concat(rest));
        } else {
            res = this._createInstance(ctorOrDescriptor, rest);
        }
        return res;
    }

    private _createInstance<T>(
        ctor: any, 
        args: any[] = []): T 
    {
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

    private _createAndCacheServiceInstance<T>(
        id: ServiceIdentifier<T>, 
        desc: ServiceDescriptor<T>): T 
    {
        type dependencyNode = {
            id: ServiceIdentifier<T>, 
            desc: ServiceDescriptor<T>,
        };
        const dependencyGraph = new Graph<dependencyNode>( (data) => data.id.toString() );

        // use DFS 
        const stack = [ {id, desc} ];
        while(stack.length) {
            const currDependency: dependencyNode = stack.pop()!;
            dependencyGraph.getOrInsertNode(currDependency);

            const dependencies = _ServiceUtil.getServiceDependencies(currDependency.id);
            for (const subDependency of dependencies) {
                
                const instanceOrDesc = this._serviceCollections.get(subDependency.id);
                if (instanceOrDesc instanceof ServiceDescriptor) {
                    const uninstantiatedDependency = {id: subDependency.id, desc: instanceOrDesc};
                    dependencyGraph.insertEdge(currDependency, uninstantiatedDependency);
                    stack.push(uninstantiatedDependency);
                }

            }
        }

        while (true) {
            const roots: Node<dependencyNode>[] = dependencyGraph.roots();

            if (roots.length === 0) {
                if (!dependencyGraph.isEmpty()) {
                    throw Error('dependency cycle happens');
                }
                break;
            }

            for (const { data } of roots) {
				// create instance and overwrite the service collections
				const instance = this._createServiceInstanceWithOwner(
                    data.id, 
                    data.desc.ctor, 
                    data.desc.arguments, 
                    data.desc.supportsDelayedInstantiation
                );
				this._setServiceInstance(data.id, instance);
				dependencyGraph.removeNode(data);
			}
        }

        console.log(dependencyGraph.toString());

        return <T>this._serviceCollections.get(id);
    }

    private _setServiceInstance<T>(
        id: ServiceIdentifier<T>, 
        instance: T): void 
    {
		if (this._serviceCollections.get(id) instanceof ServiceDescriptor) {
			this._serviceCollections.set(id, instance);
		} else {
			throw new Error('duplicate setting service instance');
		}
	}

    private _createServiceInstanceWithOwner<T>(
        id: ServiceIdentifier<T>, 
        ctor: any, 
        args: any[] = [], 
        supportsDelayedInstantiation: boolean): T 
    {
		if (this._serviceCollections.get(id) instanceof ServiceDescriptor) {
			return this._createServiceInstance(ctor, args, supportsDelayedInstantiation);
		} else {
			throw new Error(`creating UNKNOWN service instance ${ctor.name}`);
		}
	}

    private _createServiceInstance<T>(ctor: any, args: any[] = [], _supportsDelayedInstantiation: boolean): T {
		if (!_supportsDelayedInstantiation) {
			return this._createInstance(ctor, args);

		} else {
			// Return a proxy object that's backed by an idle value. That
			// strategy is to instantiate services in our idle time or when actually
			// needed but not when injected into a consumer
			const idle = new IdleValue<any>(() => this._createInstance<T>(ctor, args));
			return <T>new Proxy(Object.create(null), {
				get(target: any, key: PropertyKey): any {
					if (key in target) {
						return target[key];
					}
					let obj = idle.getValue();
					let prop = obj[key];
					if (typeof prop !== 'function') {
						return prop;
					}
					prop = prop.bind(obj);
					target[key] = prop;
					return prop;
				},
				set(_target: T, p: PropertyKey, value: any): boolean {
					idle.getValue()[p] = value;
					return true;
				}
			});
		}
	}
}