
/**
 * @description A series helper functions that relates to numbers.
 */
export namespace Numbers {
    
    /**
     * @description Check if the given number is a decimal (12.0 is an integer).
     * @param num The given number.
     */
    export function isDecimal(num: number): boolean {
        return num % 1 !== 0;
    }

}