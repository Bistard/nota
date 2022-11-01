
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
     * @description Counts the total number of digits of the given number.
     */
    export function totalDigit(num: number): number {
        let digits = (num < 0) ? 1 : 0;
        while (num) {
            num /= 10;
            ++digits;
        }
        return digits;
    }

    /**
     * @description Get the nth digit of the given number.
     */
    export function getDigitAt(num: number, n: number) {
        return num / 10**n % 10;
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