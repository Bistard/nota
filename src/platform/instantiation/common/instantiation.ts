import { errorToMessage, panic } from "src/base/common/utilities/panic";
import { AbstractConstructor, Constructor } from "src/base/common/utilities/type";
import { createService, ServiceIdentifier, IService, getDependencyTreeFor } from "src/platform/instantiation/common/decorator";
import { Graph } from "src/platform/instantiation/common/dependencyGraph";
import { ServiceDescriptor } from "src/platform/instantiation/common/descriptor";
import { IdleValue } from "src/platform/instantiation/common/idle";
import { ServiceCollection } from "src/platform/instantiation/common/serviceCollection";

export const IInstantiationService = createService<IInstantiationService>('instantiation-service');

/**
 * {@link NonServiceParameters}
 * 
 * A utility type to extract non-service parameters from a given tuple. This 
 * recursively checks the tuple elements from right to left (because tuple types 
 * capture types in order) and excludes `IService` type elements from the 
 * resulting tuple.
 * 
 * @example
 * ```typescript
 * type Params = [string, number, IService, boolean, IService];
 * type Result = NonServiceParameters<Params>;  // Result will be [string, number, boolean]
 * ```
 */
export type NonServiceParameters<TArgs extends any[]> =
    TArgs extends []
        ? []
        : TArgs extends [...infer TFirst, IService]
            ? NonServiceParameters<TFirst>
            : TArgs;


/**
 * {@link InstantiationRequiredParameters}
 * 
 * A utility type to extract non-service constructor parameters from a given 
 * abstract constructor type.
 * 
 * @template T An abstract constructor whose parameter types are to be extracted.
 * 
 * @example
 * ```typescript
 * abstract class MyClass {
 *     constructor(arg1: string, arg2: IService, arg3: number) {}
 * }
 * type RequiredParams = InstantiationRequiredParameters<typeof MyClass>;  // RequiredParams will be [string, number]
 * ```
 */
export type InstantiationRequiredParameters<T extends AbstractConstructor> = NonServiceParameters<ConstructorParameters<T>>;


/**
 * The {@link IServiceProvider} is responsible for the management of services 
 * within an application. It provides mechanisms to fetch existing services or 
 * to ensure the creation and retrieval of services if they do not already exist. 
 * 
 * This design ensures that services are initialized and managed in a central 
 * location, promoting better architecture and easier debugging.
 */
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
 * An interface only for {@link InstantiationService}.
 */
export interface IInstantiationService extends IServiceProvider, IService {
    
    readonly serviceCollections: ServiceCollection;
    readonly parent?: InstantiationService;

    /**
     * @description Stores a service into DI system either using an instance or 
     * the ServiceDescriptor for delaying instantiation.
     * @param serviceIdentifier decorator to the service which is created by `createService()`.
     * @param instanceOrDescriptor instance or ServiceDescriptor of the service.
     */
    store<T extends IService, TCtor extends Constructor>(serviceIdentifier: ServiceIdentifier<T>, instanceOrDescriptor: T | ServiceDescriptor<TCtor>): void;

    /**
     * @description Creates an instance of the given class described by the 
     * given constructor.
     *
     * @template TCtor The type of the class constructor.
     * @param constructor The class constructor.
     * @param rest Additional parameters.
     * @returns An instance of the class.
     * 
     * @panic
     */
    createInstance<TCtor extends Constructor>(constructor: TCtor, ...rest: InstantiationRequiredParameters<TCtor>): InstanceType<TCtor>;
    
    /**
     * @description Creates an instance of the class described by the given 
     * descriptor.
     *
     * @template TCtor The type of the class constructor.
     * @param descriptor The descriptor of the class.
     * @returns An instance of the class.
     * 
     * @panic
     */
    createInstance<TCtor extends Constructor>(descriptor: ServiceDescriptor<TCtor>): InstanceType<TCtor>;

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
     * 
     * @panic
     */
    getOrCreateService1<T extends IService, TArgs extends any[]>(callback: (provider: IServiceProvider, ...args: TArgs) => T, ...args: TArgs): T;

    /**
     * @description Toggles the debugging mode for the instantiation service.
     *  - When enabled, the service will start logging debug information, such 
     *      as service creation and usage. The debug logs help in tracing the 
     *      instantiation process of services within the DI system.
     *  - When disabled, the service will stop logging debug information and 
     *      return the accumulated debug log messages as a string.
     * @param value A boolean flag indicating whether to enable or disable 
     *              debugging mode.
     * @returns If debugging mode is disabled, it returns a string containing 
     *          the collected debug logs.
     */
    toggleDebugging(value: true): void;
    toggleDebugging(value: false): string;
}


export class InstantiationService implements IInstantiationService {

    declare _serviceMarker: undefined;

    // [fields]

    public readonly serviceCollections: ServiceCollection;
    public readonly parent?: InstantiationService;

