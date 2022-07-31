
export type DightInString = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

/**
 * Represents an array that contains only 1 item.
 */
export type Single<T> = [T];

/**
 * Represents an array that contains only 2 items.
 */
export type Pair<T, R> = [T, R];

/**
 * Represents an array that contains only 3 items.
 */
export type Triple<T, R, S> = [T, R, S];

/**
 * Make all the fields become required.
 */
export type AllRequired<T> = {
    [P in keyof T]-?: T[P];
};

/**
 * @description Checks if it is the type `object`.
 */
export function isObject(obj: any): obj is any {
    return typeof obj === "object"
        && obj !== null
        && !Array.isArray(obj)
        && !(obj instanceof RegExp)
        && !(obj instanceof Date);
}

/**
 * @description Checks if it is an empty object.
 */
export function isEmptyObject(obj: any): boolean {
    if (!isObject(obj)) {
        return false;
    }

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }

    return true;
}

/**
 * @description Checks if it is an array.
 */
export function isArray(array: any): array is any[] {
    return Array.isArray(array);
}

/**
 * @returns whether the provided parameter is an Iterable, casting to the given generic
 */
 export function isIterable<T>(obj: unknown): obj is Iterable<T> {
	return !!obj && typeof (obj as any)[Symbol.iterator] === 'function';
}

/**
 * @description Determines if the given object is a {@link Promise} or not.
 * @param obj The given object.
 */
export function isPromise(obj: any): obj is Promise<any> {
    if (typeof obj === 'object' && typeof obj.then === 'function') {
      return true;
    }
    return false;
}

/**
 * @description Returns value if it is not `undefined`, otherwise returns the 
 * defaultValue.
 * @param value provided value which could be `undefined`.
 * @param defaultValue provided default value which cannot be `undefined`.
 * @returns the default value.
 */
export function ifOrDefault<T>(value: T, defaultValue: NonNullable<T>): NonNullable<T> {
    if (typeof value === 'undefined') {
        return defaultValue;
    }
    return value as NonNullable<T>;
}
