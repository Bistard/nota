
function toTwoDigits(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
}

function toThreeDigits(num: number): string {
    return num < 10
         ? `00${num}` : num < 100 ? `0${num}` 
         : `${num}`;
}

/**
 * @description Returns the current time in a standard format.
 * @example 2022-08-04 03:17:18.657
 */
export function getCurrTimeStamp(): string {
		const currentTime = new Date();
		return `${currentTime.getFullYear()}-${toTwoDigits(currentTime.getMonth() + 1)}-${toTwoDigits(currentTime.getDate())} ${toTwoDigits(currentTime.getHours())}:${toTwoDigits(currentTime.getMinutes())}:${toTwoDigits(currentTime.getSeconds())}.${toThreeDigits(currentTime.getMilliseconds())}`;
}