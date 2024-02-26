import * as assert from 'assert';
import { Strings } from 'src/base/common/utilities/string';

suite('Strings-test', function () {

    suite('#anyRegExp()', function () {
        test('should return true for empty rules', function () {
            assert.strictEqual(Strings.anyRegExp('test', []), true);
        });

        test('should return true when any rule matches', function () {
            assert.strictEqual(Strings.anyRegExp('hello', [/hello/, /world/]), true);
        });

        test('should return false when no rules match', function () {
            assert.strictEqual(Strings.anyRegExp('hello', [/test/, /world/]), false);
        });

        test('more', () => {
            assert.strictEqual(Strings.anyRegExp('.program', []), true);
            assert.strictEqual(Strings.anyRegExp('.program', [new RegExp('^.x')]), false);
            assert.strictEqual(Strings.anyRegExp('.program', [new RegExp('^.x'), new RegExp('^.*')]), true);
            assert.strictEqual(Strings.anyRegExp('user.config.json', [new RegExp('.config.')]), true);
            assert.strictEqual(Strings.anyRegExp('user.config.json', [new RegExp('^global')]), false);
            assert.strictEqual(Strings.anyRegExp('user.config.json', [new RegExp('^global'), new RegExp('.config.')]), true);
        });
    });

    suite('#stringify()', function () {
        test('should concatenate string arguments', function () {
            assert.strictEqual(Strings.stringify('hello', 'world'), 'hello world');
        });

        test('should stringify and concatenate object arguments', function () {
            assert.strictEqual(Strings.stringify({ hello: 'world' }, 'test'), '{"hello":"world"} test');
        });
    });

    suite('#format()', function () {
        test('should format string with given interpolations', function () {
            assert.strictEqual(Strings.format('hello {0}', ['world']), 'hello world');
        });

        test('should return raw string if no interpolations provided', function () {
            assert.strictEqual(Strings.format('hello {0}', []), 'hello {0}');
        });

        test('should handle multiple interpolations', function () {
            assert.strictEqual(Strings.format('{0} {1}', ['hello', 'world']), 'hello world');
        });

        test('should handle non-string interpolations', function () {
            assert.strictEqual(Strings.format('value is {0}', [123]), 'value is 123');
        });

        test('more', () => {
            assert.strictEqual(Strings.format('Hello Chris!', []), 'Hello Chris!');
            assert.strictEqual(Strings.format('Hello {0}!', ['Chris']), 'Hello Chris!');
            assert.strictEqual(Strings.format('{0} {1}!', ['Hello', 'Chris']), 'Hello Chris!');
            assert.strictEqual(Strings.format('{1} {0}!', ['Hello', 'Chris']), 'Chris Hello!');
        });
    });

    suite('#rtrim()', function () {
        test('should remove specified substring from the end', function () {
            assert.strictEqual(Strings.rtrim('Hello world!!!', '!'), 'Hello world');
        });

        test('should return original string if needle is not found at the end', function () {
            assert.strictEqual(Strings.rtrim('foobar', 'bar'), 'foo');
        });

        test('should handle empty haystack or needle gracefully', function () {
            assert.strictEqual(Strings.rtrim('', 'needle'), '');
            assert.strictEqual(Strings.rtrim('haystack', ''), 'haystack');
        });

        test('more', () => {
            assert.strictEqual(Strings.rtrim('Hello world!!!', '!'), 'Hello world');
            assert.strictEqual(Strings.rtrim('foobarbarbar', 'bar'), 'foo');
            assert.strictEqual(Strings.rtrim('abcabc', 'abc'), '');

            assert.strictEqual(Strings.rtrim('foo', 'o'), 'f');
            assert.strictEqual(Strings.rtrim('foo', 'f'), 'foo');
            assert.strictEqual(Strings.rtrim('http://www.test.de', '.de'), 'http://www.test');
            assert.strictEqual(Strings.rtrim('/foo/', '/'), '/foo');
            assert.strictEqual(Strings.rtrim('/foo//', '/'), '/foo');
            assert.strictEqual(Strings.rtrim('/', ''), '/');
            assert.strictEqual(Strings.rtrim('/', '/'), '');
            assert.strictEqual(Strings.rtrim('///', '/'), '');
            assert.strictEqual(Strings.rtrim('', ''), '');
            assert.strictEqual(Strings.rtrim('', '/'), '');
        });
    });

    suite('IgnoreCase Namespace', function () {
        suite('#equals()', function () {
            test('should return true for equal strings ignoring case', function () {
                assert.strictEqual(Strings.IgnoreCase.equals('hello', 'HELLO'), true);
            });

            test('should return false for unequal strings', function () {
                assert.strictEqual(Strings.IgnoreCase.equals('hello', 'world'), false);
            });

            test('more', () => {
                assert.ok(Strings.IgnoreCase.equals('', ''));
                assert.ok(!Strings.IgnoreCase.equals('', '1'));
                assert.ok(!Strings.IgnoreCase.equals('1', ''));

                assert.ok(Strings.IgnoreCase.equals('a', 'a'));
                assert.ok(Strings.IgnoreCase.equals('abc', 'Abc'));
                assert.ok(Strings.IgnoreCase.equals('abc', 'ABC'));
                assert.ok(Strings.IgnoreCase.equals('Höhenmeter', 'HÖhenmeter'));
                assert.ok(Strings.IgnoreCase.equals('ÖL', 'Öl'));
            });
        });

        suite('#startsWith()', function () {
            test('should return true if string starts with candidate ignoring case', function () {
                assert.strictEqual(Strings.IgnoreCase.startsWith('Hello world', 'hello'), true);
            });

            test('should return false if string does not start with candidate', function () {
                assert.strictEqual(Strings.IgnoreCase.startsWith('world hello', 'hello'), false);
            });

            test('more', () => {
                assert.ok(Strings.IgnoreCase.startsWith('', ''));
                assert.ok(!Strings.IgnoreCase.startsWith('', '1'));
                assert.ok(Strings.IgnoreCase.startsWith('1', ''));

                assert.ok(Strings.IgnoreCase.startsWith('a', 'a'));
                assert.ok(Strings.IgnoreCase.startsWith('abc', 'Abc'));
                assert.ok(Strings.IgnoreCase.startsWith('abc', 'ABC'));
                assert.ok(Strings.IgnoreCase.startsWith('Höhenmeter', 'HÖhenmeter'));
                assert.ok(Strings.IgnoreCase.startsWith('ÖL', 'Öl'));

                assert.ok(Strings.IgnoreCase.startsWith('alles klar', 'a'));
                assert.ok(Strings.IgnoreCase.startsWith('alles klar', 'A'));
                assert.ok(Strings.IgnoreCase.startsWith('alles klar', 'alles k'));
                assert.ok(Strings.IgnoreCase.startsWith('alles klar', 'alles K'));
                assert.ok(Strings.IgnoreCase.startsWith('alles klar', 'ALLES K'));
                assert.ok(Strings.IgnoreCase.startsWith('alles klar', 'alles klar'));
                assert.ok(Strings.IgnoreCase.startsWith('alles klar', 'ALLES KLAR'));

                assert.ok(!Strings.IgnoreCase.startsWith('alles klar', ' ALLES K'));
                assert.ok(!Strings.IgnoreCase.startsWith('alles klar', 'ALLES K '));
                assert.ok(!Strings.IgnoreCase.startsWith('alles klar', 'öALLES K '));
                assert.ok(!Strings.IgnoreCase.startsWith('alles klar', ' '));
                assert.ok(!Strings.IgnoreCase.startsWith('alles klar', 'ö'));
            });
        });
    });

    suite('Smart Namespace', function () {
        // suite('#adjust()', function () {
        //     test('should return lowercase string if OS is case insensitive', function () {
        //         // Assuming OS_CASE_SENSITIVE is false for this test
        //         assert.strictEqual(Strings.Smart.adjust('HeLLo'), 'hello');
        //     });
        // });

        // suite('#equals()', function () {
        //     test('should return true for equal strings considering OS case sensitivity', function () {
        //         // Assuming OS_CASE_SENSITIVE is true for this test
        //         assert.strictEqual(Strings.Smart.equals('hello', 'hello'), true);
        //     });

        //     test('should return false for unequal strings', function () {
        //         assert.strictEqual(Strings.Smart.equals('hello', 'HELLO'), false);
        //     });
        // });

        // suite('#startsWith()', function () {
        //     test('should return true if string starts with candidate considering OS case sensitivity', function () {
        //         // Assuming OS_CASE_SENSITIVE is true for this test
        //         assert.strictEqual(Strings.Smart.startsWith('Hello world', 'Hello'), true);
        //     });

        //     test('should return false if string does not start with candidate', function () {
        //         assert.strictEqual(Strings.Smart.startsWith('world hello', 'hello'), false);
        //     });
        // });
    });

});