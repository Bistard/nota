import { IDisposable } from "src/base/common/dispose";
import { URI } from "src/base/common/files/uri";
import { Pair } from "src/base/common/utilities/type";

/**
 * @description Transforms an array of elements into a Map by applying a 
 * callback function to each element of the array.
 * @param arr The array of elements to be transformed.
 * @param map The Map to which the transformed elements will be added.
 * @param onEach This function is applied to each element of the array, and the 
 * 				 results are added to the Map.
 */
export function fillMapFromArray<T, TKey, TValue>(arr: T[], map: Map<TKey, TValue>, onEach: (element: T) => Pair<TKey, TValue>): void {
	for (const element of arr) {
		const [key, value] = onEach(element);
		map.set(key, value);
	}
}

export type ResourceMapToKeyFn = (resource: URI) => string;
const DEFAULT_MAP_TO_KEY_FN = (resource: URI) => URI.toString(resource);

/**
 * @class {@link ResourceMap} is a utility class that provides Map-like 
 * functionality but uses URIs as keys. This is especially useful when you need 
 * to store resources and need a performant way to lookup based on their URIs.
 * It internally uses a JavaScript Map to store key-value pairs.
 * 
 * A function can be passed to the constructor to define the transformation
 * applied to the URI to produce the string used as a key internally.
 */
export class ResourceMap<T> implements Map<URI, T>, IDisposable {

    // [fields]

	public readonly [Symbol.toStringTag] = 'ResourceMap';
	private readonly _map: Map<string, { resource: URI, value: T }>;
	private readonly _toKey: ResourceMapToKeyFn;

    // [constructor]

	constructor(toKey?: ResourceMapToKeyFn) {
        this._map = new Map();
        this._toKey = toKey ?? DEFAULT_MAP_TO_KEY_FN;
	}

    // [public methods]

    get size(): number {
		return this._map.size;
	}

	public set(resource: URI, value: T): this {
		this._map.set(this._toKey(resource), { resource, value });
		return this;
	}

	public get(resource: URI): T | undefined {
		return this._map.get(this._toKey(resource))?.value;
	}

	public has(resource: URI): boolean {
		return this._map.has(this._toKey(resource));
	}

	public delete(resource: URI): boolean {
		return this._map.delete(this._toKey(resource));
	}

	public forEach(cb: (value: T, key: URI, map: Map<URI, T>) => void, thisArg?: any): void {
		if (typeof thisArg !== 'undefined') {
			cb = cb.bind(thisArg);
		}
		for (const [_, entry] of this._map) {
			cb(entry.value, entry.resource, <any>this);
		}
	}

    public clear(): void {
		this._map.clear();
	}

	public dispose(): void {
		this.clear();
	}

	public *values(): IterableIterator<T> {
		for (const entry of this._map.values()) {
			yield entry.value;
		}
	}

	public *keys(): IterableIterator<URI> {
		for (const entry of this._map.values()) {
			yield entry.resource;
		}
	}

	public *entries(): IterableIterator<[URI, T]> {
		for (const entry of this._map.values()) {
			yield [entry.resource, entry.value];
		}
	}

	public *[Symbol.iterator](): IterableIterator<[URI, T]> {
		for (const [, entry] of this._map) {
			yield [entry.resource, entry.value];
		}
	}
}

export class ResourceSet implements Set<URI> {

	// [field]

	public readonly [Symbol.toStringTag]: string = 'ResourceSet';
	private readonly _map: ResourceMap<URI>;

	// [constructor]

	constructor(toKey?: ResourceMapToKeyFn);
	constructor(entries: readonly URI[], toKey?: ResourceMapToKeyFn);
	constructor(entriesOrKey?: readonly URI[] | (ResourceMapToKeyFn), toKey?: ResourceMapToKeyFn) {
		if (!entriesOrKey || typeof entriesOrKey === 'function') {
			this._map = new ResourceMap(entriesOrKey);
		} else {
			this._map = new ResourceMap(toKey);
			for (const entry of entriesOrKey) {
                this.add(entry);
            }
		}
	}

	// [public methods]

	get size(): number {
		return this._map.size;
	}

	public add(value: URI): this {
		this._map.set(value, value);
		return this;
	}

	public clear(): void {
		this._map.clear();
	}

	public delete(value: URI): boolean {
		return this._map.delete(value);
	}

	public forEach(cb: (value: URI, value2: URI, set: Set<URI>) => void, thisArg?: any): void {
		this._map.forEach((_value, key) => cb.call(thisArg, key, key, this));
	}

	public has(value: URI): boolean {
		return this._map.has(value);
	}

	public entries(): IterableIterator<[URI, URI]> {
		return this._map.entries();
	}

	public keys(): IterableIterator<URI> {
		return this._map.keys();
	}

	public values(): IterableIterator<URI> {
		return this._map.keys();
	}

	public [Symbol.iterator](): IterableIterator<URI> {
		return this.keys();
	}
}