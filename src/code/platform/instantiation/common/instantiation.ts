import { Constructor } from "src/base/common/util/type";
import { createService, ServiceIdentifier, _ServiceUtil, IMicroService } from "src/code/platform/instantiation/common/decorator";
import { Graph, Node } from "src/code/platform/instantiation/common/dependencyGraph";
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { IdleValue } from "src/code/platform/instantiation/common/idle";
import { ServiceCollection } from "src/code/platform/instantiation/common/serviceCollection";

export const IInstantiationService = createService<IInstantiationService>('instantiation-service');

export interface IServiceProvider {
    /**
     * @description try to get the instance of the service (if not, this will 
     * not automatically create one for you YET).
     * @param serviceIdentifier serviceIdentifier to that service.
     * 
     * @throws An exception throws if the service cannot be found.
     */
    getService<T>(serviceIdentifier: ServiceIdentifier<T>): T;

    /**
     * @description Get or create a service instance.
     * @param serviceIdentifier The {@link ServiceIdentifier}.
     */
    getOrCreateService<T>(serviceIdentifier: ServiceIdentifier<T>): T;
}

/**
 * Given a list of arguments as a tuple, attempt to extract the leading, 
 * non-service arguments to their own tuple.
 */
type NonServiceArguments<TArgs extends any[]> =
    TArgs extends [] 
        ? [] 
        : TArgs extends [...infer TFirst, IMicroService] 
            ? NonServiceArguments<TFirst>
            : TArgs;

/**
 * An interface only for {@link InstantiationService}.
 */
export interface IInstantiationService extends IServiceProvider, IMicroService {
    
    readonly serviceCollections: ServiceCollection;

    /**
     * @description Register a service either using an instance or the 
     * ServiceDescriptor for delaying instantiation.
     * @param serviceIdentifier decorator to the service which is created by `createService()`.
     * @param instanceOrDescriptor instance or ServiceDescriptor of the service.
     */
    register<T>(serviceIdentifier: ServiceIdentifier<T>, instanceOrDescriptor: T | ServiceDescriptor<T>): void;

    /**
     * @description Passing into a constructor or a ServiceDescriptor<any> to 
     * create an instance.
     * @param ctorOrDescriptor constructor or ServiceDescriptor of the service.
     * @param rest all the arguments for that service.
     */
    createInstance<Ctor extends Constructor<any>, T extends InstanceType<Ctor>>(ctorOrDescriptor: Ctor | ServiceDescriptor<Ctor>, ...rest: NonServiceArguments<ConstructorParameters<Ctor>>): T;

    /**
     * @description Create a new instantiation service that inherits all the 
     * current services.
     * @param collection A list of services for initialization.
     * 
     * @note If the current instantiation service cannot find a service, it will 
     * go ask the parent instantiation service if the expecting service exist.
     * @note The child instantiation service also has ability to overwrite the 
     * existing services in the parent instantiation service without actual 
     * replacing the services in the parent.
     */
    createChild(collection: ServiceCollection): IInstantiationService;

    /**
     * @description Invokes a callback function with a {@link IServiceProvider}
     * which will get or create a service.
     * @param callback The callback function.
     * @param args The arguments for creating the requesting service.
     */
    getOrCreateService1<T, R extends any[]>(callback: (provider: IServiceProvider, ...args: R) => T, ...args: R): T;
}

export class InstantiationService implements IInstantiationService {

    _microserviceIdentifier: undefined;
    
    // [fields]

    public readonly serviceCollections: ServiceCollection;
    public readonly parent?: InstantiationService;

    private readonly _activeInstantiations = new Set<ServiceIdentifier<any>>();

    // [constructor]

    constructor(serviceCollections: ServiceCollection = new ServiceCollection(), parent?: InstantiationService) {
        this.serviceCollections = serviceCollections;
        this.parent = parent;
    }

    // [public methods]

    public register<T>(
        serviceIdentifier: ServiceIdentifier<T>, 
        instanceOrDescriptor: T | ServiceDescriptor<T>): void 
    {
        this.serviceCollections.set(serviceIdentifier, instanceOrDescriptor);
    }

