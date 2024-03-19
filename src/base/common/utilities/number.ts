
/**
 * @description A series of helper functions that relates to numbers.
 */
export namespace Numbers {
    
    /**
     * @description Check if the given number is a decimal (12.0 is an integer).
     * @param num The given number.
     */
    export function isDecimal(num: number): boolean {
        return !Number.isInteger(num);
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
     * @param min The minimum boundary.
     * @param max The maximum boundary.
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

/**
 * @description A series of helper functions that relates to bit operations.
 */
export namespace Bit {

    /**
     * @description Selects the bit at the position i of x. 
     * @example 
     * at(5, 0) => 1; 
     * at(5, 2) => 4;
     */
    export function at(x: number, i: number): number {
        return x & (1 << i);
    }

    /**
     * @description Returns the lowest significant bit of the given number.
     */
    export function lowbit(x: number): number {
        return x & (x ^ (x - 1));
    }

    /**
     * @description Counts the number of bits (1's) of the given number (only
     * works for 32-bit integer).
     * @note More general solution go see {@link Bit.bitCount}.
     */
    export function bitCount32(x: number): number {
        x = x - ((x >> 1) & 0x55555555);
        x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
        return ((x + (x >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
    }

    /**
     * @description Counts the number of bits (1's) of the given number.
     */
    export function bitCount(x: number): number {
        let bits = 0;
        while (x) {
          bits += bitCount32(x | 0);
          x /= 0x100000000;
        }
        return bits;
    }

    /**
     * @description Convert the given number into a binary string form.
     */
    export function toBinary(x: number): string {
        return (x >>> 0).toString(2);
    }
}