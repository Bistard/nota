
export interface IDisposable {
	dispose(): void;
}

/**
 * @readonly The lifecyle of a disposable object is controlled by the client. A
 * disposable object can be registered into another disposable object.
 * 
 * Calling this.dispose() will dispose the object and all its registered ones. 
 * The client requires to implement their own this.dispose() method by overriding 
 * to make sure that all the resources are disposed properly.
 * 
 * Essentially the idea of implementing a new this.dispose() method is to reduce 
 * the reference count of all the resources to zero and then the garbage 
 * collection will do the rest of the jobs for us.
 * 
 * @note When overriding this.dispose() method, remember to to call super.dispose() 
 * at somewhere.
 */
export class Disposable implements IDisposable {

	static readonly NONE = Object.freeze<IDisposable>({ dispose() { } });

	private _disposableManager = new DisposableManager();

	constructor() {}

	/** 
	 * @description Disposes all the registered objects. If the object is already 
	 * disposed, nothing will happen.
	 */
	public dispose(): void {
		this._disposableManager.dispose();
	}

	/** @description Determines if the current object is disposed already. */
	public isDisposed(): boolean {
		return this._disposableManager.disposed;
	}

	/**
	 * @description Trys to register a disposable object. Once this.dispose() is 
	 * invoked, all the registered disposables will be disposed.
	 * 
	 * If this object is already disposed, a console warning will be printed.
	 * If self-registering is encountered, an error will be thrown.
	 */
	protected __register<T extends IDisposable>(obj: T): T {
		if (obj && (obj as any as Disposable) === this) {
			throw new Error('cannot register the disposable object to itself');
		}
		return this._disposableManager.register(obj);
	}
}

/** @description A manager to maintain all the registered disposables. */
export class DisposableManager implements IDisposable {

	private _disposables = new Set<IDisposable>();
	public disposed = false;

	constructor() {}

	/** @description Disposes all the registered objects and the current object. */
	public dispose(): void {
		
		// prevent double disposing
		if (this.disposed) {
			return;
		}

		// actual disposing
		this.disposed = true;
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
		
		if (obj && (obj as any as DisposableManager) === this) {
			throw new Error('cannot register the disposable object to itself');
		}

		if (this.disposed) {
			console.warn('cannot register a disposable object to a object which is already disposed');
			return obj;
		}

		this._disposables.add(obj);
		return obj;
	}

}

/*******************************************************************************
 * Helper Functions
 ******************************************************************************/

export type IterableDisposable<T> = IterableIterator<T> | Array<T>;

export class MultiDisposeError extends Error {
	constructor(
		public readonly errors: any[]
	) {
		super(`Encountered errors while disposing of store. Errors: [${errors.join(', ')}]`);
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
		} catch (err) {
			errors.push(err as any);
		}
	}

	// error handling
	if (errors.length === 1) {
		throw errors[0];
	} else if (errors.length > 1) {
		throw new MultiDisposeError(errors);
	}
}

/**
 * @description Transfer a given function into a disposable object. The dispose()
 * method is the given function.
 */
export function toDisposable(fn: () => any): IDisposable {
	return {
		dispose: fn
	} as IDisposable;
}