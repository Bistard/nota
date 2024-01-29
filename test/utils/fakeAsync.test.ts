import * as assert from 'assert';
import { INSTANT_TIME } from 'src/base/common/date';
import { delayFor } from 'src/base/common/utilities/async';
import { FakeAsync, IFakeAsyncOptions } from 'test/utils/fakeAsync';
import { FakeConsole } from 'test/utils/fakeConsole';

suite('FakeAsync-test', () => {
		
    test('fake the function execution when fake timers are enabled', async () => {
        let fakeElapsedTime: number = undefined!;
        
        const elapseTarget = 5000;
        const fn = async () => { 
            const fakeStartTime = Date.now();
            setTimeout(() => {
                const fakeEndTime = Date.now();
                fakeElapsedTime = fakeEndTime - fakeStartTime;
            }, elapseTarget);
        };

        const realStartTime = Date.now();
        await FakeAsync.run(fn);
        const realEndTime = Date.now();
        
        /**
         * In the perspective of a callback function, it should passed 
         * {@link elapseTarget} of time.
         */
        assert.strictEqual(fakeElapsedTime, elapseTarget, 'function should elapsed in exact of the given time.');
        
        /**
         * Since we're using a fake timer, 'fn' should be called almost 
         * immediately.
         */
        assert.ok((realEndTime - realStartTime) < 50, "Function was not called immediately with fake timer.");
    });

    test('clearTimeout before executed', async () => {
        let counter = 0;
        const handler = async () => {
            const token = setTimeout(() => counter++, 0);
            clearTimeout(token);
        };
        await FakeAsync.run(handler);
        assert.strictEqual(counter, 0);
    });

    test('run function with enable option false', async () => {
        let counter = 0;
        const incrementCounter = async () => delayFor(INSTANT_TIME, () => counter++);
        await FakeAsync.run(incrementCounter, { enable: false });
        assert.strictEqual(counter, 1);
    });

    test('run function with enable option true', async () => {
        let counter = 0;
        const incrementCounter = async () => delayFor(INSTANT_TIME, () => counter++);
        await FakeAsync.run(incrementCounter, { enable: true });
        assert.strictEqual(counter, 1);
    });

    test('run function with default error handling', async () => {
        const errorFunction = () => { throw new Error('Test error'); };
        
        // default 
        try {
            await FakeAsync.run(errorFunction);
        } catch (err: any) {
            assert.strictEqual(err.message, 'Test error');
        }

        // false
        try {
            await FakeAsync.run(errorFunction, { onError: false });
        } catch (err: any) {
            assert.strictEqual(err.message, 'Test error');
        }
    });

    test('run function with true error handling', async () => {
        let errorMessage: any;
        FakeConsole.enable({ 
            onLog: (message) => errorMessage = message
        });
        
        const errorFunction = () => { throw new Error('Test error'); };
        await FakeAsync.run(errorFunction, { onError: true });
        assert.strictEqual(errorMessage.message, 'Test error');

        FakeConsole.disable();
    });

    test('run function with custom error handling', async () => {
        const errorFunction = () => { throw new Error('Test error'); };
        let caughtError: any;
        const options: IFakeAsyncOptions = {
            onError: (err: any) => { caughtError = err; }
        };
        await FakeAsync.run(errorFunction, options);
        assert.strictEqual(caughtError.message, 'Test error');
    });

    test('make sure all tasks are executed',async () => {
        let cn = 0;
        const fn = async () => {
            for (let i = 0; i < 10; i++) {
                setTimeout(() => cn++, 100000 + i);
            }
        };

        await FakeAsync.run(fn);

        assert.strictEqual(cn, 10);
    });

    test('pass arguments through FakeAsync', async () => {

        let ans = 0;
        const fn = async (arg: number) => {
            ans = arg;
        };

        await FakeAsync.run(fn, { arguments: [42] });

        assert.strictEqual(ans, 42);
    });
});