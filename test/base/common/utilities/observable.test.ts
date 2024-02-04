import * as assert from 'assert';
import { afterEach, beforeEach } from 'mocha';
import { IObservable, Observable } from 'src/base/common/utilities/observable';

suite('Observable-test', function() {
    
    type TestObject = {
        bar: number;
        foo: () => string;
    };

    let ob: IObservable<TestObject>;
    let changes: Array<{ prevVal: any; newVal: any; }>;

    beforeEach(() => {
        const observedObject: TestObject = { 
            bar: 1, 
            foo: function() { return 'original'; } 
        };
        ob = new Observable(observedObject);
        changes = [];
    });

    afterEach(() => {
        ob.dispose();
    });

    test('Proxy returns expected initial values', function() {
        const proxy = ob.getProxy();
        assert.strictEqual(proxy.bar, 1);
        assert.strictEqual(proxy.foo(), 'original');
    });

    test('Observing property access (get operations)', function(done) {
        const proxy = ob.getProxy();
    
        // Register an observer for 'get' operations on 'bar'
        ob.on('get', 'bar', (currVal) => {
            changes.push({ prevVal: currVal, newVal: currVal });
            assert.strictEqual(currVal, 1);
            done();
        });
    
        const value = proxy.bar;
    
        assert.strictEqual(value, 1);
        assert.strictEqual(changes.length, 1);
    });

    test('Observing property changes', function(done) {
        const proxy = ob.getProxy();

        ob.on('set', 'bar', (prevVal, newVal) => {
            changes.push({ prevVal, newVal });
            assert.strictEqual(prevVal, 1);
            assert.strictEqual(newVal, 2);
            done();
        });

        proxy.bar = 2;
    });

    test('Observing foo calls', function(done) {
        const proxy = ob.getProxy();

        ob.on('call', 'foo', (ret) => {
            assert.strictEqual(ret, 'original');
            done();
        });

        proxy.foo();
    });
    
    test('Observing any calls', function(done) {
        const proxy = ob.getProxy();

        ob.on('call', null, (propKey, ret) => {
            assert.strictEqual(propKey, 'foo');
            assert.strictEqual(ret, 'original');
            done();
        });

        proxy.foo();
    });

    test('Observing for any changes on given ObserveType', function() {
        const ob = new Observable({ 
            bar: 1,
            foo: 'hello', 
        });
        const proxy = ob.getProxy();


        const changes: any[] = [];
        ob.on('set', '', (propKey, prevVal, newVal) => {
            changes.push([propKey, prevVal, newVal]);
        });

        proxy.bar = 2;
        proxy.foo = 'world';

        assert.strictEqual(changes.length, 2);
        assert.deepStrictEqual(changes[0], ['bar', 1, 2]);
        assert.deepStrictEqual(changes[1], ['foo', 'hello', 'world']);
    });

    test('Dispose removes all observers', function() {
        const proxy = ob.getProxy();

        ob.on('set', 'bar', (prevVal, newVal) => {
            changes.push({ prevVal, newVal });
        });

        ob.dispose();

        proxy.bar = 2; // Should not trigger the observer

        assert.strictEqual(changes.length, 0);
    });

});