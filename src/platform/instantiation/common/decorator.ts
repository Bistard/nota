/* eslint-disable @typescript-eslint/ban-types */
import { Constructor, ParameterDecorator } from "src/base/common/util/type";

namespace __ServiceUtil {
    
    export const serviceIdentifierMap = new Map<string, ServiceIdentifier<any>>();

    export const DI_TARGET = '$DI$tartget';
    export const DI_DEPENDENCIES = '$DI$dependencies';

    export function markDependencyAt(target: Function, id: Function, index: number, optional: boolean): void {

        // initialization
        if (!target[__ServiceUtil.DI_TARGET]) {
            target[__ServiceUtil.DI_TARGET] = target;
            target[__ServiceUtil.DI_DEPENDENCIES] = [];
        }
        
        /**
         * When applying a decorator to a child and parent class, since the 
         * child class extends the parent ones, it also inherits the parent 
         * dependency tree. We need to manually remove the inherited dependency 
         * tree.
         */
        if (target[__ServiceUtil.DI_TARGET] !== target) {
            target[__ServiceUtil.DI_TARGET] = target;
            target[__ServiceUtil.DI_DEPENDENCIES] = [];
        }

        // mark the dependency on the target
        target[__ServiceUtil.DI_DEPENDENCIES].push({ id, index, optional });
    }
}

export function getServiceDependencies<TCtor extends Constructor>(ctor: TCtor): { id: ServiceIdentifier<any>, index: number, optional: boolean; }[] {
    return ctor[__ServiceUtil.DI_DEPENDENCIES] || [];
}

/**
 * Represents a decorator, as an identifier, for each unique microservice.
 * 
 * @warn The usage of `& { _: T}` is necessary for type inferring. But should not
 * be used in runtime usage.
 */
export type ServiceIdentifier<T> = ParameterDecorator & { _: T; };

/**
 * @description The 'ONLY' valid way to create a {@link ServiceIdentifier<T>}.
 * @param serviceId unique name of the service.
 * @returns A corresponding {@link ServiceIdentifier<T>} to the given service.
 */
export function createService<T>(serviceId: string): ServiceIdentifier<T> {

    // retrive the decorator from the cache
    const cachedServiceIdentifier = __ServiceUtil.serviceIdentifierMap.get(serviceId);
    if (cachedServiceIdentifier) {
        return cachedServiceIdentifier;
    }

    /**
     * @description The decorator to be returned. It will be executed when the 
     * 'target' class has been DECLEARED, not when INSTANTIATED.
     * @param target the class
     * @param index the index of the parameter
     */
    const serviceIdentifier: ServiceIdentifier<T> = function (target: Function, propertyKey: string | undefined, parameterIndex: number): any {
        if (arguments.length !== 3) {
            throw new Error(`[createService] decorator can only be used to decorate a class parameter: ${target}`);
        }
        __ServiceUtil.markDependencyAt(target, serviceIdentifier, parameterIndex, false);
    };
    serviceIdentifier._ = undefined!;
    serviceIdentifier.toString = () => serviceId;

    // cache the decorator
    __ServiceUtil.serviceIdentifierMap.set(serviceId, serviceIdentifier);

    // return the decorator
    return serviceIdentifier;
}

export function refineDecorator<T1, T extends T1>(serviceIdentifier: ServiceIdentifier<T1>): ServiceIdentifier<T> {
    return <ServiceIdentifier<T>>serviceIdentifier;
}

/**
 * The purpose of this field can be to identify whether the class is used within 
 * a microservice architecture at compile time. 
 * @note Every microservice should implement this interface.
 * @note No runtime cost. Used for type inferring by InstantiationService.
 */
export interface IService {
    _serviceMarker: undefined;
}