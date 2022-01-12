
export function isObject(obj: any): obj is any {
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

export function isArray(array: any): array is any[] {
	return Array.isArray(array);
}