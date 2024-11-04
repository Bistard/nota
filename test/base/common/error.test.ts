import * as assert from 'assert';
import { ErrorHandler, InitProtector, tryOrDefault, trySafe } from 'src/base/common/error';

suite('error-test', () => {
    
    test('setUnexpectedErrorExternalCallback', () => {
        let hit = false;
        
        ErrorHandler.setUnexpectedErrorExternalCallback(err => { hit = true; });
        ErrorHandler.onUnexpectedError(undefined);

        assert.strictEqual(hit, true);
    });

    test('registerListener', () => {
        let hit = 0;
        
        ErrorHandler.setUnexpectedErrorExternalCallback(() => {});

        const listener1 = ErrorHandler.registerListener(() => hit++);
        const listener2 = ErrorHandler.registerListener(() => hit++);

        ErrorHandler.onUnexpectedError(undefined);
        listener1.dispose();
        ErrorHandler.onUnexpectedError(undefined);
        listener2.dispose();
        ErrorHandler.onUnexpectedError(undefined);

        assert.strictEqual(hit, 3);
    });

    test('onUnexpectedExternalError', () => {
        let hit = 0;
        
        ErrorHandler.setUnexpectedErrorExternalCallback(() => hit--);

        const listener = ErrorHandler.registerListener(() => hit++);
        ErrorHandler.onUnexpectedExternalError(undefined);
        
        assert.strictEqual(hit, -1);
    });

    test('tryOrDefault', () => {
        assert.strictEqual(tryOrDefault('bad world', () => 'hello world'), 'hello world');
        assert.strictEqual(tryOrDefault('bad world', () => { throw new Error(); }), 'bad world');
    });

    suite('trySafe', () => {
        test('should return result when synchronous function succeeds', () => {
            const result = trySafe(() => 42, {
                onThen: () => {},
                onError: () => 0,
            });
            assert.strictEqual(result, 42);
        });
    
        test('should return result when asynchronous function succeeds', async () => {
            const result = await trySafe(async () => Promise.resolve(42), {
                onThen: () => {},
                onError: () => 0,
            });
            assert.strictEqual(result, 42);
        });
    
        test('should call onThen when synchronous function succeeds', () => {
            let called = false;
            trySafe(() => 42, {
                onThen: () => { called = true; },
                onError: () => 0,
            });
            assert.strictEqual(called, true);
        });
    
        test('should call onThen when asynchronous function succeeds', async () => {
            let called = false;
            await trySafe(async () => Promise.resolve(42), {
                onThen: () => { called = true; },
                onError: () => 0,
            });
            assert.strictEqual(called, true);
        });
    
        test('should call onError when synchronous function throws', () => {
            const result = trySafe(() => { throw new Error('sync error'); }, {
                onThen: () => {},
                onError: (err) => 'handled',
            });
            assert.strictEqual(result, 'handled');
        });
    
        test('should call onError when asynchronous function rejects', async () => {
            const result = await trySafe(async () => Promise.reject('async error'), {
                onThen: () => {},
                onError: (err) => 'handled',
            });
            assert.strictEqual(result, 'handled');
        });
    
        test('should call onFinally after synchronous function execution', () => {
            let called = false;
            trySafe(() => 42, {
                onThen: () => {},
                onError: () => 0,
                onFinally: () => { called = true; },
            });
            assert.strictEqual(called, true);
        });
    
        test('should call onFinally after asynchronous function execution', async () => {
            let called = false;
            await trySafe(async () => Promise.resolve(42), {
                onThen: () => {},
                onError: () => 0,
                onFinally: () => { called = true; },
            });
            assert.strictEqual(called, true);
        });
    
        test('should call onFinally after synchronous function throws', () => {
            let called = false;
            trySafe(() => { throw new Error('sync error'); }, {
                onThen: () => {},
                onError: () => 'handled',
                onFinally: () => { called = true; },
            });
            assert.strictEqual(called, true);
        });
    
        test('should call onFinally after asynchronous function rejects', async () => {
            let called = false;
            await trySafe(async () => Promise.reject('async error'), {
                onThen: () => {},
                onError: () => 'handled',
                onFinally: () => { called = true; },
            });
            assert.strictEqual(called, true);
        });

        test('async test (when pass)', async () => {
            const results: string[] = [];
            await trySafe(async () => { 
                results.push('pass'); 
            }, {
                onThen: () => { results.push('onThen'); },
                onError: (err) => { results.push(`onError: ${err}`); },
                onFinally: () => { results.push(`onFinally`); },
            });
            assert.deepStrictEqual(results, ['pass', 'onThen', 'onFinally']);
        });

        test('async test (when fails)', async () => {
            const results: string[] = [];
            await trySafe(async () => { 
                results.push('fail');
                return Promise.reject('async error');
            }, {
                onThen: () => { results.push('onThen'); },
                onError: (err) => { results.push(`onError: ${err}`); },
                onFinally: () => { results.push(`onFinally`); },
            });
            assert.deepStrictEqual(results, ['fail', 'onError: async error', 'onFinally']);
        });
    });
    
    test('InitProtector', () => {
        const initProtector = new InitProtector();

        const initResult1 = initProtector.init('first init');
        assert.ok(initResult1.isOk());
        
        const initResult2 = initProtector.init('first init');
        assert.ok(initResult2.isErr());
    });
});
