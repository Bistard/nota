import * as assert from 'assert';
import { ExpectedError, isCancellationError, isExpectedError } from 'src/base/common/error';
import { Emitter } from 'src/base/common/event';
import { AsyncRunner, Blocker, CancellablePromise, Debouncer, delayFor, EventBlocker, MicrotaskDelay, PromiseTimeout, retry, Scheduler, ThrottleDebouncer, Throttler } from 'src/base/common/util/async';
import { repeat } from 'src/base/common/util/timer';

suite('async-test', () => {

    test('Blocker', async () => {
        const blocker = new Blocker<boolean>();

        delayFor(0, () => blocker.resolve(true));

        const result = await blocker.waiting();
        assert.strictEqual(result, true);
    });

	test('EventBlocker', async () => {
		const emitter = new Emitter<void>();
		
		const blocker = new EventBlocker(emitter.registerListener);
		const promise = blocker.waiting();
		emitter.fire();

		await promise;

		const neverResolve = new EventBlocker(emitter.registerListener, 0);
		await neverResolve.waiting()
		.then(() => assert.fail())
		.catch(() => { /** success */ });
	});

	test('PromiseTimeout', async () => {
		let promise = Promise.resolve();
		let timeout = new PromiseTimeout(promise, 0);
		let result = await timeout.waiting();
		assert.strictEqual(result, true);

		promise = new Blocker<void>().waiting();
		timeout = new PromiseTimeout(promise, 0);
		result = await timeout.waiting();
		assert.strictEqual(result, false);
	});

	test('Scheduler', async () => {
		let cnt = 0;
		const scheduler = new Scheduler<number>(0, e => {
			cnt += e.reduce((prev, curr) => prev += curr);
		});
		repeat(10, () => scheduler.schedule(1));
		await delayFor(10, () => {
			assert.strictEqual(cnt, 10);
		});
	});

    suite('AsyncRunner', () => {

        test('basic - sync', async () => {
            let count = 0;
            const executor = new AsyncRunner<void>(2);
            const getNum = () => () => {
                count++;
                return Promise.resolve();
            };
    
            const promises = [executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum())];
            await Promise.all(promises);
            assert.strictEqual(count, 5);
        });
    
        test('basic - async', async () => {
            let count = 0;
            const executor = new AsyncRunner<void>(2);
            const getNum = () => async () => {
                return delayFor(0).then(() => { count++; });
            };
    
            const promises = [executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum())];
            await Promise.all(promises);
            assert.strictEqual(count, 5);
        });
    
        test('pause / resume', async () => {
            let count = 0;
            const executor = new AsyncRunner<void>(2);
            const getNum = () => async () => {
                return delayFor(0).then(() => { count++; });
            };
    
            executor.pause();
            const promises = [executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum())];
            delayFor(0, () => executor.resume());
            await Promise.all(promises);
    
            assert.strictEqual(count, 5);
        });

		test('onDidFlush', async () => {
			let count = 0;
			const executor = new AsyncRunner<void>(2);
			const blocker = new EventBlocker(executor.onDidFlush);
			
			executor.pause();
			repeat(5, () => executor.queue(() => delayFor(0).then(() => { count++; })));
			executor.resume();

			await blocker.waiting();
			assert.strictEqual(count, 5);
		});

		test('waitNext', async () => {
			let count = 0;
			const executor = new AsyncRunner<void>(2);
			
			executor.queue(() => delayFor(0).then(() => { count++; }));
			
			await executor.waitNext();
			assert.strictEqual(count, 1);
		});
    });

    suite('throttler', () => {
        test('sync task', async function () {
			let count = 0;
			const factory = () => Promise.resolve(++count);

			const throttler = new Throttler();

			return Promise.all([
				throttler.queue(factory).then((result) => { assert.strictEqual(result, 1); }),
				throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); }),
				throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); }),
				throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); }),
				throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); })
			]).then(() => assert.strictEqual(count, 2));
		});

		test('async task', () => {
			let count = 0;
			const factory = () => delayFor(0).then(() => ++count);

			const throttler = new Throttler();

			return Promise.all([
				throttler.queue(factory).then((result) => { assert.strictEqual(result, 1); }),
				throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); }),
				throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); }),
				throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); }),
				throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); })
			]).then(() => {
				return Promise.all([
					throttler.queue(factory).then((result) => { assert.strictEqual(result, 3); }),
					throttler.queue(factory).then((result) => { assert.strictEqual(result, 4); }),
					throttler.queue(factory).then((result) => { assert.strictEqual(result, 4); }),
					throttler.queue(factory).then((result) => { assert.strictEqual(result, 4); }),
					throttler.queue(factory).then((result) => { assert.strictEqual(result, 4); })
				]);
			});
		});

		test('last factory should be the one getting called', function () {
			const factoryFactory = (n: number) => async () => {
				return delayFor(0).then(() => n);
			};

			const throttler = new Throttler();

			const promises: Promise<any>[] = [];

			promises.push(throttler.queue(factoryFactory(1)).then((n) => { assert.strictEqual(n, 1); }));
			promises.push(throttler.queue(factoryFactory(2)).then((n) => { assert.strictEqual(n, 3); }));
			promises.push(throttler.queue(factoryFactory(3)).then((n) => { assert.strictEqual(n, 3); }));

			return Promise.all(promises);
		});
    });

    suite('debouncer', function () {

		test('simple', async () => {
			let count = 0;
			const factory = () => {
				return Promise.resolve(++count);
			};

			const delayer = new Debouncer(0);
			const promises: Promise<any>[] = [];

			assert.ok(!delayer.onSchedule());

			promises.push(delayer.queue(factory).then((result) => { assert.strictEqual(result, 1); assert.ok(!delayer.onSchedule()); }));
			assert.ok(delayer.onSchedule());

			promises.push(delayer.queue(factory).then((result) => { assert.strictEqual(result, 1); assert.ok(!delayer.onSchedule()); }));
			assert.ok(delayer.onSchedule());

			promises.push(delayer.queue(factory).then((result) => { assert.strictEqual(result, 1); assert.ok(!delayer.onSchedule()); }));
			assert.ok(delayer.onSchedule());

			return Promise.all(promises).then(() => {
				assert.ok(!delayer.onSchedule());
			});
		});

		test('microtask delay simple', async () => {
			let count = 0;
			const factory = () => {
				return Promise.resolve(++count);
			};

			const delayer = new Debouncer(MicrotaskDelay);
			const promises: Promise<any>[] = [];

			assert.ok(!delayer.onSchedule());

			promises.push(delayer.queue(factory).then((result) => { assert.strictEqual(result, 1); assert.ok(!delayer.onSchedule()); }));
			assert.ok(delayer.onSchedule());

			promises.push(delayer.queue(factory).then((result) => { assert.strictEqual(result, 1); assert.ok(!delayer.onSchedule()); }));
			assert.ok(delayer.onSchedule());

			promises.push(delayer.queue(factory).then((result) => { assert.strictEqual(result, 1); assert.ok(!delayer.onSchedule()); }));
			assert.ok(delayer.onSchedule());

			return Promise.all(promises).then(() => {
				assert.ok(!delayer.onSchedule());
			});
		});

		test('simple cancel', function () {
			let count = 0;
			const factory = () => {
				return Promise.resolve(++count);
			};

			const delayer = new Debouncer(0);

			assert.ok(!delayer.onSchedule());

			const p = delayer.queue(factory).then(() => {
				assert.ok(false);
			}, () => {
				assert.ok(true, 'yes, it was cancelled');
			});

			assert.ok(delayer.onSchedule());
			delayer.unschedule();
			assert.ok(!delayer.onSchedule());

			return p;
		});

		test('simple cancel microtask', function () {
			let count = 0;
			const factory = () => {
				return Promise.resolve(++count);
			};

			const delayer = new Debouncer(MicrotaskDelay);

			assert.ok(!delayer.onSchedule());

			const p = delayer.queue(factory).then(() => {
				assert.ok(false);
			}, () => {
				assert.ok(true, 'yes, it was cancelled');
			});

			assert.ok(delayer.onSchedule());
			delayer.unschedule();
			assert.ok(!delayer.onSchedule());

			return p;
		});

		test('cancel should cancel all calls to queue', function () {
			let count = 0;
			const factory = () => {
				return Promise.resolve(++count);
			};

			const delayer = new Debouncer(0);
			const promises: Promise<any>[] = [];

			assert.ok(!delayer.onSchedule());

			promises.push(delayer.queue(factory).then(undefined, () => { assert.ok(true, 'yes, it was cancelled'); }));
			assert.ok(delayer.onSchedule());

			promises.push(delayer.queue(factory).then(undefined, () => { assert.ok(true, 'yes, it was cancelled'); }));
			assert.ok(delayer.onSchedule());

			promises.push(delayer.queue(factory).then(undefined, () => { assert.ok(true, 'yes, it was cancelled'); }));
			assert.ok(delayer.onSchedule());

			delayer.unschedule();

			return Promise.all(promises).then(() => {
				assert.ok(!delayer.onSchedule());
			});
		});

		test('queue, cancel, then queue again', function () {
			let count = 0;
			const factory = () => {
				return Promise.resolve(++count);
			};

			const delayer = new Debouncer(0);
			let promises: Promise<any>[] = [];

			assert.ok(!delayer.onSchedule());

			const p = delayer.queue(factory).then((result) => {
				assert.strictEqual(result, 1);
				assert.ok(!delayer.onSchedule());

				promises.push(delayer.queue(factory).then(undefined, () => { assert.ok(true, 'yes, it was cancelled'); }));
				assert.ok(delayer.onSchedule());

				promises.push(delayer.queue(factory).then(undefined, () => { assert.ok(true, 'yes, it was cancelled'); }));
				assert.ok(delayer.onSchedule());

				delayer.unschedule();

				const p = Promise.all(promises).then(() => {
					promises = [];

					assert.ok(!delayer.onSchedule());

					promises.push(delayer.queue(factory).then(() => { assert.strictEqual(result, 1); assert.ok(!delayer.onSchedule()); }));
					assert.ok(delayer.onSchedule());

					promises.push(delayer.queue(factory).then(() => { assert.strictEqual(result, 1); assert.ok(!delayer.onSchedule()); }));
					assert.ok(delayer.onSchedule());

					const p = Promise.all(promises).then(() => {
						assert.ok(!delayer.onSchedule());
					});

					assert.ok(delayer.onSchedule());

					return p;
				});

				return p;
			});

			assert.ok(delayer.onSchedule());

			return p;
		});

		test('last task should be the one getting called', function () {
			const factoryFactory = (n: number) => () => {
				return Promise.resolve(n);
			};

			const delayer = new Debouncer(0);
			const promises: Promise<any>[] = [];

			assert.ok(!delayer.onSchedule());

			promises.push(delayer.queue(factoryFactory(1)).then((n) => { assert.strictEqual(n, 3); }));
			promises.push(delayer.queue(factoryFactory(2)).then((n) => { assert.strictEqual(n, 3); }));
			promises.push(delayer.queue(factoryFactory(3)).then((n) => { assert.strictEqual(n, 3); }));

			const p = Promise.all(promises).then(() => {
				assert.ok(!delayer.onSchedule());
			});

			assert.ok(delayer.onSchedule());

			return p;
		});
	});

    suite('throttleDebouncer', () => {

        test('simple', async () => {
            let cnt = 0;
            const task = () => cnt++;
            const throttleDebouncer = new ThrottleDebouncer<void>(0);
            throttleDebouncer.queue(async () => { if (!cnt) { task(); } else { throw ''; } }, 0);
            throttleDebouncer.queue(async () => { if (cnt === 1) { task(); } else { throw ''; } }, 0);
            throttleDebouncer.queue(async () => { if (cnt === 2) { task(); } else { throw ''; } }, 0);
        });

        test('promise should resolve if disposed', async () => {
            const throttleDebouncer = new ThrottleDebouncer<void>(100);
            const promise = throttleDebouncer.queue(async () => { }, 0);
            throttleDebouncer.dispose();

            try {
                await promise;
                assert.fail(void 0);
            } catch (err) {
                assert.ok(1);
            }
        });
    });

	test('CancellablePromise - cancel', async () => {
		const promise = new CancellablePromise(async (token) => {
			token.cancel();
		});

		try {
			await promise
			.then(() => assert.fail('should be cancelled'))
			.catch((err) => assert.ok(isCancellationError(err)))
			.finally(() => { throw new ExpectedError(); });
		} catch (error) {
			assert.ok(isExpectedError(error));
			return;
		}
		
		assert.fail('should not reach');
	});

	test('CancellablePromise - await cancel', async () => {
		const number = await new CancellablePromise(async (token) => 5);
		assert.strictEqual(number, 5);

		let isCancelled = false;
		try {
			await new CancellablePromise(async (token) => token.cancel());
			assert.fail('should not reach');
		} 
		catch (err) {
			isCancelled = isCancellationError(err);
		} 
		finally {
			assert.ok(isCancelled);
		}
	});
});
