import * as assert from 'assert';
import { SmartRegExp } from 'src/base/common/utilities/regExp';

suite('SmartRegExp', () => {

    suite('constructor', () => {
        test('should initialize with string pattern', () => {
            const regex = new SmartRegExp('hello', 'g');
            assert.strictEqual(regex.get().toString(), '/hello/g');
        });

        test('should initialize with RegExp pattern', () => {
            const regex = new SmartRegExp(/world/i);
            assert.strictEqual(regex.get().toString(), '/world/i');
        });
    });

    suite('replace', () => {
        test('should replace string pattern with another string pattern', () => {
            const regex = new SmartRegExp('hello world').replace('world', 'there');
            assert.strictEqual(regex.get().toString(), '/hello there/');
        });

        test('should replace string pattern with a RegExp pattern', () => {
            const regex = new SmartRegExp('hello world').replace('world', /planet/);
            assert.strictEqual(regex.get().toString(), '/hello planet/');
        });

        test('should replace RegExp pattern with a string pattern', () => {
            const regex = new SmartRegExp(/hello world/).replace(/world/, 'planet');
            assert.strictEqual(regex.get().toString(), '/hello planet/');
        });

        test('should handle replacing with empty string', () => {
            const regex = new SmartRegExp('hello world').replace('world', '');
            assert.strictEqual(regex.get().toString(), '/hello /');
        });

        test('should ignore beginning-of-line markers in replacement pattern', () => {
            const regex = new SmartRegExp('hello ^world').replace('^world', 'planet');
            assert.strictEqual(regex.get().toString(), '/hello planet/');
        });
    });

    suite('get', () => {
        test('should return RegExp with correct flags', () => {
            const regex = new SmartRegExp('abc', 'gi').get();
            assert.strictEqual(regex.flags, 'gi');
        });

        test('should return RegExp with no flags when none are provided', () => {
            const regex = new SmartRegExp('abc').get();
            assert.strictEqual(regex.flags, '');
        });

        test('should return a RegExp with the correct source pattern', () => {
            const regex = new SmartRegExp('test').get();
            assert.strictEqual(regex.source, 'test');
        });
    });
});
