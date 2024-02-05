
export type DightInString = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
export type AlphabetInStringLow = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z';
export type AlphabetInStringCap = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
export type AlphabetInString = AlphabetInStringCap | AlphabetInStringLow;

/**
 * A dictionary (alias for `Record<K, V>`).
 */
export type Dictionary<K extends string | number | symbol, V> = Record<K, V>;

/**
 * A string dictionary (alias for `Record<string, V>`).
 */
export type StringDictionary<V> = Record<string, V>;

/**
 * A string dictionary (alias for `Record<number, V>`).
 */
export type NumberDictionary<V> = Record<number, V>;

/**
 * Represents a tuple.
 */
export type Tuple<Size extends number, Arr extends Readonly<unknown[]>> = Arr['length'] extends Size ? Size extends Arr['length'] ? Arr : never : never;
export type Single<T> = Tuple<1, [T]>;
export type Pair<T, R> = Tuple<2, [T, R]>;
export type Triple<T, R, S> = Tuple<3, [T, R, S]>;

/**
 * `Constructor` is a generic type that represents the constructor function of 
 * any class. This type allows specifying the types of arguments that the 
 * constructor function takes.
 *
 * @template TInstance The instance type that the constructor returns.
 * @template TArgs The types of the arguments that the constructor function takes. Default is any[] if not provided.
 * 
 * @example
 * // Here is an example of using `Constructor` with a class `MyClass`.
 * class MyClass {
 *   constructor(arg1: number, arg2: string) {
 *     // ...
 *   }
 * }
 * 
 * let instanceCreator: Constructor<MyClass, [number, string]>;
 * instanceCreator = MyClass;
 * let instance = new instanceCreator(10, 'hello');
 */
export type Constructor<TInstance = any, TArgs extends any[] = any[]> = new (...args: TArgs) => TInstance;
export type AbstractConstructor<TInstance = any, TArgs extends any[] = any[]> = abstract new (...args: TArgs) => TInstance;

/**
 * `CompareFn` is a type representing a generic comparison function.
 * This function takes two arguments of the same type and returns a number.
 * Typically, this function is used for sorting or comparing values in data 
 * structures.
 * 
 * The function should return:
 * - A negative number if `a` should be sorted/comes before `b`
 * - A zero if `a` and `b` are equal
 * - A positive number if `a` should be sorted/comes after `b`
 *
 * @template T The type of the arguments to compare.
 *
 * @example
 * // Here is an example of using `CompareFn` with numbers.
 * let compareNumbers: CompareFn<number>;
 * compareNumbers = (a, b) => a - b;
 * let numbers = [3, 1, 4, 1, 5, 9];
 * numbers.sort(compareNumbers);
 */
export type CompareFn<T> = (a: T, b: T) => CompareOrder;

/**
 * Given two parameters `a` and `b`, determine which one goes first. `First` 
 * indicates `a`, `second` indicates `b`.
 */
export const enum CompareOrder {
    
    /** The first parameter `a` goes first. */
    First = -1,

    /** The second parameter `b` goes first. */
    Second = 1,

    /** Items are the same. */
    Same = 0,
}

/**
 * This type only removes `undefined`, which s more narrows than {@link NonNullable}.
 * @note {@link NonNullable} removes `undefined` and `null`.
 */
export type NonUndefined = {} | null;

/**
 * This is a generic utility type that describes a callable function.
 * @template TArguments - An array tuple type representing the expected types of the function's arguments.
 *                        The default is `void[]`, which means the function takes no arguments.
 * @template TReturnType - The expected return type of the function.
 *                         The default is `void`, which means the function does not return anything.
 *
 * @example
 * const log: Callable<[message: string]> = message => console.log(message);
 * log("Hello, World!");  // Correct usage
 * log(42);  // Type Error: number is not assignable to string
 *
 * const add: Callable<[number, number], number> = (a, b) => a + b;
 * add(1, 2);  // 3
 * add("1", "2");  // Type Error: string is not assignable to number
 */
export type Callable<TArguments extends unknown[] = void[], TReturnType = void> = (...args: TArguments) => TReturnType;

/**
 * Type for class decorators. A class decorator takes the constructor function of 
 * the class being decorated, and optionally returns a new constructor function.
 *
 * @template TFunction The type of the class constructor function.
 * @param {TFunction} target The class constructor function.
 * @returns {TFunction | void} Optionally a new constructor function.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;

/**
 * Type for property decorators. A property decorator takes the target object 
 * and the property key of the property being decorated.
 *
 * @param {object} target The target object.
 * @param {string | symbol} propertyKey The key of the property.
 */
export type PropertyDecorator = (target: object, propertyKey: string | symbol) => void;

/**
 * Type for method decorators. A method decorator takes the target object, 
 * the property key of the method, and the property descriptor of the method,
 * and optionally returns a new property descriptor.
 *
 * @template T The type of the method.
 * @param {object} target The target object.
 * @param {string | symbol} propertyKey The key of the method.
 * @param {TypedPropertyDescriptor<T>} descriptor The descriptor of the method.
 * @returns {TypedPropertyDescriptor<T> | void} Optionally a new descriptor.
 */
