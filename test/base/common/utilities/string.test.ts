import * as assert from 'assert';
import { Strings } from 'src/base/common/utilities/string';

suite('string-test', () => {

    test('regExp', () => {
        assert.strictEqual(Strings.anyRegExp('.program', []), true);
        assert.strictEqual(Strings.anyRegExp('.program', [new RegExp('^.x')]), false);
        assert.strictEqual(Strings.anyRegExp('.program', [new RegExp('^.x'), new RegExp('^.*')]), true);
        assert.strictEqual(Strings.anyRegExp('user.config.json', [new RegExp('.config.')]), true);
        assert.strictEqual(Strings.anyRegExp('user.config.json', [new RegExp('^global')]), false);
        assert.strictEqual(Strings.anyRegExp('user.config.json', [new RegExp('^global'), new RegExp('.config.')]), true);
    });

    test('format', () => {
        assert.strictEqual(Strings.format('Hello Chris!', []), 'Hello Chris!');
        assert.strictEqual(Strings.format('Hello {0}!', ['Chris']), 'Hello Chris!');
        assert.strictEqual(Strings.format('{0} {1}!', ['Hello', 'Chris']), 'Hello Chris!');
        assert.strictEqual(Strings.format('{1} {0}!', ['Hello', 'Chris']), 'Chris Hello!');
    });

});