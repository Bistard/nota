import * as assert from 'assert';
import { deepCopy, deepFreeze, mixin, strictEquals } from 'src/base/common/util/object';
import { nullObject, shouldThrow } from 'test/utils/helpers';

suite('object-test', () => {

    test('mixin', () => {
        // no overwrite
        let destination: any = {};
        let source: any = {
            a: 1,
            b: 'b',
            c: undefined
        };
        mixin(destination, source, false);
        assert.deepStrictEqual(destination, source);

        // overwrite
        destination = {
            a: 2,
        };
        source = {
            a: 1,
            b: 'b',
            c: undefined
        };
        mixin(destination, source, true);
        assert.deepStrictEqual(destination, source);

        // complicated overwrite
        destination = {
            a: {
                d: null,
                e: {}
            },
            b: Symbol('a'),
            d: undefined
        };
        source = {
            a: {
                d: 0,
                e: undefined
            },
            b: 'b',
            c: undefined
        };
        mixin(destination, source, true);
        assert.deepStrictEqual(destination, mixin(source, { d: undefined }));
    });

    test('deepCopy', () => {
        const getObj = () => {
            return {
                a: {
                    d: null,
                    e: {},
                    f: {
                        g: 32,
                    },
                    h: 'hello'
                },
                d: undefined
            } as any;
        };

        const getArr = () => {
            return [1, 2, [3, 4, [5, [6, [], [7, [8]]]]], 9];
        }
        
        const obj = getObj();
        const copy1 = deepCopy(obj);
        assert.deepStrictEqual(copy1, obj);
        delete obj['a'];
        assert.deepStrictEqual(copy1, getObj());

        const arr = getArr();
        const copy2 = deepCopy(arr);
        assert.deepStrictEqual(copy2, arr);
        arr.length = 0;
        assert.deepStrictEqual(copy2, getArr());
    });

    test('deepFreeze', () => {
        const obj = {
            prop1: 5,
            prop2: true,
            prop3: 'hello',
            prop4: ['world', 3.14],
        };
        
        deepFreeze(obj);

        shouldThrow(() => obj.prop1 = 4 );
        shouldThrow(() => obj.prop2 = false );
        shouldThrow(() => obj.prop3 = 'world' );
        shouldThrow(() => obj.prop4[0] = 'hello' );
        shouldThrow(() => obj.prop4[1] = 2.7 );
    });

    test('nullObject', () => {
        const iCanDoWhateverIWant = nullObject();
        iCanDoWhateverIWant.dao(124, 'asdq').IDK().forEach(() => 'bulabula');
        delete iCanDoWhateverIWant.hello;
        iCanDoWhateverIWant.world = 'string';
        iCanDoWhateverIWant.world = () => iCanDoWhateverIWant;
    });

    test('strictEquals', () => {
        const obj1 = { a: 1, b: { c: 2 }};
        const obj2 = { a: 1, b: { c: 2 }};
        const obj3 = { a: 1, b: { c: 3 }};

        assert.ok(strictEquals(obj1, obj1), 'strictEquals(obj1, obj1)');
        assert.ok(strictEquals(obj1, obj2), 'strictEquals(obj1, obj2)');
        assert.ok(!strictEquals(obj1, obj3), 'strictEquals(obj1, obj3)');
        assert.ok(!strictEquals(obj2, obj3), 'strictEquals(obj2, obj3)');
        assert.ok(!strictEquals(0, obj3), 'strictEquals(0, obj3)');
        
        assert.ok(!strictEquals(false, true), 'strictEquals(false, true)');
        assert.ok(strictEquals(true, true), 'strictEquals(true, true)');
        assert.ok(strictEquals(false, false), 'strictEquals(false, false)');

        assert.ok(strictEquals(0, 0), 'strictEquals(0, 0)');
        assert.ok(!strictEquals(0, undefined), 'strictEquals(0, undefined)');
        assert.ok(!strictEquals(0, 1), 'strictEquals(0, 1)');
        assert.ok(!strictEquals(-1, 1), '(-1, 1)');
        assert.ok(strictEquals(114514, 114514), 'strictEquals(114514, 114514)');

        assert.ok(!strictEquals(5, undefined), 'strictEquals(5, undefined)');
        assert.ok(!strictEquals(null, undefined), 'strictEquals(null, undefined)');
        assert.ok(strictEquals(null, null), 'strictEquals(null, null)');
        assert.ok(strictEquals(undefined, undefined), 'strictEquals(undefined, undefined)');
        assert.ok(strictEquals('hello', 'hello'), 'hello hello');
        assert.ok(strictEquals([], []), 'ok(strictEquals([], [])');
        assert.ok(!strictEquals([1], []), '([1], [])');
        assert.ok(strictEquals([1], [1]), '], [1])');
        assert.ok(strictEquals([undefined], [undefined]), '], [undefined])');
        assert.ok(!strictEquals([undefined], [undefined, undefined]), '[undefined, undefined])');
    });
});