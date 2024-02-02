import * as assert from 'assert';
import { afterEach, beforeEach } from 'mocha';
import { IObservable, Observable, ObserveType } from 'src/base/common/utilities/observable';

suite('Observable-test', function() {
    
    type TestObject = {
        bar: number;
        foo: () => string;
    };

    let observable: IObservable<TestObject>;
    let observedObject: TestObject;
    let changes: Array<{ prevVal: any; newVal: any; }>;

    beforeEach(() => {
        observedObject = { 
            bar: 1, 
            foo: function() { return 'original'; } 
        };
        observable = new Observable(observedObject);
        changes = [];
    });

    afterEach(() => {
        observable.dispose();
    });

    test('Proxy returns expected initial values', function() {
        const proxy = observable.getProxy();
        assert.strictEqual(proxy.bar, 1);
        assert.strictEqual(proxy.foo(), 'original');
    });

    test('Observing property access (get operations)', function(done) {
        const proxy = observable.getProxy();
    
        // Register an observer for 'get' operations on 'bar'
        observable.on(ObserveType.Get, 'bar', (currVal) => {
            changes.push({ prevVal: currVal, newVal: currVal });
            assert.strictEqual(currVal, 1);
            done();
        });
    
        const value = proxy.bar;
    
        assert.strictEqual(value, 1);
        assert.strictEqual(changes.length, 1);
    });

    test('Observing property changes', function(done) {
        const proxy = observable.getProxy();

        observable.on(ObserveType.Set, 'bar', (prevVal, newVal) => {
            changes.push({ prevVal, newVal });
            assert.strictEqual(prevVal, 1);
            assert.strictEqual(newVal, 2);
            done();
        });

        proxy.bar = 2;
    });

    test('Observing foo calls', function(done) {
        const proxy = observable.getProxy();

        observable.on(ObserveType.Call, 'foo', () => {
            done();
        });

        proxy.foo();
    });

    test('Dispose removes all observers', function() {
        const proxy = observable.getProxy();

        observable.on(ObserveType.Set, 'bar', (prevVal, newVal) => {
            changes.push({ prevVal, newVal });
        });

        observable.dispose();

        proxy.bar = 2; // Should not trigger the observer

        assert.strictEqual(changes.length, 0);
    });
});