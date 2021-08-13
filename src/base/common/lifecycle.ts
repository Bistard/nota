
// export interface IDisposable {
// 	dispose(): void;
// }

// export function isDisposable<E extends object>(thing: E): thing is E & IDisposable {
// 	return typeof (<IDisposable>thing).dispose === 'function' && (<IDisposable>thing).dispose.length === 0;
// }

// export abstract class Disposable implements IDisposable {

// 	static readonly None = Object.freeze<IDisposable>({ dispose() { } });

// 	private readonly _store = new DisposableStore();

// 	constructor() {
// 		trackDisposable(this);
// 		setParentOfDisposable(this._store, this);
// 	}

// 	public dispose(): void {
// 		markAsDisposed(this);

// 		this._store.dispose();
// 	}

// 	protected _register<T extends IDisposable>(o: T): T {
// 		if ((o as unknown as Disposable) === this) {
// 			throw new Error('Cannot register a disposable on itself!');
// 		}
// 		return this._store.add(o);
// 	}
// }

// export class DisposableStore implements IDisposable {

// 	private _toDispose = new Set<IDisposable>();
// 	private _isDisposed = false;

// 	constructor() {
// 		trackDisposable(this);
// 	}

// 	/**
// 	 * @description Dispose of all registered disposables and mark this object 
//      * as disposed. Any future disposables added to this object will be disposed 
//      * of on `add`.
// 	 */
// 	public dispose(): void {
// 		if (this._isDisposed) {
// 			return;
// 		}

// 		markAsDisposed(this);
// 		this._isDisposed = true;
// 		this.clear();
// 	}

// 	/**
// 	 * @description Dispose of all registered disposables but do not mark this 
//      * object as disposed.
// 	 */
// 	public clear(): void {
// 		try {
// 			dispose(this._toDispose.values());
// 		} finally {
// 			this._toDispose.clear();
// 		}
// 	}

//     /**
//      * @description add the disposable object.
//      */
// 	public add<T extends IDisposable>(o: T): T {
// 		if (!o) {
// 			return o;
// 		}
// 		if ((o as unknown as DisposableStore) === this) {
// 			throw new Error('Cannot register a disposable on itself!');
// 		}

// 		setParentOfDisposable(o, this);
// 		if (this._isDisposed) {
//             console.warn('Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!');
// 		} else {
// 			this._toDispose.add(o);
// 		}

// 		return o;
// 	}
// }

// export function dispose<T extends IDisposable>(disposables: IterableIterator<T>): void;
// export function dispose<T extends IDisposable>(arg: T | IterableIterator<T> | undefined): any {
// 	if (Iterable.is(arg)) {
// 		let errors: any[] = [];

// 		for (const d of arg) {
// 			if (d) {
// 				try {
// 					d.dispose();
// 				} catch (e) {
// 					errors.push(e);
// 				}
// 			}
// 		}
// 		return Array.isArray(arg) ? [] : arg;
// 	} else if (arg) {
// 		arg.dispose();
// 		return arg;
// 	}
// }