    public getService<T>(serviceIdentifier: ServiceIdentifier<T>): T {
        let service = this.serviceCollections.get(serviceIdentifier);
        
        if (!service && this.parent) {
            service = this.parent._getServiceInstanceOrDescriptor(serviceIdentifier);
        }
        
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

    public getOrCreateService1<T, R extends any[]>(callback: (provider: IServiceProvider, ...args: R) => T, ...args: R): T {
        const provider: IServiceProvider = {
            getService: <T>(serviceIdentifier: ServiceIdentifier<T>) => {
                const service = this.serviceCollections.get(serviceIdentifier);
                if (!service || service instanceof ServiceDescriptor) {
                    throw new Error(`[getOrCreateService] UNKNOWN service ${serviceIdentifier.name}.`);
                }
                return service;
            },
            getOrCreateService: <T>(serviceIdentifier: ServiceIdentifier<T>) => {
                const service = this._getOrCreateDependencyInstance(serviceIdentifier);
                if (!service) {
                    throw new Error(`[getOrCreateService] UNKNOWN service ${serviceIdentifier.name}.`);
                }
                return service;
            }
        };

        return callback(provider, ...args);
    }

    public createInstance<Ctor extends Constructor<any>, T extends InstanceType<Ctor>>(ctorOrDescriptor: Ctor | ServiceDescriptor<Ctor>, ...rest: NonServiceArguments<ConstructorParameters<Ctor>>): T;
    public createInstance(ctorOrDescriptor: any | ServiceDescriptor<any>, ...rest: any[]): any {
        let res: any;
        if (ctorOrDescriptor instanceof ServiceDescriptor) {
            res = this._createInstance(ctorOrDescriptor.ctor, ctorOrDescriptor.arguments.concat(rest));
        } else {
            res = this._createInstance(ctorOrDescriptor, rest);
        }
        return res;
    }

    public createChild(collection: ServiceCollection): IInstantiationService {
        return new InstantiationService(collection, this);
    }

    // [private helper methods]

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
        let instanceOrDesc = this._getServiceInstanceOrDescriptor(id);
        if (instanceOrDesc instanceof ServiceDescriptor) {
            return this._safeCreateAndCacheServiceInstance(id, instanceOrDesc);
        } else {
            return instanceOrDesc;
        }
    }

    private _safeCreateAndCacheServiceInstance<T>(
        id: ServiceIdentifier<T>, 
        desc: ServiceDescriptor<T>): T 
    {
        if (this._activeInstantiations.has(id)) {
            throw new Error(`DI illegal operation: recursively instantiating service '${id}'`);
        }
        this._activeInstantiations.add(id);
        
        try {
            return this._createAndCacheServiceInstance(id, desc);
        } finally {
            this._activeInstantiations.delete(id);
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
                
                const instanceOrDesc = this._getServiceInstanceOrDescriptor(subDependency.id);
                
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
				
                /**
                 * When constructing a dependency through the DI, it might has 
                 * side effect that also constructs other dependencies that the
                 * current service is depending on. Thus we need to check if
                 * the current dependency is an instance or not to avoid 
                 * duplicate construction.
                 */
                const instanceOrDesc = this._getServiceInstanceOrDescriptor(data.id);
                if (instanceOrDesc instanceof ServiceDescriptor) {
                    // create instance and overwrite the service collections
                    const instance = this._createServiceInstanceWithOwner(
                        data.id, 
                        data.desc.ctor, 
                        data.desc.arguments, 
                        data.desc.supportsDelayedInstantiation
                    );
                    this._setServiceInstance(data.id, instance);
                }

				dependencyGraph.removeNode(data);
			}
        }

        return <T>this._getServiceInstanceOrDescriptor(id);
    }

    private _getServiceInstanceOrDescriptor<T>(id: ServiceIdentifier<T>): T | ServiceDescriptor<T> {
        const instanceOrDesc = this.serviceCollections.get(id);
        
        // if the current service does not have it, we try to get it from the parent
        if (!instanceOrDesc && this.parent) {
            return this.parent._getServiceInstanceOrDescriptor(id);
        }

        return instanceOrDesc;
    }

    private _setServiceInstance<T>(
        id: ServiceIdentifier<T>, 
        instance: T): void 
    {
		if (this.serviceCollections.get(id) instanceof ServiceDescriptor) {
			this.serviceCollections.set(id, instance);
		} 
        
        // try to set the service into the parent DI
        else if (this.parent) {
            this.parent._setServiceInstance(id, instance);
        }

        else {
			throw new Error('DI illegal operation: setting duplicate service instance');
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
		} 
        
        else if (this.parent) {
            return this.parent._createServiceInstanceWithOwner(id, ctor, args, supportsDelayedInstantiation);
        }
        
        else {
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