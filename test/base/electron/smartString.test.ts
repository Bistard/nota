import * as assert from 'assert';
import { IS_LINUX } from "src/base/common/platform";
import { SmartStrings } from "src/base/electron/smartString";

suite('Smart Namespace', function () {
        
    suite('#adjust()', function () {
        test('CaseSensitive', function () {
            if (!IS_LINUX) {
                this.skip();
            }
            assert.strictEqual(SmartStrings.adjust('HeLLo'), 'HeLLo');
        });
        
        test('CaseIgnore', function () {
            if (IS_LINUX) {
                this.skip();
            }
            assert.strictEqual(SmartStrings.adjust('HeLLo'), 'hello');
            assert.strictEqual(SmartStrings.adjust('hello'), 'hello');
        });
    });

    suite('#equals()', function () {
        test('CaseSensitive', function () {
            if (!IS_LINUX) {
                this.skip();
            }
            assert.strictEqual(SmartStrings.equals('hello', 'hello'), true);
            assert.strictEqual(SmartStrings.equals('hello', 'HELLO'), false);
        });

        test('CaseIgnore', function () {
            if (IS_LINUX) {
                this.skip();
            }
            assert.strictEqual(SmartStrings.equals('hello', 'hello'), true);
            assert.strictEqual(SmartStrings.equals('hello', 'HELLO'), true);
        });
    });

    suite('#startsWith()', function () {
        test('CaseSensitive', function () {
            if (!IS_LINUX) {
                this.skip();
            }
            assert.strictEqual(SmartStrings.startsWith('HELLO world', 'Hello'), false);
            assert.strictEqual(SmartStrings.startsWith('Hello world', 'Hello'), true);
        });

        test('CaseIgnore', function () {
            if (IS_LINUX) {
                this.skip();
            }
            assert.strictEqual(SmartStrings.startsWith('HELLO world', 'hello'), true);
            assert.strictEqual(SmartStrings.startsWith('hello world', 'hello'), true);
        });
    });
});