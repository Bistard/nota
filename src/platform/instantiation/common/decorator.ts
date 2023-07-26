/* eslint-disable @typescript-eslint/ban-types */

export namespace _ServiceUtil {
    export const serviceIdentifiers = new Map<string, ServiceIdentifier<any>>();
    export const DI_TARGET = '$DI$tartget';
    export const DI_DEPENDENCIES = '$DI$dependencies';

    export function getServiceDependencies(ctor: any): { id: ServiceIdentifier<any>, index: number, optional: boolean }[] {
        return ctor[DI_DEPENDENCIES] || [];
    }
}

/**
 * @readonly a template function interface for functions with any parameters which does not return value.
 * 
 * @note (...args: any[]): any; - functions with any parameters which returns `any` type
 *       (): any;               - functions with no parameters which returns `any` type
 */
export interface ServiceIdentifier<T> {
	(...args: any[]): void;
	type: T;
}

/**
 * @description TODO: complete comments
 * 
 * @param target decorated target
 * @param id serviceIdentifier<T>
 * @param index index of the parameter
 * @param optional // TODO:
 */
function __storeServiceDependency(target: Function, id: Function, index: number, optional: boolean): void {
    // mark the dependencies on the target (the class which to be decorated)
	if (target[_ServiceUtil.DI_TARGET] === target) {
		target[_ServiceUtil.DI_DEPENDENCIES].push({ id, index, optional });
	} 
    else {
		target[_ServiceUtil.DI_DEPENDENCIES] = [{ id, index, optional }];
		target[_ServiceUtil.DI_TARGET] = target;
	}
}

/**
 * @description The 'ONLY' valid way to create a {@link ServiceIdentifier<T>}.
 * @param serviceId unique name of the service.
 * @returns A corresponding {@link ServiceIdentifier<T>} to the given service.
 */
export function createService<T>(serviceId: string): ServiceIdentifier<T> {

    // decorator could be cached
    const returnedServiceIdentifier = _ServiceUtil.serviceIdentifiers.get(serviceId);
    if (returnedServiceIdentifier !== undefined) {
        return returnedServiceIdentifier;
    }

    // decorator (will be applied when the 'target' class has been DECLEARED, not when INSTANTIATED)
    /**
     * @param target the class
     * @param index the index of the parameter
     */
    const serviceIdentifier = <any>function (target: Function, key: string, index: number): any {
        if (arguments.length !== 3) {
            throw new Error(`[createService] decorator can only be used to decorate a parameter: ${target}`);
        }
        __storeServiceDependency(target, serviceIdentifier, index, false);
    };

    serviceIdentifier.toString = () => serviceId;

    _ServiceUtil.serviceIdentifiers.set(serviceId, serviceIdentifier);
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