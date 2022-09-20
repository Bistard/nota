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

					if (destination.hasOwnProperty(propName) 
						&& isObject(destination[propName]) 
						&& isObject(source[propName])
					) {
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
 * @param recursiveLevel How deep you want for recursive iteration. Default is 0. 
 * 						 Set to -1 if you need iterate to the deepest.
 */
export function iterProp(obj: any, fn: (propName: string, index: number) => any, recursiveLevel: number = 0): void {
    if (!isObject(obj)) {
		return;
	}

	let idx = 0;
	const __handler = (prototype: any, fn: (propName: string, index: number) => any, recursiveLevel: number) => {
		if (!prototype) {
			return;
		}

		if (recursiveLevel) {
			__handler(Object.getPrototypeOf(prototype), fn, recursiveLevel - 1);
		}
		
		for (const propName of Object.getOwnPropertyNames(prototype)) {
			fn(propName, idx++);
		}
	}

	__handler(Object.getPrototypeOf(obj), fn, recursiveLevel);
}

/**
 * @description Iterate the enumerable properties of the given object.
 * @param obj The given {@link Object}.
 * @param fn The function that takes the string of the property and the ordinal 
 * index of the property in that object.
 * @param recursiveLevel How deep you want for recursive iteration. Default is 0. 
 * 						 Set to -1 if you need iterate to the deepest.
 */
export function iterPropEnumerable(obj: any, fn: (propName: string, index: number) => any, recursiveLevel: number = 0): void {
    let idx = 0;
	for (const propName of Object.keys(obj)) {
		if (recursiveLevel) {
			const value = obj[propName];
			if (isObject(value)) {
				iterPropEnumerable(value, fn, recursiveLevel - 1);
			}
		}
		fn(propName, idx++);
	}
}

/**
 * @description Returns a deep copy version of the given object or array.
 */
export function deepCopy<T extends Object | []>(obj: T): T {
	
	// ensure `null` does not count and other weird stuff
	if (!obj || typeof obj !== 'object') {
		return obj;
	}
	
	if (obj instanceof RegExp) {
		return obj;
	}
	
	const copy: T = Array.isArray(obj) ? [] : Object.assign({});
	for (const propName of Object.keys(obj)) {
		const value = obj[propName]!;
		
		if (typeof value === 'object') {
			copy[propName] = deepCopy(value);
		} else {
			copy[propName] = value;
		}
	}

	return copy;
}

/**
 * @description Returns a useless but simple object except that whatever you do 
 * to it will not throw any errors.
 * @note Testing purpose only.
 */
export function nullObject(): any {
    return new Proxy({}, {
        get: () => nullObject,
		set: () => true,
    });
}