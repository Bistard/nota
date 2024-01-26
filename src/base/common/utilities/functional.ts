

/**
 * Defines a function type representing a lazy IO operation.
 * 
 * `IO<T>` is a higher-order function type that encapsulates a deferred input/output operation. 
 * It takes no arguments and, when invoked, returns a value of type `T`.
 * This type is useful in functional programming to manage side effects.
 *
 * @example
 * // Example of a function that returns a string from an IO operation.
 * const readData: IO<string> = () => "data";
 * const result = readData(); // Invokes the IO operation
 */
export type IO<T> = () => T;