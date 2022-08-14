
/**
 * @description Returns the current time in a standard format.
 * @example 2022-08-04 03:17:18.657
 */
export function getCurrTimeStamp(): string {
    const currentTime = new Date();
    return `${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, '0')}-${currentTime.getDate().toString().padStart(2, '0')} ${(currentTime.getHours()).toString().padStart(2, '0')}:${(currentTime.getMinutes()).toString().padStart(2, '0')}:${(currentTime.getSeconds()).toString().padStart(2, '0')}.${(currentTime.getMilliseconds()).toString().padStart(3, '0')}`;
}