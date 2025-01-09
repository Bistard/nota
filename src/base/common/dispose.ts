import { Time } from "src/base/common/date";
import { errorToMessage, panic } from "src/base/common/utilities/panic";
import { isFunction, isObject } from "src/base/common/utilities/type";

/**
 * Calling {@link dispose()} will dispose all the resources that belongs to that
 * object. Ideally all the attributes and methods of that object is no longer
 * functional.
 */
export interface IDisposable {
	/**
	 * Ideally, this method should release all the memory hold by this object.
	 */
	dispose(): void;
}

let monitor: IDisposableMonitor | undefined = undefined;
export function monitorDisposableLeak(enable?: boolean): void {
	if (!enable) {
		return;
    }
	console.info('[monitorDisposableLeak] enabled');
	monitor = new DisposableMonitor();

	GlobalDisposable = untrackDisposable(new class extends Disposable {
		public override dispose(): void { /** meant NOT be disposed */ }
	});
}

/**
 * A global (highest-level) disposable root that should bound with all the 
 * child disposables that are meant to share the same lifecycle with the entire
 * application.
 * 
 * @note Will be defined when the disposable memory leak check is on.
 * @note This disposable meant NOT be disposed ever.
 */
let GlobalDisposable: Disposable | undefined = undefined;

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

	// ensure no name conflicts for inheritance
	private readonly _$bucket$_ = new DisposableBucket();

	constructor() {
		monitor?.track(this);
		monitor?.bindToParent(this._$bucket$_, this);
	}

	/** 
	 * @description Disposes all the registered objects. If the object is already 
	 * disposed, nothing will happen.
	 */
	public dispose(): void {
		monitor?.markAsDisposed(this);
		this._$bucket$_.dispose();
	}

	/** 
	 * @description Determines if the current object is disposed already. 
	 */
	public isDisposed(): boolean {
		return this._$bucket$_.disposed;
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
		return this._$bucket$_.register(obj);
	}

	/**
	 * @description Make possible the client may also register disposable object
	 * publicly, ensure they share the same lifecycle.
	 */
	public register<T extends IDisposable>(obj: T): T {
		return this.__register(obj);
	}

	public release<T extends IDisposable>(obj: T): void {
		return this._$bucket$_.release(obj);
	}
}

/**
 * A lightweight container for managing multiple {@link IDisposable} objects.
 * 
 * @note
 * This class is suitable for scenarios where you want to collect a set of
 * disposables and dispose them all at once, without strictly preventing further
 * registration or re-disposal attempts. For a stricter variant, see
 * {@link DisposableBucket}.
 */
export class LooseDisposableBucket implements IDisposable {
	
	private readonly _disposables = new Set<IDisposable>();

	constructor() {
		monitor?.track(this);
	}

	public dispose(): void {
		monitor?.markAsDisposed(this);
		try {
			disposeAll(this._disposables.values());
		} finally {
			// whether disposeAll throws or not, we need to clean the set.
			this._disposables.clear();
		}
	}

	/**
	 * @description Registers a disposable.
	 */
	public register<T extends IDisposable>(obj: T): T {
		if (obj && (obj as unknown) === this) {
			panic('cannot register the disposable object to itself');
		}
		
		monitor?.bindToParent(obj, this);
		this._disposables.add(obj);
		return obj;
	}

	/**
	 * @description Releases a {@link IDisposable} from bucket and disposes of it. 
	 */
	public release<T extends IDisposable>(obj: T): void {
		if (!obj) {
			return;
		}
		if ((obj as unknown) === this) {
			return;
		}
		this._disposables.delete(obj);
		obj.dispose();
	}
}

/**
 * A stricter container for managing multiple {@link IDisposable} objects,
 * extending {@link LooseDisposableBucket} by introducing a "disposed" state.
 * 
 * @remarks
 * This class is ideal for scenarios where you want a one-time, all-or-nothing
 * dispose action. After the first dispose call, no new disposables are accepted,
 * ensuring there is a clear “end of life” for this bucket and all children.
 */
export class DisposableBucket extends LooseDisposableBucket {

