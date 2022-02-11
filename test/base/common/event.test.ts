import * as assert from 'assert';
import { IDisposable } from 'src/base/common/dispose';
import { DelayableEmitter, Emitter, Event, PauseableEmitter, SignalEmitter } from 'src/base/common/event';

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

    test('PauseableEmitter - basic', () => {
        
        const emitter = new PauseableEmitter<void>();

        let cnt = 0;
        const listener = () => { cnt++ };
        emitter.registerListener(listener);

        emitter.fire();
        assert.strictEqual(cnt, 1);

        emitter.pause();
        emitter.fire();
        assert.strictEqual(cnt, 1);
        emitter.fire();
        assert.strictEqual(cnt, 1);

        emitter.resume();
        emitter.fire();
        assert.strictEqual(cnt, 2);
        emitter.fire();
        assert.strictEqual(cnt, 3);

        emitter.dispose();
        emitter.fire();
        assert.strictEqual(cnt, 3);
    });

    test('DelayableEmitter - basic', () => {
        const emitter = new DelayableEmitter<number>();

        let cnt = 0;
        const listener = (e: number) => cnt++;;
        emitter.registerListener(listener);

        emitter.fire(cnt);
        assert.strictEqual(cnt, 1);

        emitter.pause();
        emitter.fire(cnt);
        assert.strictEqual(cnt, 1);
        emitter.fire(cnt);
        assert.strictEqual(cnt, 1);

        emitter.resume();
        assert.strictEqual(cnt, 3);
        emitter.fire(cnt);
        assert.strictEqual(cnt, 4);

        emitter.dispose();
        emitter.fire(cnt);
        assert.strictEqual(cnt, 4);
    });

    test('SingalEmitter - basic', () => {
        const consumed1 = new Emitter<string>();
        const consumed2 = new Emitter<string>();
        
        const emitter = new SignalEmitter<string, boolean>([consumed1.registerListener, consumed2.registerListener], (str) => {
            if (str.length > 4) return true;
            else return false;
        });

        let result = false;
        emitter.registerListener((bool: boolean) => {
            result = bool;
        });

        consumed1.fire('abc');
        assert.strictEqual(result, false);
        consumed1.fire('abcd');
        assert.strictEqual(result, false);
        consumed1.fire('abcde');
        assert.strictEqual(result, true);
        
        consumed2.fire('abc');
        assert.strictEqual(result, false);
        consumed2.fire('abcde');
        assert.strictEqual(result, true);

        emitter.dispose();

        result = false;
        consumed1.fire('abcde');
        assert.strictEqual(result, false);
    });

    test('Event::map()', () => {
        const emitter = new Emitter<string>();

        let result = false;

        Event.map<string, boolean>(emitter.registerListener, (e: string) => {
            if (e.length > 4) return true;
            return false;
        })((e: boolean) => {
            result = e;
        });

        emitter.fire('abc');
        assert.strictEqual(result, false);
        emitter.fire('abcde');
        assert.strictEqual(result, true);

        result = false;
        emitter.dispose();
        emitter.fire('abcde');
        assert.strictEqual(result, false);
    });

    test('Event:each()', () => {
        const emitter = new Emitter<boolean>();

        let result = false;

        Event.each<boolean>(emitter.registerListener, (e: boolean) => {
            return !e;
        })((e: boolean) => {
            result = e;
        });

        emitter.fire(true);
        assert.strictEqual(result, false);
        emitter.fire(false);
        assert.strictEqual(result, true);

        result = false;
        emitter.dispose();
        emitter.fire(false);
        assert.strictEqual(result, false);
    });

    
});