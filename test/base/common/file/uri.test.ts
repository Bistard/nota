import * as assert from 'assert';
import { URI } from 'src/base/common/file/uri';
import { IS_WINDOWS } from 'src/base/common/platform';

suite('URI-test', () => {
    
    const testStr1 = 'foo://example.com:8042/over/there?name=ferret#nose';
    const testStr2 = 'urn:example:animal:ferret:nose';
    const testStr3 = 'file://d:/dev/nota/src/code/common/service/test/file.test.txt';

    test('URI#toString()', () => {
        assert.strictEqual(URI.toString(URI.parse(testStr1)), testStr1);
        assert.strictEqual(URI.toString(URI.parse(testStr2)), testStr2);
        assert.strictEqual(URI.toString(URI.parse(testStr3)), testStr3);
    });

    test('URI#toFsPath()', () => {
        if (IS_WINDOWS) {
            assert.strictEqual(URI.toFsPath(URI.parse(testStr3)), 'd:\\dev\\nota\\src\\code\\common\\service\\test\\file.test.txt');
        } else {
            assert.strictEqual(URI.toFsPath(URI.parse(testStr3)), 'd:/dev/nota/src/code/common/service/test/file.test.txt');
        }
        
    });

});
