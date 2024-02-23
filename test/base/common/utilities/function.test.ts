import * as assert from 'assert';
import { executeOnce, Reactivator } from 'src/base/common/utilities/function';

suite('function-test', () => {

    suite('executeOnce', function() {
        test('should execute function once without error', function() {
            const fn = () => 42;
            const wrappedFn = executeOnce(fn);
            assert.strictEqual(wrappedFn(), 42);
        });
    
        test('should throw error on second execution attempt', function() {
            const fn = () => 42;
            const wrappedFn = executeOnce(fn);
            wrappedFn();
            assert.throws(() => wrappedFn(), /can only be executed once/);
        });
    });
    
    suite('Reactivator', function() {
        let executor: Reactivator;
        let actionCounter: number;
    
        setup(function() {
            actionCounter = 0;
            executor = new Reactivator(() => actionCounter++);
        });
    
        test('should not execute before reactivate', function() {
            executor.execute();
            assert.strictEqual(actionCounter, 0);
        });
    
        test('should execute once after reactivate', function() {
            executor.reactivate();
            executor.execute();
            assert.strictEqual(actionCounter, 1);
        });
    
        test('should not execute more than once after single reactivate', function() {
            executor.reactivate();
            executor.execute();
            executor.execute();
            assert.strictEqual(actionCounter, 1);
        });
    
        test('should execute default action if no function passed', function() {
            executor.reactivate();
            executor.execute();
            assert.strictEqual(actionCounter, 1);
        });
    
        test('should execute passed function instead of default action', function() {
            executor.reactivate();
            executor.execute(() => actionCounter += 2);
            assert.strictEqual(actionCounter, 2);
        });
    });
});