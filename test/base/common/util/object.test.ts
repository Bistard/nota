import * as assert from 'assert';
import { mixin } from 'src/base/common/util/object';

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

});