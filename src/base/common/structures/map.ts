import { IDisposable } from "src/base/common/dispose";
import { URI } from "src/base/common/files/uri";

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
	private readonly _toKey: (key: URI) => string;

    // [constructor]

	constructor(toKey?: (key: URI) => string) {
        this._map = new Map();
        this._toKey = toKey ?? ((resource: URI) => URI.toString(resource));
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

	public forEach(cb: (value: T, key: URI, _map: Map<URI, T>) => void, thisArg?: any): void {
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