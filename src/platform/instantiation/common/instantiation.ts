import { Constructor } from "src/base/common/util/type";
import { createService, ServiceIdentifier, IService, getServiceDependencies } from "src/platform/instantiation/common/decorator";
import { Graph, Node } from "src/platform/instantiation/common/dependencyGraph";
import { ServiceDescriptor } from "src/platform/instantiation/common/descriptor";
import { IdleValue } from "src/platform/instantiation/common/idle";
import { ServiceCollection } from "src/platform/instantiation/common/serviceCollection";

export const IInstantiationService = createService<IInstantiationService>('instantiation-service');

export interface IServiceProvider {
    /**
     * @description try to get the instance of the service (if not, this will 
     * not automatically create one for you YET).
     * @param serviceIdentifier serviceIdentifier to that service.
     * 
     * @throws An exception throws if the service cannot be found.
     */
    getService<T extends IService>(serviceIdentifier: ServiceIdentifier<T>): T;

    /**
     * @description Get or create a service instance.
     * @param serviceIdentifier The {@link ServiceIdentifier}.
     */
    getOrCreateService<T extends IService>(serviceIdentifier: ServiceIdentifier<T>): T;
}

/**
 * Given a list of arguments as a tuple, attempt to extract the leading, 
 * non-service arguments to their own tuple.
 */
export type NonServiceArguments<TArgs extends any[]> =
    TArgs extends []
        ? []
        : TArgs extends [...infer TFirst, IService]
            ? NonServiceArguments<TFirst>
            : TArgs;

/**
 * An interface only for {@link InstantiationService}.
 */
export interface IInstantiationService extends IServiceProvider, IService {

    readonly serviceCollections: ServiceCollection;

    /**
     * @description Register a service either using an instance or the 
     * ServiceDescriptor for delaying instantiation.
     * @param serviceIdentifier decorator to the service which is created by `createService()`.
     * @param instanceOrDescriptor instance or ServiceDescriptor of the service.
     */
    register<T extends IService, TCtor extends Constructor>(serviceIdentifier: ServiceIdentifier<T>, instanceOrDescriptor: T | ServiceDescriptor<TCtor>): void;

    /**
     * @description Passing into a constructor or a ServiceDescriptor<any> to 
     * create an instance.
     * @param ctorOrDescriptor constructor or ServiceDescriptor of the service.
     * @param rest all the arguments for that service.
     */
    createInstance<TCtor extends Constructor>(ctorOrDescriptor: TCtor | ServiceDescriptor<TCtor>, ...rest: NonServiceArguments<ConstructorParameters<TCtor>>): InstanceType<TCtor>;

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
    createChild(collection?: ServiceCollection): IInstantiationService;

    /**
     * @description Invokes a callback function with a {@link IServiceProvider}
     * which will get or create a service.
     * @param callback The callback function.
     * @param args The arguments for creating the requesting service.
     */
    getOrCreateService1<T extends IService, R extends any[]>(callback: (provider: IServiceProvider, ...args: R) => T, ...args: R): T;
}

export class InstantiationService implements IInstantiationService {

    _serviceMarker: undefined;

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

    public register<T extends IService, TCtor extends Constructor>(serviceIdentifier: ServiceIdentifier<T>, instanceOrDescriptor: T | ServiceDescriptor<TCtor>): void {
        this.serviceCollections.set(serviceIdentifier, instanceOrDescriptor);
    }

    public getService<T extends IService>(serviceIdentifier: ServiceIdentifier<T>): T {
        let service = this.serviceCollections.get(serviceIdentifier);

        if (!service && this.parent) {
            service = this.parent.__getServiceInstanceOrDescriptor(serviceIdentifier);
        }

        if (service === undefined || service instanceof ServiceDescriptor) {
            throw new Error(`cannot get service with identifier ${serviceIdentifier}`);
        }
        return service;
    }

    public getOrCreateService<T extends IService>(serviceIdentifier: ServiceIdentifier<T>): T {
        const service = this.__getOrCreateDependencyInstance(serviceIdentifier);
        if (!service) {
            throw new Error(`[getOrCreateService] UNKNOWN service ${serviceIdentifier.name}.`);
        }
        return service;
    }

    public getOrCreateService1<T extends IService, R extends any[]>(callback: (provider: IServiceProvider, ...args: R) => T, ...args: R): T {
        const provider: IServiceProvider = {
            getService: <T extends IService>(serviceIdentifier: ServiceIdentifier<T>) => {
                const service = this.serviceCollections.get(serviceIdentifier);
                if (!service || service instanceof ServiceDescriptor) {
                    throw new Error(`[getOrCreateService] UNKNOWN service ${serviceIdentifier.name}.`);
                }
                return service;
            },
            getOrCreateService: <T extends IService>(serviceIdentifier: ServiceIdentifier<T>) => {
                const service = this.__getOrCreateDependencyInstance(serviceIdentifier);
                if (!service) {
                    throw new Error(`[getOrCreateService] UNKNOWN service ${serviceIdentifier.name}.`);
                }
                return service;
            }
        };

        return callback(provider, ...args);
    }

    public createInstance<TCtor extends Constructor>(ctorOrDescriptor: TCtor | ServiceDescriptor<TCtor>, ...rest: NonServiceArguments<ConstructorParameters<TCtor>>): InstanceType<TCtor> {
        let res: InstanceType<TCtor>;

        if (ctorOrDescriptor instanceof ServiceDescriptor) {
            const args = <NonServiceArguments<ConstructorParameters<TCtor>>>ctorOrDescriptor.args.concat(rest);
            res = this.__createInstance(ctorOrDescriptor.ctor, args);
        } else {
            res = this.__createInstance(ctorOrDescriptor, rest);
        }
        
        return res;
    }

