import { Time } from "src/base/common/date";
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

export let disposableMonitor: IDisposableMonitor | undefined = undefined;
export function monitorPotentialDisposableLeak(enable?: boolean): void {
	if (!enable) {
		return;
    }
	console.warn('[monitorPotentialDisposableLeak] enabled');
	disposableMonitor = new DisposableMonitor();
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

	constructor() {
		disposableMonitor?.track(this);
		disposableMonitor?.bindToParent(this._disposableManager, this);
	}

	/** 
	 * @description Disposes all the registered objects. If the object is already 
	 * disposed, nothing will happen.
	 */
	public dispose(): void {
		disposableMonitor?.markAsDisposed(this);
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

	constructor() {
		disposableMonitor?.track(this);
	}

	/** 
	 * @description Disposes all the registered objects and the current object. 
	 */
	public dispose(): void {
		// prevent double disposing
		if (this._disposed) {
			return;
		}

		disposableMonitor?.markAsDisposed(this);

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

		disposableMonitor?.bindToParent(obj, this);
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
	const disposable = {
		dispose: () => {
			disposableMonitor?.markAsDisposed(disposable);
			fn();
		}
	};
	disposableMonitor?.track(disposable);
	return disposable;
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
		
		disposableMonitor?.track(this);
		this.__trackDisposable(object, children);
	}

	// [public methods]

	public set(object: T): void {
		if (this._disposed || this._object === object) {
			return;
		}

		this._object?.dispose();
		this._object = object;
		
		this.__cleanChildren();
		this.__trackDisposable(object, undefined);
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
		this.__trackDisposable(undefined, children);
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
		disposableMonitor?.markAsDisposed(this);
		
		this._object?.dispose();
		this._object = undefined;
		
		this.__cleanChildren();
	}

	// [private helper methods]

	private __cleanChildren(): void {
		disposeAll(this._children);
		this._children.length = 0;
	}

	private __trackDisposable(object?: any, children?: any[]): void {
		object && disposableMonitor?.bindToParent(object, this);
		children && disposableMonitor && children.forEach(child => disposableMonitor!.bindToParent(child, this));
	}
}

/**
 * A basic monitor to help detect potential memory leaks of {@link IDisposable} 
 * objects.
 * 
 * By default, when an {@link IDisposable} is tracked via {@link track}, we 
 * record its creation stack trace and schedule a check 5 seconds later. If at 
 * that time the disposable has not been:
 *   1. Marked as disposed (via {@link markAsDisposed}), or
 *   2. Bound to a parent disposable (via {@link bindToParent}),
 * we log the original stack trace to indicate a possible leaking disposable.
 * 
 * # Why Use a Delay?
 * In many cases, disposables are properly bound or disposed shortly after they 
 * are created. This may occur asynchronously or in a deferred manner. Using a 
 * small time delay (5 seconds) helps avoid noisy false positives for cases 
 * where we know the disposable will soon be disposed or registered under a parent.
 * 
 * # Tree-Like Hierarchy
 * We can think of disposables forming a tree where each disposable may have 
 * multiple child disposables that it manages. For instance:
 * ```
 *  rootDisposable
 *  ├─ childDisposable1
 *  │   └─ grandchildDisposable
 *  ├─ childDisposable2
 *  └─ childDisposable3
 * ```
 * - If the `rootDisposable` is disposed, all its children (and grandchildren, etc.) 
 * 		are also disposed.
 * - If a disposable is never attached to a parent and never disposed, it remains 
 * 		“rooted” in memory and thus might cause a memory leak. This monitor 
 * 		attempts to detect **EXACTLY** that scenario.
 * - An untracked disposable doesn’t ALWAYS mean a true leak — sometimes it’s 
 * 		expected that it lives for the duration of the application. You should 
 * 		review all warnings manually.
 * 
 * @example
 * // Usage:
 * const monitor = new DisposableMonitor();
 * 
 * const d = toDisposable(() => console.log('clean up resources'));
 * monitor.track(d); // start monitoring
 * 
 * // If d is not disposed or bound to a parent within 5s, a potential leak warning is logged.
 */
export interface IDisposableMonitor {
	/**
	 * Is called on construction of a disposable.
	 */
	track(disposable: IDisposable): void;

	/**
	 * Is called when a disposable is registered as child of another disposable (e.g. {@link DisposableStore}).
	 */
	bindToParent(child: IDisposable, parent: IDisposable | null): void;

	/**
	 * Is called after a disposable is disposed.
	 */
	markAsDisposed(disposable: IDisposable): void;
}

/**
 * @internal
 */
class DisposableMonitor implements IDisposableMonitor {
	
	private readonly _is_tracked = '$_is_disposable_tracked_';

	public track(disposable: IDisposable): void {
		const stack = new Error('[DisposableMonitor] POTENTIAL memory leak ()').stack;
		setTimeout(() => {
			if (!(<any>disposable[this._is_tracked])) {
				console.warn(stack);
			}
		}, Time.sec(5).toMs().time);
	}
	
	public bindToParent(child: IDisposable, parent: IDisposable | null): void {
		this.__tryMarkTracked(child);
	}
	
	public markAsDisposed(disposable: IDisposable): void {
		this.__tryMarkTracked(disposable);
	}

	private __tryMarkTracked(disposable: IDisposable): void {
		if (!disposable || disposable === Disposable.NONE) {
			return;
		}
		
		try {
			(<any>disposable)[this._is_tracked] = true;
		} catch {
			/**
			 * Sometimes, assigning a new property to an object can throw errors:
			 *   - The object sealed/frozen (`Object.freeze`/`Object.seal`).
			 *   - A native object or proxy that disallows new properties.
			 *   - etc...
			 * 
			 * We use try/catch to ensure our diagnostic code doesn’t break the
			 * application if assignment fails. If this property can’t be set,
			 * we silently ignore it—this just means we might not be able to 
			 * track this particular disposable’s status.
			 */
		}
	}
}