	private _disposed = false;

	constructor() {
		super();
	}

	public override dispose(): void {
		// prevent double disposing
		if (this._disposed) {
			return;
		}
		super.dispose();
		this._disposed = true;
	}

	get disposed(): boolean {
		return this._disposed;
	}

	public override register<T extends IDisposable>(obj: T): T {
		if (this._disposed) {
			console.warn('cannot register a disposable object to a object which is already disposed');
			return obj;
		}
		return super.register(obj);
	}
}

export function disposeAll<T extends IDisposable>(disposables: Iterable<T>): void {
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
			monitor?.markAsDisposed(disposable);
			fn();
		}
	};
	monitor?.track(disposable);
	return disposable;
}

export function isDisposable(obj: any): obj is IDisposable {
	if (!isObject(obj)) {
		return false;
	}
	return isFunction(obj['dispose']);
}

/**
 * @description If you have a top-level (root) {@link IDisposable} whose 
 * lifecycle is:
 * 		1. manually controlled by your own logic (not registered under any other 
 * 		   {@link IDisposable}).
 * Then use this function is a proper way to handle it and make sure 
 * memory-leak monitor does not catch this as false positive.
 */
export function untrackDisposable<T extends IDisposable>(obj: T): T {
	monitor?.untrack(obj);
	return obj;
}

/**
 * @description If you have a top-level (root) {@link IDisposable} whose 
 * lifecycle is:
 * 		1. meant to share the same lifecycle with the whole application and
 * 		   should never get disposed.
 * Then use this function is a proper way to handle it and make sure 
 * memory-leak monitor does not catch this as false positive.
 */
export function asGlobalDisposable<T extends IDisposable>(obj: T): T {
	GlobalDisposable?.register(obj);
	return obj;
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

	// [constructor]

	constructor(object?: T, children?: IDisposable[]) {
		this._object = object ?? undefined;
		this._children = children ?? [];
		
		monitor?.track(this);
		this.__trackDisposable(object, children);
	}

	// [public methods]

	public set(object: T): T {
		if (this._object === object) {
			return object;
		}

		this._object?.dispose();
		this._object = object;
		
		this.__cleanChildren();
		this.__trackDisposable(object, undefined);

		return object;
	}

	public get(): T | undefined {
		return this._object;
	}

	public isSet(): boolean {
		return !!this._object;
	}

	public register(children: IDisposable | IDisposable[]): void {
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
		object && monitor?.bindToParent(object, this);
		children && monitor && children.forEach(child => monitor!.bindToParent(child, this));
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

	/**
	 * Untrack the given disposable. This is hacky way and only used when you
	 * know what you are doing.
	 */
	untrack(disposable: IDisposable): void;
}

/**
 * @internal
 */
class DisposableMonitor implements IDisposableMonitor {
	
	public static readonly IS_TRACKED = '$_is_disposable_tracked_';
	public static readonly IS_TIMEOUT = '$_is_disposable_timeout_';

	public track(disposable: IDisposable): void {
		if (disposable === Disposable.NONE) {
			return;
		}

		const { stack } = new Error('[DisposableMonitor] POTENTIAL memory leak');
		disposable[DisposableMonitor.IS_TIMEOUT] = setTimeout(() => {
			delete disposable[DisposableMonitor.IS_TIMEOUT];
			if (!disposable[DisposableMonitor.IS_TRACKED]) {
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

	public untrack(disposable: IDisposable): void {
		if (disposable === Disposable.NONE) {
			return;
		}

		disposable[DisposableMonitor.IS_TRACKED] = true;
		if (disposable[DisposableMonitor.IS_TIMEOUT]) {
			clearTimeout(disposable[DisposableMonitor.IS_TIMEOUT]);
			delete disposable[DisposableMonitor.IS_TIMEOUT];
		}
	}

	private __tryMarkTracked(disposable: IDisposable): void {
		if (!disposable || disposable === Disposable.NONE) {
			return;
		}
		
		try {
			disposable[DisposableMonitor.IS_TRACKED] = true;
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
