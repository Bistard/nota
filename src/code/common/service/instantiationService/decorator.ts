export namespace _ServiceUtil {
    export const serviceIdentifiers = new Map<string, ServiceIdentifier<any>>();
    export const DI_TARGET = '$DI$tartget';
    export const DI_DEPENDENCIES = '$DI$dependencies';

    export function getServiceDependencies(ctor: any)
        : { id: ServiceIdentifier<any>, index: number, optional: boolean }[]
    {
        return ctor[DI_DEPENDENCIES] || [];
    }
}

/**
 * @readonly a template function interface for functions with any parameters which does not return value.
 * 
 * @note (...args: any[]): any; - functions with any parameters which can return type
 *       (): any;               - functions with no parameters which can return type
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
function storeServiceDependency(target: Function, id: Function, index: number, optional: boolean): void {
    // mark the dependencies on the target (the class which to be decorated)
	if ((target as any)[_ServiceUtil.DI_TARGET] === target) {
		(target as any)[_ServiceUtil.DI_DEPENDENCIES].push({ id, index, optional });
	} else {
		(target as any)[_ServiceUtil.DI_DEPENDENCIES] = [{ id, index, optional }];
		(target as any)[_ServiceUtil.DI_TARGET] = target;
	}
}

/**
 * @description The 'ONLY' valid way to create a 'ServiceIdentifier<T>'.
 * 
 * @param serviceId unique name of the service
 * @returns {ServiceIdentifier<T>} the coressponing serviceIdentifier to the given service
 */
export function createDecorator<T>(serviceId: string): ServiceIdentifier<T> {

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
            throw new Error('@IServiceName-decorator can only be used to decorate a parameter.');
        }
        storeServiceDependency(target, serviceIdentifier, index, false);
    };

    serviceIdentifier.toString = () => serviceId;

    _ServiceUtil.serviceIdentifiers.set(serviceId, serviceIdentifier);
	return serviceIdentifier;
}