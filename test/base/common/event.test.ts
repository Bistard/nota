import * as assert from 'assert';
import { IDisposable } from 'src/base/common/dispose';
import { Emitter } from 'src/base/common/event';

suite('event-test', () => {

    test('emitter - basic', () => {
        let counter = 0;
        const callback = (e: undefined) => {
            counter++;
        };

        const emitter = new Emitter<undefined>();

        const registration1 = emitter.registerListener(callback);
        
        emitter.fire(undefined);
        assert.strictEqual(counter, 1);

        emitter.fire(undefined);
        assert.strictEqual(counter, 2);
    });

    test('emitter - dispose listener', () => {
        let counter = 0;
        const callback = (e: undefined) => {
            counter++;
        };

        const emitter = new Emitter<undefined>();

        const registration1 = emitter.registerListener(callback);
        
        emitter.fire(undefined);
        assert.strictEqual(counter, 1);

        emitter.fire(undefined);
        assert.strictEqual(counter, 2);

        registration1.dispose();
        emitter.fire(undefined);
        assert.strictEqual(counter, 2);
    });

    test('emitter - mutiple listeners', () => {
        let counter = 0;
        const callback = (e: undefined) => {
            counter++;
        };

        const emitter = new Emitter<undefined>();

        const registration1 = emitter.registerListener(callback);
        const registration2 = emitter.registerListener(callback);

        emitter.fire(undefined);
        assert.strictEqual(counter, 2);

        registration1.dispose();
        emitter.fire(undefined);
        assert.strictEqual(counter, 3);

        registration2.dispose();
        emitter.fire(undefined);
        assert.strictEqual(counter, 3);
    });

    
    test('emitter - mutiple listeners disposables', () => {
        let counter = 0;
        const callback = (e: undefined) => {
            counter++;
        };

        const emitter = new Emitter<undefined>();
        const disposables: IDisposable[] = [];

        const registration1 = emitter.registerListener(callback, disposables);
        const registration2 = emitter.registerListener(callback, disposables);

        emitter.fire(undefined);
        assert.strictEqual(counter, 2);

        while (disposables.length) {
            const disposable = disposables.pop();
            disposable!.dispose();
        }

        emitter.fire(undefined);
        assert.strictEqual(counter, 2);

        // no operations
        registration1.dispose();
        registration2.dispose();
        emitter.fire(undefined);
        assert.strictEqual(counter, 2);
    });

    test('emitter - dispose emitter', () => {
        let counter = 0;
        const callback = (e: undefined) => {
            counter++;
        };

        const emitter = new Emitter<undefined>();

        const registration1 = emitter.registerListener(callback);
        
        emitter.fire(undefined);
        assert.strictEqual(counter, 1);

        emitter.fire(undefined);
        assert.strictEqual(counter, 2);

        registration1.dispose();
        emitter.fire(undefined);
        assert.strictEqual(counter, 2);

        emitter.dispose();
        try {
            const registration2 = emitter.registerListener(callback);
        } catch (err) {
            assert.ok(true);
        }
    });

    test('emitter - fire error', () => {
        let counter = 0;
        const callback = (e: undefined) => {
            counter++;
        };

        const emitter = new Emitter<undefined>();

        const registration1 = emitter.registerListener(callback);
        const registration2 = emitter.registerListener(() => { throw new Error('expect error'); });
        const registration3 = emitter.registerListener(callback);

        const errors = emitter.fire(undefined);
        assert.strictEqual(errors.length, 1);
        assert.strictEqual((errors[0] as Error).message, 'expect error');
        assert.strictEqual(counter, 2);
    });

    
});