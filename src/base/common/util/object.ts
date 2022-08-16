import { isObject } from "src/base/common/util/type";

/**
 * Copies all properties of source into destination. The optional parameter 
 * 'overwrite' allows to control if existing properties on the destination 
 * should be overwritten or not.
 * @default overwrite true
 */
export function mixin(destination: any, source: any, overwrite: boolean = true): any {
	if (isObject(destination) === false) {
		return source;
	}

	if (isObject(source)) {
		Object.keys(source).forEach(propName => {
			if (propName in destination) {
				if (overwrite) {

					// see prototype-polluting https://github.com/Bistard/nota/issues/129
					if (source.hasOwnProperty(propName) === false) {
						return;
					}

					if (isObject(destination[propName]) && isObject(source[propName])) {
						mixin(destination[propName], source[propName], overwrite);
					} else {
						destination[propName] = source[propName];
					}
				}
			} else {
				destination[propName] = source[propName];
			}
		});
	}
    
	return destination;
}

/**
 * @description Iterate the properties and methods of the given object.
 * @param obj The given {@link object}.
 * @param fn The function that takes the string of the property and the ordinal 
 * index of the property in that object.
 */
export function iterProperty(obj: object, fn: (propName: string, index: number) => any): void {
    let idx = 0;
	for (const propName of Object.getOwnPropertyNames(Object.getPrototypeOf(obj))) {
		fn(propName, idx++);
	}
}

/**
 * @description Iterate the enumerable properties of the given object.
 * @param obj The given {@link object}.
 * @param fn The function that takes the string of the property and the ordinal 
 * index of the property in that object.
 */
export function iterPropertyEnumerable(obj: object, fn: (propName: string, index: number) => any): void {
    let idx = 0;
	for (const propName of Object.keys(obj)) {
		fn(propName, idx++);
	}
}