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

});