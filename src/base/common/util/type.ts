
export type DightInString = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
export type AlphabetInStringLow = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z';
export type AlphabetInStringCap = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
export type AlphabetInString = AlphabetInStringCap | AlphabetInStringLow;

/**
 * Check the tuple size matches the given size.
 */
export type Tuple<Size extends number, Arr extends Readonly<unknown[]>> = Arr['length'] extends Size ? Size extends Arr['length'] ? Arr : never : never;
export type Single<T> = Tuple<1, [T]>;
export type Pair<T, R> = Tuple<2, [T, R]>;
export type Triple<T, R, S> = Tuple<3, [T, R, S]>;

/**
 * Make all the properties mutable (remove readonly).
 */
export type Mutable<Immutable> = {
    -readonly [P in keyof Immutable]: Immutable[P]
}

/**
 * Accepts condition C, a truthy return type T, and a falsy return type F.
 */
export type If<C, T, F> = C extends boolean ? (C extends true ? T : F) : never;

/**
 * Determines if the given type T is truthy.
 */
export type IsTrue<T> = T extends '' | [] | false | 0 ? false : T extends {} ? keyof T extends never ? false :  true : false;

/**
 * Determines if the given array contains any truthy values.
 */
export type AnyOf<T extends readonly any[]> = T extends [infer F, ...infer Rest] ?  IsTrue<F> extends true ? true : AnyOf<Rest> : IsTrue<T[0]>;

/**
 * Push any type into the end of the array.
 */
export type Push<T extends any[], V> = [...T, V];

/**
 * Pop the end of the array (require non empty).
 */
export type Pop<T extends any[]> = T extends [...infer Rest, any] ? [Rest] : never;

/**
 * Concatenate two arrays.
 */
export type Concat<T extends any[], U extends any[]> = [...T, ...U];

/**
 * Given a type T, maps each property with type `from` to type `to` that are
 * defined in the given type R.
 */
export type MapTypes<T, R extends { from: any; to: any }> = {
    [K in keyof T]: T[K] extends R['from']
    ? R extends { from: T[K] }
        ? R['to']
        : never
    : T[K]
};

/**
 * Wraps all the return types from all the function properties with a {@link Promise}.
 * @note Ignores the return types that are already promises.
 */
export type Promisify<T> = { 
    [K in keyof T]: 
    T[K] extends ((...args: any) => infer R) 
        ? (R extends Promise<any> 
            ? T[K] 
            : (...args: Parameters<T[K]>) => Promise<R>) 
        : T[K] 
};

/**
 * Split string into a tuple by a deliminator.
 */
export type SplitString<S extends string, D extends string> =
    string extends S ? string[] :
    S extends '' ? [] :
    S extends `${infer T}${D}${infer U}` ? [T, ...SplitString<U, D>] : [S];

/**
 * @description Mocks the given value's type.
 */
export function mockType<T>(val: any): T {
    return val as unknown as T;
}

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
 * @description Check if the object is undefined or null.
 */
export function isNonNullable(value: any): boolean {
    return !(typeof value === 'undefined' || value === null);
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
    if (typeof value === 'undefined' || value === null) {
        return defaultValue;
    }
    return value as NonNullable<T>;
}

/**
 * @description Make sure `null` is converted to `undefined`.
 */
export function NulltoUndefined<T>(obj: T | null): T | undefined {
    return obj === null ? undefined : obj;
}