export type MethodDecorator = <T>(target: object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;

/**
 * Type for parameter decorators. A parameter decorator takes the target object, 
 * the property key of the method, and the index of the parameter being decorated.
 *
 * @param {object} target The target object.
 * @param {string | undefined} propertyKey The key of the method.
 * @param {number} parameterIndex The index of the parameter.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type ParameterDecorator<T extends Function | object> = (target: T, propertyKey: string | undefined, parameterIndex: number) => void;

/**
 * Accepts condition C, a truthy return type T, and a falsy return type F.
 */
export type If<C, T, F> = C extends boolean ? (C extends true ? T : F) : never;

/**
 * Determines if the given type T is truthy.
 */
export type IsTruthy<T> = T extends '' | [] | false | 0 ? false : T extends {} ? keyof T extends never ? false : true : false;

/**
 * Negate a boolean type.
 */
export type Negate<T> = T extends boolean ? (T extends true ? false : true) : never;

/**
 * Returns E type only if T is `null`, `undefined` or `never`.
 */
export type Or<T, E> = IsNever<T> extends true ? E : T extends (null | undefined) ? E : T;

/**
 * Determines if the given type T is string.
 */
export type IsString<T> = T extends string ? true : false;

/**
 * Determines if the given type T is number.
 */
export type IsNumber<T> = T extends number ? true : false;

/**
 * Determines if the given type T is boolean.
 */
export type IsBoolean<T> = T extends boolean ? true : false;

/**
 * Determines if the given type T is null.
 */
export type IsNull<T> = T extends null ? true : false;

/**
 * Determines if the given type T is an array.
 */
export type IsArray<T> = T extends any[] ? true : false;

/**
 * Determines if the given type T is an object.
 */
export type IsObject<T> = T extends Dictionary<string, any> ? true : false;

/**
 * Checks if a type `T` is equivalent to the `any` type.
 *
 * @example
 * type Example1 = IsAny<any>;       // true
 * type Example2 = IsAny<number>;    // false
 */
export type IsAny<T> = 0 extends (1 & T) ? true : false;

/**
 * Determines if the given type T is never.
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Compares two types `T` and `U` for strict equality.
 *
 * Returns `true` if the types are strictly equal, otherwise returns `false`.
 * Additionally, ensures that `any` type is always unequal to any other type.
 * 
 * @template T The first type to compare.
 * @template U The second type to compare.
 * @example
 * AreEqual<number, number>;   // true
 * AreEqual<number, string>;   // false
 * AreEqual<any, number>;      // false
 * AreEqual<boolean, true>;    // false
 * AreEqual<boolean, false>;   // false
 * AreEqual<false, false>;     // true
 * 
 * @link https://github.com/microsoft/TypeScript/issues/27024
 */
export type AreEqual<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? true : false;

/**
 * Returns a boolean that determines if the given array contains any truthy values.
 */
export type AnyOf<T extends readonly any[]> = T extends [infer F, ...infer Rest] ? IsTruthy<F> extends true ? true : AnyOf<Rest> : IsTruthy<T[0]>;

/**
 * Push any type into the end of the array.
 */
export type Push<Arr extends any[], V> = [...Arr, V];

/**
 * Pop the end of the array (require non empty).
 */
export type Pop<Arr extends any[]> = Arr extends [...infer Rest, any] ? Rest : never;

/**
 * Concatenate two arrays.
 */
export type ConcatArray<T extends any[], U extends any[]> = [...T, ...U];

/**
 * Represents T or Array of T or Array of Array of T...
 */
export type NestedArray<T> = (T | NestedArray<T>)[];

/**
 * Represent a non-empty array of type T.
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * make every parameter of an object and its sub-objects recursively as readonly.
 * 
 * @note related built-in type: {@link Readonly}.
 */
export type DeepReadonly<Mutable> =
    Mutable extends Callable<any[], any>
    ? Mutable
    : Mutable extends (infer R)[]
    ? ReadonlyArray<DeepReadonly<R>>
    : Mutable extends ReadonlyArray<infer R>
    ? ReadonlyArray<DeepReadonly<R>>
    : Mutable extends object
    ? { readonly [P in keyof Mutable]: DeepReadonly<Mutable[P]> }
    : Mutable;

/**
 * Make all the properties mutable (remove readonly).
 */
export type Mutable<Immutable> = {
    -readonly [P in keyof Immutable]: Immutable[P]
};

/**
 * Make all the properties mutable recursively (remove readonly).
 */
export type DeepMutable<Immutable> = {
    -readonly [TKey in keyof Immutable]:
    Immutable[TKey] extends (infer R)[]
    ? DeepMutable<R>[]
    : Immutable[TKey] extends ReadonlyArray<infer R>
    ? DeepMutable<R>[]
    : Immutable[TKey] extends object
    ? DeepMutable<Immutable[TKey]>
    : Immutable[TKey];
};

/**
 * Given a type T, maps each property with type `from` to type `to` that are
 * defined in the given type R.
 */
export type MapTypes<T, R extends { from: any; to: any; }> = {
    [K in keyof T]: T[K] extends R['from']
    ? R extends { from: T[K]; }
    ? R['to']
    : never
    : T[K]
};

/**
 * built-in type: {@link Awaited} to unpack the return type from a Promise.
 */

/**
 * `Promisify` type takes an object type `T` and returns a new type.
 * For each property of `T`:
 * - If the property is a function and its return type is not a Promise, it changes its return type to be a Promise.
 * - If the property is a function and its return type is already a Promise, it keeps it as is.
 * - If the property is not a function, it remains unchanged.
 *
 * @template T - An object type with any kind of properties.
 * 
 * @example
 * type Original = {
 *   syncMethod: () => number;
 *   asyncMethod: () => Promise<string>;
 *   regularProp: string;
 * };
 * 
 * const promisified: Promisify<Original> = {
 *   syncMethod: async () => 42,
 *   asyncMethod: async () => 'hello',
 *   regularProp: 'world'
 * };
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
 * Represents a generic reference object. This type is used to create an object 
 * that holds a reference to an entity of type `T`.
 * 
 * @example
 * // Example usage of Reference<T>
 * // Suppose we have an interface for a User
 * interface User {
 *   name: string;
 *   age: number;
 * }
 * 
 * // We can then create a reference to a User object
 * let user: User = { name: "Alice", age: 30 };
 * let userRef: Reference<User> = { ref: user };
 * 
 * // This allows us to pass userRef around and modify the original user object
 * // through this reference
 * function updateUserAge(userRef: Reference<User>, newAge: number) {
 *   userRef.ref.age = newAge;
 * }
 * 
 * // Updating user's age via the reference
 * updateUserAge(userRef, 35);
 * console.log(user.age); // Outputs: 35
 * 
 * // The user object is updated through the userRef reference
 */
export type Reference<T> = {
    ref: T;
};

/**
 * @description Ensures that the provided type `T` is strictly `true`.
 * @note The function itself doesn't perform any runtime checks. The type 
 * checking is done at compile time.
 *
 * @template T A type that must extend `true`.
 * @example
 * checkTrue<true>();  // No error
 * checkTrue<false>();  // Error: Argument of type 'false' is not assignable to parameter of type 'true'.
 */
export function checkTrue<T extends true>(): void { }

/**
 * @description Ensures that the provided type `T` is strictly `false`.
 * @note The function itself doesn't perform any runtime checks. The type 
 * checking is done at compile time.
 *
 * @template T A type that must extend `false`.
 * @example
 * checkFalse<false>();  // No error
 * checkFalse<true>();  // Error: Argument of type 'true' is not assignable to parameter of type 'false'.
 */
export function checkFalse<T extends false>(): void { }

/**
 * @description Is the given variable is a primitive type: number , string , 
 * boolean , null , undefined , symbol or bigint.
 */
export function isPrimitive(val: any): boolean {
    if (val === null) {
        return true;
    }

    switch (typeof val) {
        case 'object':
        case 'function':
            return false;
        default:
            return true;
    }
}

export function isNumber(obj: any): obj is number {
    return (typeof obj === 'number' && !isNaN(obj));
}

export function isString(obj: any): obj is string {
    return typeof obj === 'string';
}

export function isBoolean(obj: any): obj is boolean {
    return typeof obj === 'boolean';
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isFunction(obj: any): obj is Function {
    return typeof obj === 'function';
}

/**
 * @description If the given value is an object in general speaking (does not
 * count as `array`, `null`, {@link RegExp} or {@link Date}).
 */
export function isObject<T>(obj: T): obj is NonNullable<T> {
    return typeof obj === "object"
        && obj !== null
        && !Array.isArray(obj)
        && !(obj instanceof RegExp)
        && !(obj instanceof Date);
}

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

export function isNullable(value: any): value is undefined | null {
    return (typeof value === 'undefined' || value === null);
}

export function isNonNullable<T>(value: T): value is NonNullable<T> {
    return !isNullable(value);
}

export function nullToUndefined<T>(obj: T | null): T | undefined {
    return obj === null ? undefined : obj;
}

/**
 * @returns whether the provided parameter is an Iterable, and will cast to the 
 * given generic type.
 */
export function isIterable<T>(obj: unknown): obj is Iterable<T> {
    return !!obj && typeof (obj)[Symbol.iterator] === 'function';
}

/**
 * @description Determines if the given object is a {@link Promise} or not.
 * @param obj The given object.
 */
export function isPromise<T = unknown>(obj: any): obj is Promise<T> {
    if (typeof obj === 'object' &&
        typeof obj.then === 'function' &&
        typeof obj.catch === 'function' &&
        typeof obj.finally === 'function'
    ) {
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
 * 
 * @deprecated Alternatively, you may use `(value ?? defaultValue)` instead.
 */
export function ifOrDefault<T>(value: T, defaultValue: NonNullable<T>): NonNullable<T> {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    return value;
}
