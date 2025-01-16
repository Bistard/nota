import * as assert from 'assert';
import { afterEach, beforeEach, setup } from 'mocha';
import { INSTANT_TIME, Time, TimeUnit } from 'src/base/common/date';
import { ExpectedError, isCancellationError, isExpectedError } from 'src/base/common/error';
import { Emitter, Event } from 'src/base/common/event';
import { AsyncRunner, Blocker, CancellablePromise, Debouncer, delayFor, EventBlocker, IntervalTimer, JoinablePromise, MicrotaskDelay, TimeoutPromise, repeat, Scheduler, ThrottleDebouncer, Throttler, UnbufferedScheduler, OngoingPromise } from 'src/base/common/utilities/async';
import { FakeAsync } from 'test/utils/fakeAsync';

suite('async-test', () => {

	test("repeat function should call the provided function the specified number of times", function() {
        let count = 0;
        repeat(5, (index: number) => {
            assert.equal(index, count);
            count++;
        });
        assert.equal(count, 5);
    });

	suite('OngoingPromise', () => {
		test('execute should execute the task when no task is pending', async () => {
			const ongoingPromise = new OngoingPromise<string>();
			const taskFn = () => Promise.resolve('task result');
			
			const result = await ongoingPromise.execute(taskFn);
	
			assert.strictEqual(result, 'task result');
		});
	
		test('execute should not execute a new task if one is already pending', async () => {
			const ongoingPromise = new OngoingPromise<string>();
			let callCount = 0;
	
			const taskFn = async () => {
				callCount++;
				return new Promise<string>(resolve => setTimeout(() => resolve('task result'), 100));
			};
	
			const promise1 = ongoingPromise.execute(taskFn);
			const promise2 = ongoingPromise.execute(taskFn);
	
			assert.strictEqual(promise1, promise2);
	
			const result = await promise1;
	
			assert.strictEqual(result, 'task result');
			assert.strictEqual(callCount, 1);
		});
	
		test('execute should reset after the task completes', async () => {
			const ongoingPromise = new OngoingPromise<string>();
			const taskFn = () => Promise.resolve('task result');
	
			await ongoingPromise.execute(taskFn);
			
			const isPending = ongoingPromise.isPending();
	
			assert.strictEqual(isPending, false);
		});
	
		test('isPending should return true when a task is pending', async () => {
			const ongoingPromise = new OngoingPromise<string>();
			const taskFn = () => new Promise<string>(resolve => setTimeout(() => resolve('task result'), 100));
	
			ongoingPromise.execute(taskFn);
	
			const isPending = ongoingPromise.isPending();
	
			assert.strictEqual(isPending, true);
		});
	
		test('isPending should return false when no task is pending', async () => {
			const ongoingPromise = new OngoingPromise<string>();
	
			const isPending = ongoingPromise.isPending();
	
			assert.strictEqual(isPending, false);
		});
	});

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

	suite('CancellablePromise', () => {

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
	});

	suite('Blocker', () => {

		test('should resolve when signaled', () => FakeAsync.run(async () => {
			const blocker = new Blocker<boolean>();
	
			delayFor(INSTANT_TIME, () => blocker.resolve(true));
	
			const result = await blocker.waiting();
			assert.strictEqual(result, true);
		}));
	
		test('should reject when signaled', () => FakeAsync.run(async () => {
			const blocker = new Blocker<number>();
	
			// Trigger the reject in a future tick
			const expectedReason = new Error("An error occurred");
			setTimeout(() => {
				blocker.reject(expectedReason);
			}, 100);
	
			await assert.rejects(() => blocker.waiting(), 'Blocker should have rejected');
		}));
	
		test('resolve() should only take effect once', () => FakeAsync.run(async () => {
			const blocker = new Blocker<number>();
	
			blocker.resolve(42);
			blocker.resolve(100); // This should have no effect
	
			const result = await blocker.waiting();
			assert.strictEqual(result, 42);
		}));
	
		test('reject() should only take effect once', () => FakeAsync.run(async () => {
			const blocker = new Blocker<number>();
			const expectedReason = new Error("An error occurred");
	
			blocker.reject(expectedReason);
			blocker.reject(new Error("Another error")); // This should have no effect
	
			await assert.rejects(() => blocker.waiting(), 'Blocker should have rejected');
		}));
	
		test('resolve() after reject() should have no effect', () => FakeAsync.run(async () => {
			const blocker = new Blocker<number>();
			const expectedReason = new Error("An error occurred");
	
			blocker.reject(expectedReason);
			blocker.resolve(42); // This should have no effect
	
			await assert.rejects(() => blocker.waiting(), 'Blocker should have rejected');
		}));
	});

	suite('EventBlocker', () => {

		test('works with Emitter', () => FakeAsync.run(async () => {
			const emitter = new Emitter<void>();
			
			const blocker = new EventBlocker(emitter.registerListener);
			const promise = blocker.waiting();
			emitter.fire();
	
			await promise;
	
			const neverResolve = new EventBlocker(emitter.registerListener, INSTANT_TIME);
			await neverResolve.waiting()
			.then(() => assert.fail())
			.catch(() => { /** success */ });
		}));

		test('should resolve when event is fired', () => FakeAsync.run(async () => {
			let callback: ((event: number) => void) | null = null;
	
			const register = (listener: (event: number) => void) => {
				callback = listener;
				return {
					dispose: () => { callback = null; }
				};
			};
	
			const eventBlocker = new EventBlocker(register);
	
			setTimeout(() => {
				if (callback) callback(42);
			}, 100);
	
			const result = await eventBlocker.waiting();
			assert.strictEqual(result, 42);
		}));
	
		test('should reject after a timeout if event is not fired', () => FakeAsync.run(async () => {
			const register = (listener: (event: number) => void) => {
				return {
					dispose: () => {}
				};
			};
	
			const eventBlocker = new EventBlocker(register, new Time(TimeUnit.Milliseconds, 100));
	
			await assert.rejects(() => eventBlocker.waiting(), (err) => err instanceof Error);
		}));
	
		test('should not reject if event is fired before timeout', () => FakeAsync.run(async () => {
			let callback: ((event: number) => void) | null = null;
	
			const register = (listener: (event: number) => void) => {
				callback = listener;
				return {
					dispose: () => { callback = null; }
				};
			};
	
			const eventBlocker = new EventBlocker(register, new Time(TimeUnit.Milliseconds, 200));
	
			setTimeout(() => {
				if (callback) callback(42);
			}, 100);
	
			const result = await eventBlocker.waiting();
			assert.strictEqual(result, 42);
		}));
	
		test('dispose() should cancel event listening and EventBlocker should rejects', () => FakeAsync.run(async () => {
			let callback: ((event: number) => void) | null = null;
	
			const register = (listener: (event: number) => void) => {
				callback = listener;
				return {
					dispose: () => { callback = null; }
				};
			};
	
			const eventBlocker = new EventBlocker(register, new Time(TimeUnit.Milliseconds, 10));
	
			eventBlocker.dispose();
			setTimeout(() => {
				callback?.(42);
			}, 11);
	
			await assert.rejects(() => eventBlocker.waiting(), (err) => err instanceof Error);
		}));
	});

	suite('TimeoutPromise', () => {
		
		test('basics', () => FakeAsync.run(async () => {
			let promise = Promise.resolve(42);
			let timeout = new TimeoutPromise<number>(promise, INSTANT_TIME);
			assert.strictEqual(await timeout.waiting(), 42);
	
			promise = new Blocker<number>().waiting();
			timeout = new TimeoutPromise(promise, new Time(TimeUnit.Milliseconds, 10));
			await assert.rejects(() => timeout.waiting(), (err) => err instanceof Error);
		}));

		// FIX: doesn't work with `FakeAsync`
		test('should resolve if inner promise resolves before timeout', async () => {
			const p = new Promise<number>((resolve) => {
				setTimeout(() => {
					resolve(42);
				}, 100);
			});
	
			const timeoutPromise = new TimeoutPromise(p, new Time(TimeUnit.Milliseconds, 200));
			const result = await timeoutPromise.waiting();
			assert.strictEqual(result, 42);
		});
	
		test('should reject with timeout error if inner promise takes too long', () => FakeAsync.run(async () => {
			const p = new Promise<number>((resolve) => {
				setTimeout(() => {
					resolve(42);
				}, 300);
			});
	
			const timeoutPromise = new TimeoutPromise(p, new Time(TimeUnit.Milliseconds, 100));
			
			try {
				await timeoutPromise.waiting();
				assert.fail("Should have rejected due to timeout");
			} catch (err: any) {
				assert.strictEqual(err.message, 'Promise is timeout');
			}
		}));
	
		test('should reject with inner promise error if it rejects before timeout', () => FakeAsync.run(async () => {
			const error = new Error('Inner promise error');
			const p = new Promise<number>((_, reject) => {
				setTimeout(() => {
					reject(error);
				}, 50);
			});
	
			const timeoutPromise = new TimeoutPromise(p, new Time(TimeUnit.Milliseconds, 200));
			await assert.rejects(() => timeoutPromise.waiting());
		}));
	
		test('should not reject or resolve if inner promise does not settle within the timeout', async () => {
			const p = new Promise<number>(() => {});
	
			const timeoutPromise = new TimeoutPromise(p, new Time(TimeUnit.Milliseconds, 100));
	
			let settled: boolean | undefined = undefined;
			timeoutPromise.waiting()
			.then(() => {
				settled = true;
			})
			.catch(() => {
				settled = false;
			});
	
			await new Promise(resolve => setTimeout(resolve, 200));  // Let it run for a while
	
			assert.strictEqual(settled, false);
		});
	});

	suite('Scheduler', () => {
		let scheduler: Scheduler<string>;
	
		const callback = (events: string[]): void => {
			bufferedEvents = events;
		};
	
		let bufferedEvents: string[] = [];
	
		setup(() => {
			scheduler = new Scheduler<string>(new Time(TimeUnit.Milliseconds, 100), callback);
			bufferedEvents = [];
		});

		afterEach(() => {
			bufferedEvents = [];
		});
	
		test('basics', () => FakeAsync.run(async () => {
			let cnt = 0;
			const scheduler = new Scheduler<number>(INSTANT_TIME, e => {
				cnt += e.reduce((prev, curr) => prev += curr, 0);
			});
			repeat(10, () => scheduler.schedule(1));
			await delayFor(new Time(TimeUnit.Milliseconds, 100), () => {
				assert.strictEqual(cnt, 10);
			});
	
			// cancellation
			const scheduler2 = new Scheduler<number>(INSTANT_TIME, e => {
				cnt += e.reduce((prev, curr) => prev += curr, 0);
			});
			repeat(10, () => scheduler2.schedule(1));
			
			scheduler2.cancel();
			await delayFor(new Time(TimeUnit.Milliseconds, 100), () => {
				assert.strictEqual(cnt, 10);
			});
		}));

		test('should schedule and execute callback after delay', () => FakeAsync.run(async () => {
			scheduler.schedule('event1');
	
			const blocker = new Blocker<void>();

			setTimeout(() => {
				assert.deepStrictEqual(bufferedEvents, ['event1']);
				blocker.resolve();
			}, 110);

			await blocker.waiting();
		}));
	
		test('should cancel previous scheduled callback', () => FakeAsync.run(async () => {
			scheduler.schedule('event1');
			scheduler.schedule('event2', true);
	
			const blocker = new Blocker<void>();

			setTimeout(() => {
				assert.deepEqual(bufferedEvents, ['event2']);
				blocker.resolve();
			}, 110);

			await blocker.waiting();
		}));
	
		test('should buffer events', () => FakeAsync.run(async () => {
			scheduler.schedule('event1');
			scheduler.schedule('event2', false, new Time(TimeUnit.Milliseconds, 50));
	
			const blocker = new Blocker<void>();

			setTimeout(() => {
				assert.deepEqual(bufferedEvents, ['event1', 'event2']);
				blocker.resolve();
			}, 110);

			await blocker.waiting();
		}));
	
		test('should clear buffer when clearBuffer is true', () => {
			scheduler.schedule('event1');
			scheduler.cancel(true);
			assert.deepEqual(bufferedEvents, []);
		});
	
		test('should execute buffered events immediately', () => {
			scheduler.schedule('event1');
			scheduler.execute();
			assert.deepEqual(bufferedEvents, ['event1']);
		});
	
		test('should indicate if a callback is scheduled', () => {
			assert.equal(scheduler.isScheduled(), false);
			scheduler.schedule('event1');
			assert.equal(scheduler.isScheduled(), true);
			scheduler.cancel();
			assert.equal(scheduler.isScheduled(), false);
		});
	
		test('should dispose properly', () => {
			scheduler.schedule('event1');
			scheduler.dispose();
			assert.equal(scheduler.isScheduled(), false);
			assert.deepEqual(bufferedEvents, []);
		});
	});

	suite('UnbufferedScheduler', () => {
		let scheduler: UnbufferedScheduler<string>;
	
		let lastEvent: string | null = null;
		let blocker: Blocker<string>;
	
		const callback = (event: string): void => {
			lastEvent = event;
			blocker.resolve(event);
		};
	
		beforeEach(() => {
			scheduler = new UnbufferedScheduler<string>(new Time(TimeUnit.Milliseconds, 100), callback);
			blocker = new Blocker<string>();
			lastEvent = null;
		});

		test('basics', () => FakeAsync.run(async () => {
			let cnt = 0;
			const scheduler = new UnbufferedScheduler<number>(INSTANT_TIME, e => {
				cnt += e;
			});
			repeat(10, () => scheduler.schedule(1));
			await delayFor(INSTANT_TIME, () => {
				assert.strictEqual(cnt, 1);
			});

			// cancellation

			const scheduler2 = new UnbufferedScheduler<number>(INSTANT_TIME, e => {
				cnt += e;
			});
			repeat(10, () => scheduler2.schedule(1));
			scheduler2.cancel();
			await delayFor(INSTANT_TIME, () => {
				assert.strictEqual(cnt, 1);
			});
		}));
	
		test('should schedule and execute callback after delay', () => FakeAsync.run(async () => {
			scheduler.schedule('event1');
			const event = await blocker.waiting();
			assert.equal(event, 'event1');
		}));
	
		test('should cancel previous scheduled callback', () => FakeAsync.run(async () => {
			scheduler.schedule('event1');
			scheduler.schedule('event2');
			const event = await blocker.waiting();
			assert.equal(event, 'event2');
		}));
	
		test('should not buffer events', () => FakeAsync.run(async () => {
			scheduler.schedule('event1');
			setTimeout(() => scheduler.schedule('event2'), 50);
			const event = await blocker.waiting();
			assert.equal(event, 'event2');
		}));
	
		test('should execute latest scheduled event', () => FakeAsync.run(async () => {
			scheduler.schedule('event1');
			setTimeout(() => scheduler.schedule('event2'), 50);
			const event = await blocker.waiting();
			assert.equal(event, 'event2');
		}));
	
		test('should indicate if a callback is scheduled', () => {
			assert.equal(scheduler.isScheduled(), false);
			scheduler.schedule('event1');
			assert.equal(scheduler.isScheduled(), true);
			scheduler.cancel();
			assert.equal(scheduler.isScheduled(), false);
		});
	
		test('should dispose properly', () => FakeAsync.run(async () => {
			scheduler.schedule('event1');
			scheduler.dispose();
			setTimeout(() => blocker.resolve('timeout'), 110);
			const event = await blocker.waiting();
			assert.equal(event, 'timeout');
			assert.equal(lastEvent, null);
		}));

		test('should return current event', () => FakeAsync.run(async () => {
			scheduler.schedule('event1');

			assert.strictEqual('event1', scheduler.currentEvent);
			await blocker.waiting();
			assert.strictEqual(undefined, scheduler.currentEvent);
		}));
	});

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
                return delayFor(INSTANT_TIME).then(() => { count++; });
            };
    
            const promises = [executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum())];
            await Promise.all(promises);
            assert.strictEqual(count, 5);
        }));
    
        test('pause / resume', () => FakeAsync.run(async () => {
            let count = 0;
            const executor = new AsyncRunner<void>(2);
            const getNum = () => async () => { count++; };
    
            executor.pause();
            const promises = [executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum()), executor.queue(getNum())];
            delayFor(INSTANT_TIME, () => executor.resume());
            await Promise.all(promises);
    
            assert.strictEqual(count, 5);
        }));

		test('onDidFlush', () => FakeAsync.run(async () => {
			let count = 0;
			const executor = new AsyncRunner<void>(2);
			const blocker = new EventBlocker(executor.onDidFlush);
			
			executor.pause();
			repeat(5, () => executor.queue(async () => { count++; }));
			executor.resume();

			await blocker.waiting();
			assert.strictEqual(count, 5);
		}));

		test('waitNext', () => FakeAsync.run(async () => {
			let count = 0;
			const executor = new AsyncRunner<void>(2);
			
			executor.queue(async () => { count++; });
			
			await executor.waitNext();
			assert.strictEqual(count, 1);
		}));

		test('onDidComplete', () => FakeAsync.run(async () => {
			let count = 0;
			const executor = new AsyncRunner<void>(2);
			
			let complete = 0;
			executor.onDidComplete(() => complete++);
			for (let i = 0; i < 10; i++) {
				executor.queue(async () => { count++; });
			}
			
			await Event.toPromise(executor.onDidFlush);
			assert.strictEqual(count, 10);
			assert.strictEqual(complete, 10);
		}));

		test('dequeue', () => FakeAsync.run(async () => {
			let count = 0;
			const executor = new AsyncRunner<void>(1);

			// the first task will pop up all the remainning tasks.
			const listen = executor.onDidComplete(() => {
				listen.dispose();
				for (let i = 0; i < executor.size; i++) {
					executor.dequeue();
				}
			});

			let curr = executor.queue(async () => { count++; });
			for (let i = 0; i < 10; i++) {
				curr = curr.then(() => executor.queue(async () => { count++; }));
			}

			await Event.toPromise(executor.onDidFlush);
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
			const factory = () => delayFor(INSTANT_TIME).then(() => ++count);

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
				return delayFor(INSTANT_TIME).then(() => n);
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

			const delayer = new Debouncer(INSTANT_TIME);
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

		test('simple cancel', () => FakeAsync.run(async function () {
			let count = 0;
			const factory = () => {
				return Promise.resolve(++count);
			};

			const delayer = new Debouncer(INSTANT_TIME);

			assert.ok(!delayer.onSchedule());

			const p = delayer.queue(factory).then(() => {
				assert.ok(false);
			}, () => {
				assert.ok(true, 'yes, it was cancelled');
			});

			assert.ok(delayer.onSchedule());
			delayer.unschedule();
			assert.ok(!delayer.onSchedule());

			await p;
		}));

		test('simple cancel microtask', () => FakeAsync.run(async function () {
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

			await p;
		}));

		test('cancel should cancel all calls to queue', () => FakeAsync.run(async () => {
			let count = 0;
			const factory = () => {
				return Promise.resolve(++count);
			};

			const delayer = new Debouncer(INSTANT_TIME);
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

			const delayer = new Debouncer(INSTANT_TIME);
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

			const delayer = new Debouncer(INSTANT_TIME);
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
			const throttleDebouncer = new ThrottleDebouncer<number>(new Time(TimeUnit.Milliseconds, 1000));
			assert.ok(throttleDebouncer);
		});

        test('basics', () => FakeAsync.run(async () => { // REVIEW
            let cnt = 0;
            const task = () => cnt++;
            const throttleDebouncer = new ThrottleDebouncer<void>(INSTANT_TIME);
            
			const promises = new JoinablePromise();
			
			promises
			.join(throttleDebouncer.queue(async () => { if (!cnt) { task(); } else { throw new Error(); } }))
			.join(throttleDebouncer.queue(async () => { if (cnt === 1) { task(); } else { throw new Error(); } }))
			.join(throttleDebouncer.queue(async () => { if (cnt === 2) { task(); } else { throw new Error(); } }));

			await promises.allSettled();
        }));

        test('promise should resolve if disposed', () => FakeAsync.run(async () => {
            const throttleDebouncer = new ThrottleDebouncer<void>(new Time(TimeUnit.Milliseconds, 100));
            const promise = throttleDebouncer.queue(async () => { }, INSTANT_TIME);
            throttleDebouncer.dispose();

			await assert.rejects(() => promise);
        }));

		test('queue should return a promise', () => FakeAsync.run(async () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(new Time(TimeUnit.Milliseconds, 1000));
			const task = () => Promise.resolve(1);
			const result = await throttleDebouncer.queue(task);
			assert.strictEqual(result, 1);
		}));
	
		test('queue should respect delay', () => FakeAsync.run(async () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(new Time(TimeUnit.Milliseconds, 1000));
			const task = () => Promise.resolve(1);
			
			const startTime = Date.now();
			await throttleDebouncer.queue(task, new Time(TimeUnit.Milliseconds, 2000));
			const endTime = Date.now();
	
			assert.ok(endTime - startTime >= 2000);
		}));
	
		test('onSchedule should return false if no task is scheduled', () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(new Time(TimeUnit.Milliseconds, 1000));
			assert.strictEqual(throttleDebouncer.onSchedule(), false);
		});
	
		test('onSchedule should return true if a task is scheduled', () => FakeAsync.run(async () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(new Time(TimeUnit.Milliseconds, 1000));
			const task = () => Promise.resolve(1);
			const promise = throttleDebouncer.queue(task);
			assert.strictEqual(throttleDebouncer.onSchedule(), true);
			assert.strictEqual(await promise, 1);
		}));
	
		test('unschedule should cancel a scheduled task', () => FakeAsync.run(async () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(new Time(TimeUnit.Milliseconds, 1000));
			let taskExecuted = false;
			const task = () => { 
				taskExecuted = true;
				return Promise.resolve(1);
			};
			
			const promise = throttleDebouncer.queue(task, new Time(TimeUnit.Milliseconds, 2000));
			throttleDebouncer.unschedule();
			await assert.rejects(() => promise);
			
			assert.strictEqual(taskExecuted, false);
		}));
	
		test('dispose should release resources', () => {
			const throttleDebouncer = new ThrottleDebouncer<number>(new Time(TimeUnit.Milliseconds, 1000));
			throttleDebouncer.dispose();
		});
    });

	suite('IntervalTimer', () => {
		test("IntervalTimer should call the callback at a set interval", () => FakeAsync.run(async () => {
            let count = 0;
            const timer = new IntervalTimer();
            timer.set(new Time(TimeUnit.Milliseconds, 1000), () => {
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
			timer.set(new Time(TimeUnit.Milliseconds, 1000), () => {
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
			timer.set(new Time(TimeUnit.Milliseconds, 1000), () => {
				count++;
			});
			timer.set(new Time(TimeUnit.Milliseconds, 2000), () => {
				count++;
				if (count === 2) {
					timer.cancel();
				}
			});
			await new Promise(resolve => setTimeout(resolve, 2500));
			assert.equal(count, 2); // The callback should be invoked twice
		}));
	});
});