    private readonly _activeInstantiations = new Set<ServiceIdentifier<any>>();
    private _debug: boolean = false;
    private _debugLines: string[] = [];

    // [constructor]

    constructor(
        serviceCollections?: ServiceCollection, 
        parent?: InstantiationService,
    ) {
        this.serviceCollections = serviceCollections ?? new ServiceCollection();
        this.parent = parent;
    }

    // [public methods]

    public store<T extends IService, TCtor extends Constructor>(serviceIdentifier: ServiceIdentifier<T>, instanceOrDescriptor: T | ServiceDescriptor<TCtor>): void {
        this.serviceCollections.set(serviceIdentifier, instanceOrDescriptor);
    }

    public getService<T extends IService>(serviceIdentifier: ServiceIdentifier<T>): T {
        let service = this.serviceCollections.get(serviceIdentifier);

        if (!service && this.parent) {
            service = this.parent.__getServiceInstanceOrDescriptor(serviceIdentifier);
        }

        if (service === undefined || service instanceof ServiceDescriptor) {
            panic(`[getService] Cannot get service with identifier '${serviceIdentifier.toString()}'`);
        }
        
        return service;
    }

    public getOrCreateService<T extends IService>(serviceIdentifier: ServiceIdentifier<T>): T {
        const service = this.__getOrCreateDependencyInstance(0, serviceIdentifier);
        if (!service) {
            panic(`[getOrCreateService] UNKNOWN service '${serviceIdentifier.toString()}'.`);
        }
        return service;
    }

    public getOrCreateService1<T extends IService, R extends any[]>(callback: (provider: IServiceProvider, ...args: R) => T, ...args: R): T {
        const provider: IServiceProvider = {
            getService: <T extends IService>(serviceIdentifier: ServiceIdentifier<T>) => {
                const service = this.serviceCollections.get(serviceIdentifier);
                if (!service || service instanceof ServiceDescriptor) {
                    panic(`[getOrCreateService] UNKNOWN service '${serviceIdentifier.toString()}'.`);
                }
                return service;
            },
            getOrCreateService: <T extends IService>(serviceIdentifier: ServiceIdentifier<T>) => {
                const service = this.__getOrCreateDependencyInstance(0, serviceIdentifier);
                if (!service) {
                    panic(`[getOrCreateService] UNKNOWN service '${serviceIdentifier.toString()}'.`);
                }
                return service;
            }
        };

        return callback(provider, ...args);
    }

    public createInstance<TCtor extends Constructor>(descriptor      : ServiceDescriptor<TCtor>                                                         ): InstanceType<TCtor>;
    public createInstance<TCtor extends Constructor>(constructor     : TCtor,                            ...rest: InstantiationRequiredParameters<TCtor>): InstanceType<TCtor>;
    public createInstance<TCtor extends Constructor>(ctorOrDescriptor: TCtor | ServiceDescriptor<TCtor>, ...rest: InstantiationRequiredParameters<TCtor>): InstanceType<TCtor> {
        const ctor = (ctorOrDescriptor instanceof ServiceDescriptor) ? ctorOrDescriptor.ctor : ctorOrDescriptor;
        const args = (ctorOrDescriptor instanceof ServiceDescriptor) ? ctorOrDescriptor.args : rest;
        
        try {
            this.__traceDebugInfo(0, 'create', ctor.name);
            return this.__createInstance(0, ctor, args);
        } catch (error) {
            const ctorName = (ctorOrDescriptor instanceof ServiceDescriptor) ? ctorOrDescriptor.ctor.name : ctorOrDescriptor.name;
            panic(`[createInstance] Failed to construct (${ctorName}): ${errorToMessage(error)}`);
        }
    }

    public createChild(collection?: ServiceCollection): IInstantiationService {
        return new InstantiationService(collection, this);
    }

    public toggleDebugging(value: true): void;
    public toggleDebugging(value: false): string;
    public toggleDebugging(value: boolean): void | string {
        this._debug = value;
        if (value === true) {
            return;
        }

        // turning off debugging mode, return the debugging instantiating tree message.
        const result = this._debugLines.join('\n');
        this._debugLines = [];
        return result;
    }

    // [private helper methods]

    private __createInstance<TCtor extends Constructor>(
        depth: number, 
        ctor: TCtor, 
        args: InstantiationRequiredParameters<TCtor>
    ): InstanceType<TCtor> 
    {
        const constructor = ctor;
        
        const serviceDependencies = getDependencyTreeFor(constructor).sort((a, b) => a.index - b.index);
        const servicesArgs: unknown[] = [];
        
        for (const dependency of serviceDependencies) {
            const service = this.__getOrCreateDependencyInstance(depth + 1, dependency.id);
            if (!service && !dependency.optional) {
                panic(`[DI] '${constructor.name}' depends on a UNKNOWN service '${dependency.id}'.`);
            }
            servicesArgs.push(service);
        }

        return new constructor(...[...args, ...servicesArgs]);
    }

