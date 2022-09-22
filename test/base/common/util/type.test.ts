import * as assert from 'assert';
import { LinkedList } from 'src/base/common/util/linkedList';
import { isEmptyObject, isIterable, isNumber, isObject, isPrimitive } from 'src/base/common/util/type';

suite('type-test', () => {

    test('isPrimitive', () => {
        assert.strictEqual(isPrimitive(0), true);
        assert.strictEqual(isPrimitive(1), true);
        assert.strictEqual(isPrimitive(-1), true);
        assert.strictEqual(isPrimitive(NaN), true);
        assert.strictEqual(isPrimitive(false), true);
        assert.strictEqual(isPrimitive(true), true);
        assert.strictEqual(isPrimitive(''), true);
        assert.strictEqual(isPrimitive('hello world'), true);
        assert.strictEqual(isPrimitive(undefined), true);
        assert.strictEqual(isPrimitive(null), true);
        assert.strictEqual(isPrimitive(Symbol(0)), true);
        assert.strictEqual(isPrimitive(Symbol('')), true);
        assert.strictEqual(isPrimitive(Symbol(undefined)), true);
        assert.strictEqual(isPrimitive({}), false);
        assert.strictEqual(isPrimitive([]), false);
        assert.strictEqual(isPrimitive(new Date()), false);
        assert.strictEqual(isPrimitive(new RegExp('')), false);
        assert.strictEqual(isPrimitive(() => {}), false);
        assert.strictEqual(isPrimitive(function () {}), false);
    });

    test('isNumber', () => {
        assert.strictEqual(isNumber(undefined), false);
        assert.strictEqual(isNumber(null), false);
        assert.strictEqual(isNumber(''), false);
        assert.strictEqual(isNumber(NaN), false);
        assert.strictEqual(isNumber(0), true);
        assert.strictEqual(isNumber(1), true);
        assert.strictEqual(isNumber(-1), true);
        assert.strictEqual(isNumber(9999), true);
    });

    test('isObject', () => {
        assert.strictEqual(isObject(undefined), false);
        assert.strictEqual(isObject(null), false);
        assert.strictEqual(isObject(''), false);
        assert.strictEqual(isObject(NaN), false);
        assert.strictEqual(isObject([]), false);
        assert.strictEqual(isObject(new RegExp('')), false);
        assert.strictEqual(isObject(new Date()), false);
        assert.strictEqual(isObject({}), true);
        assert.strictEqual(isObject({ a : 5 }), true);
    });

    test('isEmptyObject', () => {
        assert.strictEqual(isEmptyObject({}), true);
        assert.strictEqual(isEmptyObject({ a: 5 }), false);
    });

    test('isIterable', () => {
        assert.strictEqual(isIterable(new LinkedList()), true);
        assert.strictEqual(isIterable([]), true);
        assert.strictEqual(isIterable({}), false);
    });
});