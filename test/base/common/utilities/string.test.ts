import * as assert from 'assert';
import { IS_LINUX } from 'src/base/common/platform';
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

    suite('escape', () => {
        test('should escape special characters', () => {
            const input = 'Hello\nWorld! "Test" \\Example\\';
            const expected = 'Hello\\nWorld! \\"Test\\" \\\\Example\\\\';
            assert.strictEqual(Strings.escape(input), expected);
        });

        test('should return the same string if no special characters', () => {
            const input = 'Hello World!';
            const expected = 'Hello World!';
            assert.strictEqual(Strings.escape(input), expected);
        });

        test('should handle an empty string', () => {
            const input = '';
            const expected = '';
            assert.strictEqual(Strings.escape(input), expected);
        });

        test('should escape only the special characters present', () => {
            const input = '\n\t\\';
            const expected = '\\n\\t\\\\';
            assert.strictEqual(Strings.escape(input), expected);
        });

        test('should handle string with no escapeable characters', () => {
            const input = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const expected = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            assert.strictEqual(Strings.escape(input), expected);
        });
    });

    suite('substringUntilChar', () => {
        test('should return substring before the first occurrence of character', () => {
            assert.strictEqual(Strings.substringUntilChar('hello world', 'o'), 'hell');
        });
    
        test('should return substring before the first occurrence of character at the start', () => {
            assert.strictEqual(Strings.substringUntilChar('javascript', 'a'), 'j');
        });
    
        test('should return the entire string when character is not found', () => {
            assert.strictEqual(Strings.substringUntilChar('javascript', 'z'), 'javascript');
        });
    
        test('should return empty string when character is at the start', () => {
            assert.strictEqual(Strings.substringUntilChar('apple', 'a'), '');
        });
    
        test('should return entire string when character is not in string', () => {
            assert.strictEqual(Strings.substringUntilChar('typescript', 'x'), 'typescript');
        });
    
        test('should return the entire string if the input string is empty', () => {
            assert.strictEqual(Strings.substringUntilChar('', 'a'), '');
        });
    
        test('should return substring correctly when the character appears multiple times', () => {
            assert.strictEqual(Strings.substringUntilChar('banana', 'n'), 'ba');
        });
    });

    suite('removeAllChar', () => {
        test('should remove specified character from the string', () => {
            assert.strictEqual(Strings.removeAllChar('hello', 'l'), 'heo');
        });
    
        test('should return the same string if character is not found', () => {
            assert.strictEqual(Strings.removeAllChar('hello', 'x'), 'hello');
        });
    
        test('should return an empty string if all characters are removed', () => {
            assert.strictEqual(Strings.removeAllChar('aaaa', 'a'), '');
        });
    
        test('should return the original string when removing an empty character', () => {
            assert.strictEqual(Strings.removeAllChar('hello', ''), 'hello');
        });
    
        test('should return an empty string when input is empty', () => {
            assert.strictEqual(Strings.removeAllChar('', 'a'), '');
        });
    
        test('should handle removing spaces from a string', () => {
            assert.strictEqual(Strings.removeAllChar('h e l l o', ' '), 'hello');
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
        
        suite('#adjust()', function () {
            test('CaseSensitive', function () {
                if (!IS_LINUX) {
                    this.skip();
                }
                assert.strictEqual(Strings.Smart.adjust('HeLLo'), 'HeLLo');
            });
            
            test('CaseIgnore', function () {
                if (IS_LINUX) {
                    this.skip();
                }
                assert.strictEqual(Strings.Smart.adjust('HeLLo'), 'hello');
                assert.strictEqual(Strings.Smart.adjust('hello'), 'hello');
            });
        });

        suite('#equals()', function () {
            test('CaseSensitive', function () {
                if (!IS_LINUX) {
                    this.skip();
                }
                assert.strictEqual(Strings.Smart.equals('hello', 'hello'), true);
                assert.strictEqual(Strings.Smart.equals('hello', 'HELLO'), false);
            });

            test('CaseIgnore', function () {
                if (IS_LINUX) {
                    this.skip();
                }
                assert.strictEqual(Strings.Smart.equals('hello', 'hello'), true);
                assert.strictEqual(Strings.Smart.equals('hello', 'HELLO'), true);
            });
        });

        suite('#startsWith()', function () {
            test('CaseSensitive', function () {
                if (!IS_LINUX) {
                    this.skip();
                }
                assert.strictEqual(Strings.Smart.startsWith('HELLO world', 'Hello'), false);
                assert.strictEqual(Strings.Smart.startsWith('Hello world', 'Hello'), true);
            });

            test('CaseIgnore', function () {
                if (IS_LINUX) {
                    this.skip();
                }
                assert.strictEqual(Strings.Smart.startsWith('HELLO world', 'hello'), true);
                assert.strictEqual(Strings.Smart.startsWith('hello world', 'hello'), true);
            });
        });
    });

});