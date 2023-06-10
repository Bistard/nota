import * as assert from 'assert';
import { Disposable, DisposableManager, disposeAll, MultiDisposeError, AutoDisposableWrapper, toDisposable } from 'src/base/common/dispose';

suite('dispose-test', () => {

    test('dispose single disposable', () => {
		const disposable = new Disposable();

		assert.ok(!disposable.isDisposed());

		disposable.dispose();

		assert.ok(disposable.isDisposed());
	});

	test('dispose disposable array', () => {
		const disposable = new Disposable();
		const disposable2 = new Disposable();

		assert.ok(!disposable.isDisposed());
		assert.ok(!disposable2.isDisposed());

		disposeAll([disposable, disposable2]);

		assert.ok(disposable.isDisposed());
		assert.ok(disposable2.isDisposed());
	});

	test('dispose disposables', () => {
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
		const disposable = new DisposableManager();
		
		const disposable2 = new Disposable();
		const disposable3 = new DisposableManager();

		disposable.register(disposable2);
		disposable.register(disposable3);

		const disposable4 = new Disposable();
		disposable3.register(disposable4);

		disposable.dispose();

		assert.ok(disposable.disposed);
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
		assert.ok(thrownError instanceof MultiDisposeError);
		assert.strictEqual((thrownError as MultiDisposeError).errors.length, 2);
		assert.strictEqual((thrownError as MultiDisposeError).errors[0].message, 'I am error 1');
		assert.strictEqual((thrownError as MultiDisposeError).errors[1].message, 'I am error 2');
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
		assert.ok(thrownError instanceof MultiDisposeError);
		assert.strictEqual((thrownError as MultiDisposeError).errors.length, 2);
		assert.strictEqual((thrownError as MultiDisposeError).errors[0].message, 'I am error 1');
		assert.strictEqual((thrownError as MultiDisposeError).errors[1].message, 'I am error 2');
	});

	test('AutoDisposableWrapper', () => {

		const obj1 = new Disposable();
		const obj2 = new Disposable();
		const obj3 = new Disposable();

		const wrapper = new AutoDisposableWrapper();
		wrapper.setObject(obj1);
		
		assert.ok(!obj1.isDisposed());
		assert.ok(!obj2.isDisposed());

		wrapper.detach();

		assert.ok(!obj1.isDisposed());
		assert.ok(!obj2.isDisposed());

		wrapper.setObject(obj1);

		assert.ok(!obj1.isDisposed());
		assert.ok(!obj2.isDisposed());

		wrapper.setObject(obj2);

		assert.ok(obj1.isDisposed());
		assert.ok(!obj2.isDisposed());

		wrapper.setObject(obj3);

		assert.ok(obj1.isDisposed());
		assert.ok(obj2.isDisposed());

		wrapper.dispose();

		assert.ok(obj3.isDisposed());
	});

	test('AutoDisposableWrapper - binding children to the current object', () => {

		const obj1 = new Disposable();
		const obj2 = new Disposable();
		const child1 = new Disposable();
		const child2 = new Disposable();

		const wrapper = new AutoDisposableWrapper();
		wrapper.setObject(obj1);
		wrapper.setChildren(child1);
		wrapper.setChildren(child2);
		
		assert.ok(!obj1.isDisposed());
		assert.ok(!child1.isDisposed());
		assert.ok(!child2.isDisposed());

		wrapper.setObject(obj2);

		assert.ok(obj1.isDisposed());
		assert.ok(!obj2.isDisposed());
		assert.ok(child1.isDisposed());
		assert.ok(child2.isDisposed());
	});
});