    private __getOrCreateDependencyInstance<T extends IService>(
        depth: number, 
        id: ServiceIdentifier<T>
    ): T 
    {
        const instanceOrDesc = this.__getServiceInstanceOrDescriptor(id);
        if (instanceOrDesc instanceof ServiceDescriptor) {
            this.__traceDebugInfo(depth, 'create', id.toString());
            return this.__safeCreateAndCacheServiceInstance(depth, id, instanceOrDesc);
        } else {
            this.__traceDebugInfo(depth, 'use', id.toString());
            return instanceOrDesc;
        }
    }

    private __safeCreateAndCacheServiceInstance<T extends IService, TCtor extends Constructor>(
        depth: number,
        id: ServiceIdentifier<T>, 
        desc: ServiceDescriptor<TCtor>
    ): T 
    {
        if (this._activeInstantiations.has(id)) {
            panic(`[DI] illegal operation: recursively instantiating service '${id}'`);
        }
        this._activeInstantiations.add(id);

        try {
            return this.__createAndCacheServiceInstance(depth, id, desc);
        } finally {
            this._activeInstantiations.delete(id);
        }
    }

    private __createAndCacheServiceInstance<T extends IService, TCtor extends Constructor>(
        depth: number,
        id: ServiceIdentifier<T>, 
        desc: ServiceDescriptor<TCtor>
    ): T 
    {
        type dependencyNode = {
            id: ServiceIdentifier<T>,
            desc: ServiceDescriptor<TCtor>,
            depth: number,
        };

        let stackSize = 0;
        const maxStackSize = 50;
        const dependencyGraph = new Graph<dependencyNode>((data) => data.id.toString());

        // use DFS 
        const stack = [{ id, desc, depth }];
        while (stack.length) {
            
            stackSize++;
            if (stackSize > maxStackSize) {
                panic(`[DI] Reaching maximum stacking size (100) when instantiating service: ${id}. Some circular dependency might happened.`);
            }

            const currDependency = stack.pop()!;
            dependencyGraph.getOrInsertNode(currDependency); // insert

            const dependencies = getDependencyTreeFor<T, TCtor>(currDependency.desc.ctor);
            for (const subDependency of dependencies) {
                const instanceOrDesc = this.__getServiceInstanceOrDescriptor<T, TCtor>(subDependency.id);

                // stupid thing happened
                if (subDependency.id.toString() === currDependency.id.toString()) {
                    panic(`[DI] A service is depending on itself - ${subDependency.id}`);
                }

                // If the dependency is already an instance, no need to instantiate again.
                if ((instanceOrDesc instanceof ServiceDescriptor) === false) {
                    continue;
                }

                // mark for later instantiating
                const uninstantiatedDependency = { id: subDependency.id, desc: instanceOrDesc, depth: currDependency.depth + 1 };
                this.__traceDebugInfo(uninstantiatedDependency.depth, 'create', uninstantiatedDependency.id.toString());
                dependencyGraph.insertEdge(currDependency, uninstantiatedDependency);
                stack.push(uninstantiatedDependency);
            }
        }

        while (true) {
            const roots = dependencyGraph.roots();

            if (roots.length === 0) {
                if (!dependencyGraph.isEmpty()) {
                    panic('[DI] dependency cycle happens');
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
                        data.depth,
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
            panic('[DI] illegal operation: setting duplicate service instance');
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
        depth: number,
        id: ServiceIdentifier<T>,
        ctor: TCtor,
        args: InstantiationRequiredParameters<TCtor>,
        supportsDelayedInstantiation: boolean,
    ): T {
        if (this.serviceCollections.get(id) instanceof ServiceDescriptor) {
            return this.___createServiceInstance(depth, ctor, args, supportsDelayedInstantiation);
        }

        else if (this.parent) {
            return this.parent.__createServiceInstanceWithOwner(depth, id, ctor, args, supportsDelayedInstantiation);
        }

        else {
            panic(`[DI] creating UNKNOWN service instance '${ctor.name}'`);
        }
    }

    private ___createServiceInstance<T extends IService, TCtor extends Constructor>(
        depth: number,
        ctor: TCtor, 
        args: InstantiationRequiredParameters<TCtor>, 
        supportsDelayedInstantiation: boolean,
    ): T {
        if (!supportsDelayedInstantiation) {
            return this.__createInstance(depth, ctor, args);
        } 
        else {
            // Return a proxy object that's backed by an idle value. That
            // strategy is to instantiate services in our idle time or when actually
            // needed but not when injected into a consumer
            const idle = new IdleValue(() => this.__createInstance(depth, ctor, args));
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

    private __traceDebugInfo(depth: number, state: 'use' | 'create', serviceID: string): void {
        if (!this._debug) {
            return;
        }

        const prefix = new Array(depth + 1).join('\t');
        this._debugLines.push(`${prefix}${state === 'use' ? 'USES' : 'CREATES'} ${serviceID}`);
    }
}