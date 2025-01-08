import * as assert from 'assert';
import { Disposable, DisposableManager, disposeAll, AutoDisposable, toDisposable, LooseDisposableBucket } from 'src/base/common/dispose';

suite('dispose-test', () => {

	test('toDisposable', () => {
		let disposed: boolean = false;

		const disposable = toDisposable(() => {
			disposed = true;
		});

		assert.ok(!disposed);
		disposable.dispose();
		assert.ok(disposed);
	});

    test('dispose single disposable', () => {
		const disposable = new Disposable();

		assert.ok(!disposable.isDisposed());

		disposable.dispose();

		assert.ok(disposable.isDisposed());
	});

	test('disposeAll', () => {
		const disposable = new Disposable();
		const disposable2 = new Disposable();

		assert.ok(!disposable.isDisposed());
		assert.ok(!disposable2.isDisposed());

		disposeAll([disposable, disposable2]);

		assert.ok(disposable.isDisposed());
		assert.ok(disposable2.isDisposed());
	});

	test('dispose multiple disposables', () => {
		const disposable = new Disposable();
		const disposable2 = new Disposable();

		assert.ok(!disposable.isDisposed());
		assert.ok(!disposable2.isDisposed());

		disposable.dispose();
        disposable2.dispose();

		assert.ok(disposable.isDisposed());
		assert.ok(disposable2.isDisposed());
	});

	test('dispose recursively', () => {
		const mainDisposable = new DisposableManager();
		
		const disposable2 = new Disposable();
		const disposable3 = new DisposableManager();

		mainDisposable.register(disposable2);
		mainDisposable.register(disposable3);

		const disposable4 = new Disposable();
		disposable3.register(disposable4);

		mainDisposable.dispose();

		assert.ok(mainDisposable.disposed);
		assert.ok(disposable2.isDisposed());
		assert.ok(disposable3.disposed);
		assert.ok(disposable4.isDisposed());
	});

    test('dispose array should rethrow composite error if multiple entries throw on dispose', () => {
		const disposedValues = new Set<number>();

		let thrownError: any;
		try {
			disposeAll([
				toDisposable(() => { disposedValues.add(1); }),
				toDisposable(() => { throw new Error('I am error 1'); }),
				toDisposable(() => { throw new Error('I am error 2'); }),
				toDisposable(() => { disposedValues.add(4); }),
			]);
		} catch (e) {
			thrownError = e;
		}

		assert.ok(disposedValues.has(1));
		assert.ok(disposedValues.has(4));
		assert.ok(thrownError instanceof Error);
	});
});

suite('LooseDisposableBucket', () => {
	test('dispose() should dispose all registered disposables', () => {
		const bucket = new LooseDisposableBucket();
		const disposable1 = new Disposable();
		const disposable2 = new Disposable();

		bucket.register(disposable1);
		bucket.register(disposable2);

		bucket.dispose();

		assert.strictEqual(disposable1.isDisposed(), true);
		assert.strictEqual(disposable2.isDisposed(), true);
	});

	test('dispose() should clear all disposables from the bucket', () => {
		const bucket = new LooseDisposableBucket();
		const disposable = new Disposable();

		bucket.register(disposable);
		bucket.dispose();

		// Attempting to dispose again should not throw or affect already disposed objects
		bucket.dispose();
		assert.strictEqual(disposable.isDisposed(), true);
	});

	test('register() should add disposables to the bucket', () => {
		const bucket = new LooseDisposableBucket();
		const disposable = new Disposable();

		bucket.register(disposable);

		// Using reflection to check internal state
		assert.strictEqual((bucket as any)._disposables.has(disposable), true);
	});

	test('register() should throw an error if attempting to register itself', () => {
		const bucket = new LooseDisposableBucket();

		assert.throws(() => bucket.register(bucket), {
			message: 'cannot register the disposable object to itself',
		});
	});

	test('register() should return the registered disposable', () => {
		const bucket = new LooseDisposableBucket();
		const disposable = new Disposable();

		const returnedDisposable = bucket.register(disposable);

		assert.strictEqual(returnedDisposable, disposable);
	});

	test('dispose() should not throw if bucket is empty', () => {
		const bucket = new LooseDisposableBucket();

		assert.doesNotThrow(() => bucket.dispose());
	});
});

suite('DisposableManager-test', () => {
	
	test('dispose should call all child disposes even if a child throws on dispose', () => {
		const disposedValues = new Set<number>();

		const store = new DisposableManager();
		store.register(toDisposable(() => { disposedValues.add(1); }));
		store.register(toDisposable(() => { throw new Error('I am error'); }));
		store.register(toDisposable(() => { disposedValues.add(3); }));

		let thrownError: any;
		try {
			store.dispose();
		} catch (e) {
			thrownError = e;
		}

		assert.ok(disposedValues.has(1));
		assert.ok(disposedValues.has(3));
		assert.strictEqual(thrownError.message, 'I am error');
	});

	test('dispose should throw composite error if multiple children throw on dispose', () => {
		const disposedValues = new Set<number>();

		const store = new DisposableManager();
		store.register(toDisposable(() => { disposedValues.add(1); }));
		store.register(toDisposable(() => { throw new Error('I am error 1'); }));
		store.register(toDisposable(() => { throw new Error('I am error 2'); }));
		store.register(toDisposable(() => { disposedValues.add(4); }));

		let thrownError: any;
		try {
			store.dispose();
		} catch (e) {
			thrownError = e;
		}

		assert.ok(disposedValues.has(1));
		assert.ok(disposedValues.has(4));
		assert.ok(thrownError instanceof Error);
	});

	test('AutoDisposable - basics', () => {
		const obj1 = new Disposable();
		const obj2 = new Disposable();
		const obj3 = new Disposable();

		const wrapper = new AutoDisposable();
		wrapper.set(obj1);
		
		assert.ok(!obj1.isDisposed());
		assert.ok(!obj2.isDisposed());

		wrapper.detach();

		assert.ok(!obj1.isDisposed());
		assert.ok(!obj2.isDisposed());

		wrapper.set(obj1);

		assert.ok(!obj1.isDisposed());
		assert.ok(!obj2.isDisposed());

		wrapper.set(obj2);

		assert.ok(obj1.isDisposed());
		assert.ok(!obj2.isDisposed());

		wrapper.set(obj3);

		assert.ok(obj1.isDisposed());
		assert.ok(obj2.isDisposed());

		wrapper.dispose();

		assert.ok(obj3.isDisposed());
	});

	test('AutoDisposable - binding children to the current object', () => {

		const obj1 = new Disposable();
		const obj2 = new Disposable();
		const child1 = new Disposable();
		const child2 = new Disposable();

		const wrapper = new AutoDisposable();
		wrapper.set(obj1);
		wrapper.register(child1);
		wrapper.register(child2);
		
		assert.ok(!obj1.isDisposed());
		assert.ok(!child1.isDisposed());
		assert.ok(!child2.isDisposed());

		wrapper.set(obj2);

		assert.ok(obj1.isDisposed());
		assert.ok(!obj2.isDisposed());
		assert.ok(child1.isDisposed());
		assert.ok(child2.isDisposed());
	});
});