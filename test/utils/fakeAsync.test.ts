import * as assert from 'assert';
import { delayFor } from 'src/base/common/util/async';
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
        assert.ok((realEndTime - realStartTime) < 20, "Function was not called immediately with fake timer.");
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
        const incrementCounter = async () => delayFor(0, () => counter++);
        await FakeAsync.run(incrementCounter, { enable: false });
        assert.strictEqual(counter, 1);
    });

    test('run function with enable option true', async () => {
        let counter = 0;
        const incrementCounter = async () => delayFor(0, () => counter++);
        await FakeAsync.run(incrementCounter, { enable: true });
        assert.strictEqual(counter, 1);
    });

    test('run function with default error handling', async () => {
        let errorMessage: any;
        FakeConsole.enable({ 
            onLog: (message) => errorMessage = message
        });
        
        const errorFunction = () => { throw new Error('Test error'); };
        await FakeAsync.run(errorFunction);
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
});