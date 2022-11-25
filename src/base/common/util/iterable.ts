
export interface IIterable<T> {
	[Symbol.iterator](): Iterator<T>;
}

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

	/**
	 * @description Filters the given iterable by the provided predicate and 
	 * returns a new one. Note that the original iterable is NOT modified.
	 * @param iterable The given {@link Iterable}.
	 * @param predicate The filter function.
	 * @returns The new {@link Iterable}.
	 * 
	 * @type T represents the type of items we wish to filter for.
	 */
	export function filter<T>(iterable: Iterable<any>, predicate: (value: any, index: number) => boolean): Iterable<T> {
		let index = 0;
		const it = iterable[Symbol.iterator]();
		const result: T[] = [];

		while (true) {
			const item = it.next();

			if (item.done) {
				return result;
			}

			if (predicate(item.value, index)) {
				result.push(item.value as T);
			}

			index++;
		}
	}

	/**
	 * @description Returns a new iterable with all falsy removed. Note that the 
	 * original iterable is NOT modified.
	 * @param iterable The given {@link Iterable}.
	 * @returns The new iterable.
	 */
	export function coalesce<T = any>(iterable: Iterable<T | undefined | null>): Iterable<T> {
		return Iterable.filter<T>(iterable, val => !!val);
	}

}
