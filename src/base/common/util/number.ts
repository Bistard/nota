
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

    /**
     * @description Restricts the given number to a given range.
     * @param num The given number.
     */
    export function clamp(num: number, min: number, max: number): number {
        if (num <= min) {
            return min;
        }
        if (num >= max) {
            return max;
        }
        return num;
    }

}