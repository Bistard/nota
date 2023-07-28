/* eslint-disable @typescript-eslint/ban-types */
import { ParameterDecorator } from "src/base/common/util/type";

export namespace _ServiceUtil {
    export const serviceIdentifiers = new Map<string, ServiceIdentifier<any>>();
    export const DI_TARGET = '$DI$tartget';
    export const DI_DEPENDENCIES = '$DI$dependencies';

    export function getServiceDependencies(ctor: any): { id: ServiceIdentifier<any>, index: number, optional: boolean }[] {
        return ctor[DI_DEPENDENCIES] || [];
    }

    export function markDependencyAt(target: object, id: Function, index: number, optional: boolean): void {
       
       // initialization
       {
           if (!target[_ServiceUtil.DI_TARGET]) {
               target[_ServiceUtil.DI_TARGET] = target;
           }
       
           if (!target[_ServiceUtil.DI_DEPENDENCIES]) {
               target[_ServiceUtil.DI_DEPENDENCIES] = [];
           }
       }
       
       // unexpected behaviour, we throw an error.
       if (target[_ServiceUtil.DI_TARGET] !== target) {
           throw new Error(`[__storeServiceDependency] '${target}[${_ServiceUtil.DI_TARGET}]' is already used`);
       }
   
       // mark the dependency on the target
       target[_ServiceUtil.DI_DEPENDENCIES].push({ id, index, optional });
   }
}

/**
 * Represents a decorator, as an identifier, for each unique microservice.
 * 
 * @warn The usage of `& { _: T}` is necessary for type inferring. But should not
 * be used in runtime usage.
 */
export type ServiceIdentifier<T> = ParameterDecorator & { _: T };

/**
 * @description The 'ONLY' valid way to create a {@link ServiceIdentifier<T>}.
 * @param serviceId unique name of the service.
 * @returns A corresponding {@link ServiceIdentifier<T>} to the given service.
 */
export function createService<T>(serviceId: string): ServiceIdentifier<T> {

    // retrive the decorator from the cache
    const cachedServiceIdentifier = _ServiceUtil.serviceIdentifiers.get(serviceId);
    if (cachedServiceIdentifier) {
        return cachedServiceIdentifier;
    }

    /**
     * @description The decorator to be returned. It will be executed when the 
     * 'target' class has been DECLEARED, not when INSTANTIATED.
     * @param target the class
     * @param index the index of the parameter
     */
    const serviceIdentifier: ServiceIdentifier<T> = function (target: object, propertyKey: string | undefined, parameterIndex: number): any {
        if (arguments.length !== 3) {
            throw new Error(`[createService] decorator can only be used to decorate a class parameter: ${target}`);
        }
        _ServiceUtil.markDependencyAt(target, serviceIdentifier, parameterIndex, false);        
    };
    serviceIdentifier._ = undefined!;
    serviceIdentifier.toString = () => serviceId;

    // cache the decorator
    _ServiceUtil.serviceIdentifiers.set(serviceId, serviceIdentifier);

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