import * as assert from 'assert';
import { Strings } from 'src/base/common/util/string';

suite('string-test', () => {

    test('regExp', () => {
        assert.strictEqual(Strings.regExp('.nota', []), false);
        assert.strictEqual(Strings.regExp('.nota', [new RegExp('^.x')]), false);
        assert.strictEqual(Strings.regExp('.nota', [new RegExp('^.x'), new RegExp('^.*')]), true);
        assert.strictEqual(Strings.regExp('user.config.json', [new RegExp('.config.')]), true);
        assert.strictEqual(Strings.regExp('user.config.json', [new RegExp('^global')]), false);
    });

    test('format', () => {
        assert.strictEqual(Strings.format('Hello Chris!', []), 'Hello Chris!');
        assert.strictEqual(Strings.format('Hello {0}!', ['Chris']), 'Hello Chris!');
        assert.strictEqual(Strings.format('{0} {1}!', ['Hello', 'Chris']), 'Hello Chris!');
        assert.strictEqual(Strings.format('{1} {0}!', ['Hello', 'Chris']), 'Chris Hello!');
    });

});