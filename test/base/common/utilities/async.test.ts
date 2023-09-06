import * as assert from 'assert';
import { ExpectedError, isCancellationError, isExpectedError } from 'src/base/common/error';
import { Emitter } from 'src/base/common/event';
import { AsyncRunner, Blocker, CancellablePromise, Debouncer, delayFor, EventBlocker, IntervalTimer, JoinablePromise, MicrotaskDelay, PromiseTimeout, repeat, Scheduler, ThrottleDebouncer, Throttler, UnbufferedScheduler } from 'src/base/common/utilities/async';
import { FakeAsync } from 'test/utils/fakeAsync';

suite('async-test', () => {

	suite('JoinablePromise', () => {
		
		test('should be able to join multiple promises', () => FakeAsync.run(async () => {
			let p1Resolved = false;
			let p2Resolved = false;
	
			const p1 = new Promise<void>(resolve => {
				setTimeout(() => {
					p1Resolved = true;
					resolve();
				}, 100);
			});
	
			const p2 = new Promise<void>(resolve => {
				setTimeout(() => {
					p2Resolved = true;
					resolve();
				}, 150);
			});
	
			const joinable = new JoinablePromise();
			joinable.join(p1);
			joinable.join(p2);
	
			const results = await joinable.allSettled();
	
			assert.strictEqual(results.length, 2);
			assert.strictEqual(p1Resolved, true);
			assert.strictEqual(p2Resolved, true);
		}));
	
		test('should return settled status for all promises', () => FakeAsync.run(async () => {
			const p1 = Promise.resolve();
			const p2 = Promise.reject();
	
			const joinable = new JoinablePromise();
			joinable.join(p1);
			joinable.join(p2);
	
			const results = await joinable.allSettled();
	
			assert.strictEqual(results[0]!.status, 'fulfilled');
			assert.strictEqual(results[1]!.status, 'rejected');
		}));
	});

    test('Blocker', () => FakeAsync.run(async () => {
        const blocker = new Blocker<boolean>();

        delayFor(0, () => blocker.resolve(true));

        const result = await blocker.waiting();
        assert.strictEqual(result, true);
    }));

	test('EventBlocker', () => FakeAsync.run(async () => {
		const emitter = new Emitter<void>();
		
		const blocker = new EventBlocker(emitter.registerListener);
		const promise = blocker.waiting();
		emitter.fire();

		await promise;

		const neverResolve = new EventBlocker(emitter.registerListener, 0);
		await neverResolve.waiting()
		.then(() => assert.fail())
		.catch(() => { /** success */ });
	}));

	test('PromiseTimeout', () => FakeAsync.run(async () => {
		let promise = Promise.resolve();
		let timeout = new PromiseTimeout(promise, 0);
		let result = await timeout.waiting();
		assert.strictEqual(result, true);

		promise = new Blocker<void>().waiting();
		timeout = new PromiseTimeout(promise, 0);
		result = await timeout.waiting();
		assert.strictEqual(result, false);
	}));

	test('Scheduler', () => FakeAsync.run(async () => {
		let cnt = 0;
		const scheduler = new Scheduler<number>(0, e => {
			cnt += e.reduce((prev, curr) => prev += curr, 0);
		});
		repeat(10, () => scheduler.schedule(1));
		await delayFor(100, () => {
			assert.strictEqual(cnt, 10);
		});

		// cancellation
		const scheduler2 = new Scheduler<number>(0, e => {
			cnt += e.reduce((prev, curr) => prev += curr, 0);
		});
		repeat(10, () => scheduler2.schedule(1));
		
		scheduler2.cancel();
		await delayFor(100, () => {
			assert.strictEqual(cnt, 10);
		});
	}));

	test('UnbufferedScheduler', () => FakeAsync.run(async () => {
		let cnt = 0;
		const scheduler = new UnbufferedScheduler<number>(0, e => {
			cnt += e;
		});
		repeat(10, () => scheduler.schedule(1));
		await delayFor(10, () => {
			assert.strictEqual(cnt, 1);
		});

		// cancellation

		const scheduler2 = new UnbufferedScheduler<number>(0, e => {
			cnt += e;
		});
		repeat(10, () => scheduler2.schedule(1));
		scheduler2.cancel();
		await delayFor(10, () => {
			assert.strictEqual(cnt, 1);
		});
	}));

    suite('AsyncRunner', () => {

        test('basic - sync', () => FakeAsync.run(async () => {
            let count = 0;
            const executor = new AsyncRunner<void>(2);
            const getNum = () => () => {
                count++;
                return Promise.resolve();
            };
    
            const promises = [executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum())];
            await Promise.all(promises);
            assert.strictEqual(count, 5);
        }));
    
        test('basic - async', () => FakeAsync.run(async () => {
            let count = 0;
            const executor = new AsyncRunner<void>(2);
            const getNum = () => async () => {
                return delayFor(0).then(() => { count++; });
            };
    
            const promises = [executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum())];
            await Promise.all(promises);
            assert.strictEqual(count, 5);
        }));
    
        test('pause / resume', () => FakeAsync.run(async () => {
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
        }));

		test('onDidFlush', () => FakeAsync.run(async () => {
			let count = 0;
			const executor = new AsyncRunner<void>(2);
			const blocker = new EventBlocker(executor.onDidFlush);
			
			executor.pause();
			repeat(5, () => executor.queue(() => delayFor(0).then(() => { count++; })));
			executor.resume();

			await blocker.waiting();
			assert.strictEqual(count, 5);
		}));

		test('waitNext', () => FakeAsync.run(async () => {
			let count = 0;
			const executor = new AsyncRunner<void>(2);
			
			executor.queue(() => delayFor(0).then(() => { count++; }));
			
			await executor.waitNext();
			assert.strictEqual(count, 1);
		}));
    });

    suite('throttler', () => {
        test('sync task', () => FakeAsync.run(async () => {
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
		}));

		test('async task', () => FakeAsync.run(async () => {
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
		}));

		test('last factory should be the one getting called', () => FakeAsync.run(async function () {
			const factoryFactory = (n: number) => async () => {
				return delayFor(0).then(() => n);
			};

			const throttler = new Throttler();

			const promises: Promise<any>[] = [];

			promises.push(throttler.queue(factoryFactory(1)).then((n) => { assert.strictEqual(n, 1); }));
			promises.push(throttler.queue(factoryFactory(2)).then((n) => { assert.strictEqual(n, 3); }));
			promises.push(throttler.queue(factoryFactory(3)).then((n) => { assert.strictEqual(n, 3); }));

			return Promise.all(promises);
		}));
    });

    suite('debouncer', function () {

		test('simple', () => FakeAsync.run(async () => {
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
		}));

		test('microtask delay simple', () => FakeAsync.run(async () => {
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
		}));

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

		test('cancel should cancel all calls to queue', () => FakeAsync.run(async () => {
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
		}));

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

		test('Constructor should properly initialize ThrottleDebouncer', () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(1000);
			assert.ok(throttleDebouncer);
		});

        test('basics', () => FakeAsync.run(async () => { // REVIEW
            let cnt = 0;
            const task = () => cnt++;
            const throttleDebouncer = new ThrottleDebouncer<void>(0);
            
			const promises = new JoinablePromise();
			
			promises
			.join(throttleDebouncer.queue(async () => { if (!cnt) { task(); } else { throw new Error(); } }))
			.join(throttleDebouncer.queue(async () => { if (cnt === 1) { task(); } else { throw new Error(); } }))
			.join(throttleDebouncer.queue(async () => { if (cnt === 2) { task(); } else { throw new Error(); } }));

			await promises.allSettled();
        }));

        test('promise should resolve if disposed', () => FakeAsync.run(async () => {
            const throttleDebouncer = new ThrottleDebouncer<void>(100);
            const promise = throttleDebouncer.queue(async () => { }, 0);
            throttleDebouncer.dispose();

			await assert.rejects(() => promise);
        }));

		test('queue should return a promise', () => FakeAsync.run(async () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(1000);
			const task = () => Promise.resolve(1);
			const result = await throttleDebouncer.queue(task);
			assert.strictEqual(result, 1);
		}));
	
		test('queue should respect delay', () => FakeAsync.run(async () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(1000);
			const task = () => Promise.resolve(1);
			
			const startTime = Date.now();
			await throttleDebouncer.queue(task, 2000);
			const endTime = Date.now();
	
			assert.ok(endTime - startTime >= 2000);
		}));
	
		test('onSchedule should return false if no task is scheduled', () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(1000);
			assert.strictEqual(throttleDebouncer.onSchedule(), false);
		});
	
		test('onSchedule should return true if a task is scheduled', () => FakeAsync.run(async () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(1000);
			const task = () => Promise.resolve(1);
			const promise = throttleDebouncer.queue(task);
			assert.strictEqual(throttleDebouncer.onSchedule(), true);
			assert.strictEqual(await promise, 1);
		}));
	
		test('unschedule should cancel a scheduled task', () => FakeAsync.run(async () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(1000);
			let taskExecuted = false;
			const task = () => { 
				taskExecuted = true;
				return Promise.resolve(1);
			};
			
			const promise = throttleDebouncer.queue(task, 2000);
			throttleDebouncer.unschedule();
			await assert.rejects(() => promise);
			
			assert.strictEqual(taskExecuted, false);
		}));
	
		test('dispose should release resources', () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(1000);
			throttleDebouncer.dispose();
		});
    });

	test('CancellablePromise - cancel', () => FakeAsync.run(async () => {
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
	}));

	test('CancellablePromise - await cancel', () => FakeAsync.run(async () => {
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
	}));

	test("repeat function should call the provided function the specified number of times", function() {
        let count = 0;
        repeat(5, (index: number) => {
            assert.equal(index, count);
            count++;
        });
        assert.equal(count, 5);
    });

	test("IntervalTimer should call the callback at a set interval", () => FakeAsync.run(async () => {
            let count = 0;
            const timer = new IntervalTimer();
            timer.set(1000, () => {
                count++;
                if (count === 3) {
                    timer.cancel();
                }
            });
            await new Promise(resolve => setTimeout(resolve, 3000));
            assert.equal(count, 3);
	}));

    test("IntervalTimer should stop calling the callback after cancel", () => FakeAsync.run(async () => {
		let count = 0;
		const timer = new IntervalTimer();
		timer.set(1000, () => {
			count++;
			if (count === 2) {
				timer.cancel();
			}
		});
		await new Promise(resolve => setTimeout(resolve, 3500));
		assert.equal(count, 2);
    }));

    test("IntervalTimer should cancel the current timer when setting a new one", () => FakeAsync.run(async () => {
		let count = 0;
        const timer = new IntervalTimer();
        timer.set(1000, () => {
			count++;
		});
		timer.set(2000, () => {
			count++;
			if (count === 2) {
				timer.cancel();
			}
		});
        await new Promise(resolve => setTimeout(resolve, 2500));
        assert.equal(count, 2); // The callback should be invoked twice
    }));
});