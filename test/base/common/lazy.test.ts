import * as assert from 'assert';
import { beforeEach } from 'mocha';
import { Lazy } from 'src/base/common/lazy';

suite('lazy-test', () => {
    
    // fields
    let _created = false;
    let _disposed = false;
    beforeEach(() => {
        _created = false;
        _disposed = false;   
    });

    // helpers
    interface IValue { dispose(): void; }
    function createValue(): IValue {
        _created = true;
        return { dispose: () => _disposed = true };
    }

    test('basics', () => {
        const lazy = new Lazy(createValue);

        assert.ok(!_created);
        assert.ok(!_disposed);
        
        const ref = lazy.value();
        assert.ok(_created);

        const ref2 = lazy.value();
        assert.ok(_created);
        assert.ok(ref === ref2);

        ref.dispose();
        assert.ok(_disposed);
    });

    test('should return the same instance on subsequent calls', () => {
        const initializer = () => ({ dispose: () => {} });
        const lazy = new Lazy(initializer);
        const value1 = lazy.value();
        const value2 = lazy.value();
        assert.strictEqual(value1, value2);
    });

    test('should dispose the lazy-loaded object if it is loaded', () => {
        let disposed = false;
        const disposable = { dispose: () => { disposed = true; } };
        const initializer = () => disposable;
        const lazy = new Lazy(initializer);
        lazy.value(); // Initialize the value
        lazy.dispose();
        assert.strictEqual(disposed, true);
    });

    test('should not throw an error if dispose is called before the object is initialized', () => {
        const lazy = new Lazy(() => ({ dispose: () => {} }));
        assert.doesNotThrow(() => lazy.dispose());
    });

    test('should handle non-disposable lazy-loaded objects gracefully', () => {
        const initializer = () => ({});
        const lazy = new Lazy(initializer);
        lazy.value(); // Initialize the value
        assert.doesNotThrow(() => lazy.dispose());
    });

});
