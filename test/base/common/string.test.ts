import * as assert from 'assert';
import { String } from 'src/base/common/string';

suite('string-test', () => {

    test('regExp', () => {
        
        assert.strictEqual(String.regExp('.nota', []), false);
        assert.strictEqual(String.regExp('.nota', [new RegExp('^.x')]), false);
        assert.strictEqual(String.regExp('.nota', [new RegExp('^.x'), new RegExp('^.*')]), true);
        assert.strictEqual(String.regExp('user.config.json', [new RegExp('.config.')]), true);
        assert.strictEqual(String.regExp('user.config.json', [new RegExp('^global')]), false);

    });

});