    public createChild(collection?: ServiceCollection): IInstantiationService {
        return new InstantiationService(collection, this);
    }

    // [private helper methods]

    private __createInstance<TCtor extends Constructor>(ctor: TCtor, args: NonServiceArguments<ConstructorParameters<TCtor>>): InstanceType<TCtor> {
        const serviceDependencies = getServiceDependencies(ctor).sort((a, b) => a.index - b.index);
        const servicesArgs: unknown[] = [];
        
        for (const dependency of serviceDependencies) {
            const service = this.__getOrCreateDependencyInstance(dependency.id);
            if (!service && !dependency.optional) {
                throw new Error(`[createInstance] ${ctor.name} depends on UNKNOWN service ${dependency.id}.`);
            }
            servicesArgs.push(service);
        }

        // ...

        return new ctor(...[...args, ...servicesArgs]);
    }

    private __getOrCreateDependencyInstance<T extends IService>(id: ServiceIdentifier<T>): T {
        const instanceOrDesc = this.__getServiceInstanceOrDescriptor(id);
        if (instanceOrDesc instanceof ServiceDescriptor) {
            return this.__safeCreateAndCacheServiceInstance(id, instanceOrDesc);
        } else {
            return instanceOrDesc;
        }
    }

    private __safeCreateAndCacheServiceInstance<T extends IService, TCtor extends Constructor>(id: ServiceIdentifier<T>, desc: ServiceDescriptor<TCtor>): T {
        if (this._activeInstantiations.has(id)) {
            throw new Error(`DI illegal operation: recursively instantiating service '${id}'`);
        }
        this._activeInstantiations.add(id);

        try {
            return this.__createAndCacheServiceInstance(id, desc);
        } finally {
            this._activeInstantiations.delete(id);
        }
    }

    private __createAndCacheServiceInstance<T extends IService, TCtor extends Constructor>(id: ServiceIdentifier<T>, desc: ServiceDescriptor<TCtor>): T {
        type dependencyNode = {
            id: ServiceIdentifier<T>,
            desc: ServiceDescriptor<TCtor>,
        };

        const dependencyGraph = new Graph<dependencyNode>((data) => data.id.toString());

        // use DFS 
        const stack = [{ id, desc }];
        while (stack.length) {
            const currDependency: dependencyNode = stack.pop()!;
            dependencyGraph.getOrInsertNode(currDependency);

            const dependencies = getServiceDependencies(currDependency.desc.ctor);
            for (const subDependency of dependencies) {

                const instanceOrDesc = this.__getServiceInstanceOrDescriptor(subDependency.id);

                if (instanceOrDesc instanceof ServiceDescriptor) {
                    const uninstantiatedDependency = { id: subDependency.id, desc: instanceOrDesc };
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
                const instanceOrDesc = this.__getServiceInstanceOrDescriptor(data.id);
                if (instanceOrDesc instanceof ServiceDescriptor) {
                    // create instance and overwrite the service collections
                    const instance = this.__createServiceInstanceWithOwner(
                        data.id,
                        data.desc.ctor,
                        data.desc.args,
                        data.desc.supportsDelayedInstantiation
                    );
                    this.__setServiceInstance(data.id, instance);
                }

                dependencyGraph.removeNode(data);
            }
        }

        return <T>this.__getServiceInstanceOrDescriptor(id);
    }

    private __setServiceInstance<T extends IService>(id: ServiceIdentifier<T>, instance: T): void {
        if (this.serviceCollections.get(id) instanceof ServiceDescriptor) {
            this.serviceCollections.set(id, instance);
        }

        // try to set the service into the parent DI
        else if (this.parent) {
            this.parent.__setServiceInstance(id, instance);
        }

        else {
            throw new Error('DI illegal operation: setting duplicate service instance');
        }
    }

    private __getServiceInstanceOrDescriptor<T extends IService, TCtor extends Constructor>(id: ServiceIdentifier<T>): T | ServiceDescriptor<TCtor> {
        const instanceOrDesc = this.serviceCollections.get<T, TCtor>(id);

        // if the current service does not have it, we try to get it from the parent
        if (!instanceOrDesc && this.parent) {
            return this.parent.__getServiceInstanceOrDescriptor(id);
        }

        return instanceOrDesc;
    }

    private __createServiceInstanceWithOwner<T extends IService, TCtor extends Constructor>(
        id: ServiceIdentifier<T>,
        ctor: TCtor,
        args: NonServiceArguments<ConstructorParameters<TCtor>>,
        supportsDelayedInstantiation: boolean,
    ): T {
        if (this.serviceCollections.get(id) instanceof ServiceDescriptor) {
            return this.___createServiceInstance(ctor, args, supportsDelayedInstantiation);
        }

        else if (this.parent) {
            return this.parent.__createServiceInstanceWithOwner(id, ctor, args, supportsDelayedInstantiation);
        }

        else {
            throw new Error(`creating UNKNOWN service instance ${ctor.name}`);
        }
    }

    private ___createServiceInstance<T extends IService, TCtor extends Constructor>(
        ctor: TCtor, 
        args: NonServiceArguments<ConstructorParameters<TCtor>>, 
        supportsDelayedInstantiation: boolean,
    ): T {
        if (!supportsDelayedInstantiation) {
            return this.__createInstance(ctor, args);
        } 
        else {
            // Return a proxy object that's backed by an idle value. That
            // strategy is to instantiate services in our idle time or when actually
            // needed but not when injected into a consumer
            const idle = new IdleValue(() => this.__createInstance(ctor, args));
            return new Proxy(Object.create(null), {
                get(target: any, key: PropertyKey): any {
                    if (key in target) {
                        return target[key];
                    }
                    const obj = idle.getValue();
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