import { createDecorator, ServiceIdentifier, _ServiceUtil } from "src/code/common/service/instantiationService/decorator";
import { Graph, Node } from "src/code/common/service/instantiationService/dependencyGraph";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IdleValue } from "src/code/common/service/instantiationService/idle";
import { ServiceCollection } from "src/code/common/service/instantiationService/serviceCollection";

export const IInstantiationService = createDecorator<IInstantiationService>('instantiation-service');

export interface IServiceProvider {
    /**
     * @description try to get the instance of the service (if not, this will 
     * not automatically create one for you YET).
     * @param serviceIdentifier serviceIdentifier to that service.
     * 
     * @throws An exception throws if the service cannot be found.
     */
    getService<T>(serviceIdentifier: ServiceIdentifier<T>): T;
}

export interface IInstantiationService extends IServiceProvider {
    
    readonly serviceCollections: ServiceCollection;

    /**
     * @description register a service either using an instance or the 
     * ServiceDescriptor for delaying instantiation.
     * 
     * @param serviceIdentifier decorator to the service which is created by createDecorator()
     * @param instanceOrDescriptor instance or ServiceDescriptor of the service
     */
    register<T>(serviceIdentifier: ServiceIdentifier<T>, instanceOrDescriptor: T | ServiceDescriptor<T>): void;

    /**
     * @description passing into a constructor or a ServiceDescriptor<any> to 
     * create an instance.
     * 
     * @param ctorOrDescriptor constructor or ServiceDescriptor of the service
     * @param rest all the arguments for that service
     */
    createInstance<Ctor extends new (...args: any[]) => any, T extends InstanceType<Ctor>>(ctorOrDescriptor: Ctor | ServiceDescriptor<Ctor>, ...rest: any[]): T;

    /**
     * @description Get or create a service instance.
     * @param serviceIdentifier The {@link ServiceIdentifier}.
     */
    getOrCreateService<T>(serviceIdentifier: ServiceIdentifier<T>): T;

    /**
     * @description Invokes a callback function with a {@link IServiceProvider}
     * which will get or create a service.
     * @param cb The callback function.
     * @param args The arguments for creating the requesting service.
     */
    getOrCreateService1<T, R extends any[]>(cb: (provider: IServiceProvider, ...args: R) => T, ...args: R): T;
}

export class InstantiationService implements IInstantiationService {

    public readonly serviceCollections: ServiceCollection;

    constructor(serviceCollections: ServiceCollection = new ServiceCollection()) {
        this.serviceCollections = serviceCollections;
    }

    public register<T>(
        serviceIdentifier: ServiceIdentifier<T>, 
        instanceOrDescriptor: T | ServiceDescriptor<T>): void 
    {
        this.serviceCollections.set(serviceIdentifier, instanceOrDescriptor);
    }

    public getService<T>(serviceIdentifier: ServiceIdentifier<T>): T {
        const service = this.serviceCollections.get(serviceIdentifier);
        if (service === undefined || service instanceof ServiceDescriptor) {
            throw new Error(`cannot get service with identifier ${serviceIdentifier}`);
        }
        return service;
    }

    public getOrCreateService<T>(serviceIdentifier: ServiceIdentifier<T>): T {
        const service = this._getOrCreateDependencyInstance(serviceIdentifier);
        if (!service) {
            throw new Error(`[getOrCreateService] UNKNOWN service ${serviceIdentifier.name}.`);
        }
        return service;
    }

    public getOrCreateService1<T, R extends any[]>(cb: (provider: IServiceProvider, ...args: R) => T, ...args: R): T {
        const provider: IServiceProvider = {
            getService: <T>(serviceIdentifier: ServiceIdentifier<T>) => {
                const service = this._getOrCreateDependencyInstance(serviceIdentifier);
                if (!service) {
                    throw new Error(`[getOrCreateService] UNKNOWN service ${serviceIdentifier.name}.`);
                }
                return service;
            }
        };

        return cb(provider, ...args);
    }

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
            let service: any = this._getOrCreateDependencyInstance(dependency.id);
            if (!service && !dependency.optional) {
				throw new Error(`[createInstance] ${ctor.name} depends on UNKNOWN service ${dependency.id}.`);
			}
            servicesArgs.push(service);
        }

        // ...

        return <T>new ctor(...[...args, ...servicesArgs]);
    }

    private _getOrCreateDependencyInstance<T>(id: ServiceIdentifier<T>): T {
        let instanceOrDesc = this.serviceCollections.get(id);
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

            const dependencies = _ServiceUtil.getServiceDependencies(currDependency.desc.ctor);
            for (const subDependency of dependencies) {
                
                const instanceOrDesc = this.serviceCollections.get(subDependency.id);
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

        return <T>this.serviceCollections.get(id);
    }

    private _setServiceInstance<T>(
        id: ServiceIdentifier<T>, 
        instance: T): void 
    {
		if (this.serviceCollections.get(id) instanceof ServiceDescriptor) {
			this.serviceCollections.set(id, instance);
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
		if (this.serviceCollections.get(id) instanceof ServiceDescriptor) {
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

export class InstantiationError<T> extends Error {
    constructor(service: string, serviceIdentifier: ServiceIdentifier<T>) {
        super(`${service}: No instance of the provided service ${serviceIdentifier.type} has been registered`);
    }
}