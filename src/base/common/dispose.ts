import { errorToMessage, panic } from "src/base/common/utilities/panic";
import { isFunction, isObject } from "src/base/common/utilities/type";

/**
 * Calling {@link dispose()} will dispose all the resources that belongs to that
 * object. Ideally all the attributes and methods of that object is no longer
 * functional.
 */
export interface IDisposable {
	dispose(): void;
}

export type IterableDisposable<T extends IDisposable> = IterableIterator<T> | Array<T>;

/**
 * @readonly The lifecycle of a disposable object is controlled by the client. A
 * disposable object can be registered into another disposable object.
 * 
 * Calling `this.dispose()` will dispose the object and all its registered ones. 
 * The client might need to implement their own `this.dispose()` method by 
 * overriding to make sure that all the resources are disposed properly.
 * 
 * Essentially the idea of implementing a new `this.dispose()` method is to 
 * reduce the reference count of all the resources to zero and then the garbage 
 * collection will do the rest of the jobs for us.
 * 
 * @note When overriding `this.dispose()` method, remember to to call 
 * `super.dispose() ` at somewhere.
 */
export class Disposable implements IDisposable {

	public static readonly NONE = Object.freeze<IDisposable>({ dispose() { } });

	private readonly _disposableManager = new DisposableManager();

	constructor() {}

	/** 
	 * @description Disposes all the registered objects. If the object is already 
	 * disposed, nothing will happen.
	 */
	public dispose(): void {
		this._disposableManager.dispose();
	}

	/** 
	 * @description Determines if the current object is disposed already. 
	 */
	public isDisposed(): boolean {
		return this._disposableManager.disposed;
	}

	/**
	 * @description Try to register a disposable object. Once this.dispose() is 
	 * invoked, all the registered disposables will be disposed.
	 * 
	 * If this object is already disposed, a console warning will be printed.
	 * If self-registering is encountered, an error will be thrown.
	 */
	protected __register<T extends IDisposable>(obj: T): T {
		if (obj && (obj as IDisposable) === this) {
			panic('cannot register the disposable object to itself');
		}
		return this._disposableManager.register(obj);
	}
}

/** @description A manager to maintain all the registered disposables. */
export class DisposableManager implements IDisposable {

	private readonly _disposables = new Set<IDisposable>();
	private _disposed = false;

	constructor() {}

	/** 
	 * @description Disposes all the registered objects and the current object. 
	 */
	public dispose(): void {
		
		// prevent double disposing
		if (this._disposed) {
			return;
		}

		// actual disposing
		this._disposed = true;
		try {
			disposeAll(this._disposables.values());
		} finally {
			// whether disposeAll throws or not, we need to clean the set.
			this._disposables.clear();
		}
	}

	get disposed(): boolean {
		return this._disposed;
	}

	/**
	 * @description Registers a disposable.
	 */
	public register<T extends IDisposable>(obj: T): T {
		
		if (obj && (obj as unknown) === this) {
			panic('cannot register the disposable object to itself');
		}

		if (this._disposed) {
			console.warn('cannot register a disposable object to a object which is already disposed');
			return obj;
		}

		this._disposables.add(obj);
		return obj;
	}
}

export function disposeAll<T extends IDisposable>(disposables: IterableDisposable<T>): void {
	const errors: any[] = [];

	/**
	 * try to dispose each object, if error is encountered, we store it and skip 
	 * it to ensure all the objects are disposed properly.
	 */
	for (const disposable of disposables) {
		try {
			disposable.dispose();
		} catch (err: any) {
			errors.push(err);
		}
	}

	// error handling
	if (errors.length === 1) {
		panic(errors[0]);
	} else if (errors.length > 1) {
		panic(`Encountered errors while disposing of multiple disposable. Errors: ${errorToMessage(errors)}`);
	}
}

export function toDisposable(fn: () => any): IDisposable {
	return {
		dispose: fn
	};
}

export function isDisposable(obj: any): obj is IDisposable {
	if (!isObject(obj)) {
		return false;
	}
	return isFunction(obj['dispose']);
}

export function tryDispose(obj: any): void {
	if (!isObject(obj)) {
		return;
	}
	if (isDisposable(obj)) {
		obj.dispose();
	}
}

/**
 * @class A disposable object that automatically cleans up its internal object 
 * upon disposal. This ensures that when the disposable value is changed, the 
 * previously held disposable is disposed of.
 * 
 * @note You may also register disposable children to the current object, those
 * children will be disposed along with the current object.
 */
export class AutoDisposable<T extends IDisposable> implements IDisposable {

	// [fields]

	private _object?: T;
	private _children: IDisposable[];
	private _disposed: boolean;

	// [constructor]

	constructor(object?: T, children?: IDisposable[]) {
		this._object = object ?? undefined;
		this._children = children ?? [];
		this._disposed = false;
	}

	// [public methods]

	public set(object: T): void {
		if (this._disposed || this._object === object) {
			return;
		}

		this._object?.dispose();
		this._object = object;
		
		this.__cleanChildren();
	}

	public get(): T {
		if (!this._object) {
			panic('[SelfCleaningWrapper] no wrapping object.');
		}
		return this._object;
	}

	public register(children: Disposable | Disposable[]): void {
		if (!this._object) {
			panic('[SelfCleaningWrapper] cannot bind children to no objects.');
		}
		
		if (!Array.isArray(children)) {
			children = [children];
		}

		this._children.push(...children);
	}

	public detach(): { obj: T, children: IDisposable[] } | undefined {
		const obj = this._object;
		this._object = undefined;
		this._children = [];
		return obj ? { obj, children: this._children } : undefined;
	}

	public dispose(): void {
		if (this._disposed) {
			return;
		}
		this._disposed = true;
		
		this._object?.dispose();
		this._object = undefined;
		
		this.__cleanChildren();
	}

	// [private helper methods]

	private __cleanChildren(): void {
		disposeAll(this._children);
		this._children.length = 0;
	}
}