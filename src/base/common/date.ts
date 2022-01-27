
/**
 * @description Returns the current locale date as a string.
 * @example "12/29/2021, 12:08:40 PM"
 */
export function getCurrentFormatDate(): string {
    return new Date().toLocaleString();
}