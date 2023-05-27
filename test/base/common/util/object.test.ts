import * as assert from 'assert';
import { deepCopy, deepFreeze, mixin } from 'src/base/common/util/object';
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
});