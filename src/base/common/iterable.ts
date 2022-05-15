
/**
 * @namespace Iterable A collection of helper functions that relates to 
 * {@link Iterable}.
 */
export namespace Iterable {

	const _emptyRef: Iterable<any> = Object.freeze([]);
	
	export function empty<T>(): Iterable<T> {
		return _emptyRef;
	}

    export function *map<T, R>(iterable: Iterable<T>, fn: (each: T, index: number) => R): Iterable<R> {
        let index = 0;
        for (const item of iterable) {
            yield fn(item, index++);
        }
    }

    export function reduce<T, R>(iterable: Iterable<T>, init: R, fn: (total: R, curr: T) => R): R {
        let val = init;
        for (const item of iterable) {
            val = fn(val, item);
        }
        return val;
    }

    export function forEach<T>(iterable: Iterable<T>, fn: (t: T, index: number) => any): void {
		let index = 0;
		for (const item of iterable) {
			fn(item, index++);
		}
	}

    export function equals<T>(iterable1: Iterable<T>, iterable2: Iterable<T>, cmp = (item1: T, item2: T) => item1 === item2) {
		const it1 = iterable1[Symbol.iterator]();
		const it2 = iterable2[Symbol.iterator]();
		
        while (true) {
			const item1 = it1.next();
			const item2 = it2.next();

			if (item1.done !== item2.done) {
				return false;
			} else if (item1.done) {
				return true;
			} else if (cmp(item1.value, item2.value) === false) {
				return false;
			}
		}
	}

}