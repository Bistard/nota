
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
	export function filter<T extends E, E = any>(iterable: Iterable<E>, predicate: (value: E, index: number) => boolean): Iterable<T> {
		let index = 0;
		const it = iterable[Symbol.iterator]();
		const result: T[] = [];

		while (true) {
			const item = it.next();

			if (item.done) {
				return result;
			}

			if (predicate(item.value, index)) {
				result.push(<T>item.value);
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
	export function coalesce<T>(iterable: Iterable<T | undefined | null>): Iterable<T> {
		return Iterable.filter<T, T | undefined | null>(iterable, val => !!val);
	}

	/**
	 * @description Returns the maximum element of an iterable based on a 
	 * provided predicate function.
	 * @param iterable The given {@link Iterable}.
	 * @param predicate A function that takes an element of the iterable and 
	 * 					returns a numeric value.
	 * @returns The element with the maximum numeric value as determined by the 
	 * 			predicate, or `null` if the iterable is empty.
	 */
	export function maxBy<T>(iterable: Iterable<T>, predicate: (value: T) => number): T | null {
		const iterator = iterable[Symbol.iterator]();
		let current = iterator.next();
		
		if (current.done) {
			return null;
		}

		let maxItem = current.value;
		let maxValue = predicate(maxItem);

		while (!(current = iterator.next()).done) {
			const currentValue = predicate(current.value);
			if (currentValue > maxValue) {
			maxValue = currentValue;
			maxItem = current.value;
			}
		}

		return maxItem;
	}

	/**
	 * @description Returns the minimum element of an iterable based on a 
	 * provided predicate function.
	 * @param iterable The given {@link Iterable}.
	 * @param predicate A function that takes an element of the iterable and 
	 *                  returns a numeric value.
	 * @returns The element with the minimum numeric value as determined by the 
	 *          predicate, or `null` if the iterable is empty.
	 */
	export function minBy<T>(iterable: Iterable<T>, predicate: (value: T) => number): T | null {
		const iterator = iterable[Symbol.iterator]();
		let current = iterator.next();
		
		if (current.done) {
			return null;
		}

		let minItem = current.value;
		let minValue = predicate(minItem);

		while (!(current = iterator.next()).done) {
			const currentValue = predicate(current.value);
			if (currentValue < minValue) {
				minValue = currentValue;
				minItem = current.value;
			}
		}

		return minItem;
	}
}
