import * as assert from 'assert';
import { URI } from 'src/base/common/file/uri';

suite('URI-test', () => {
    
    const testStr1 = 'foo://example.com:8042/over/there?name=ferret#nose';
    const testStr2 = 'urn:example:animal:ferret:nose';
    const testStr3 = 'file://d:/dev/MarkdownNote/src/code/common/service/test/file.test.txt';

    test('URI#toString()', () => {
        assert.strictEqual(URI.parse(testStr1).toString(), testStr1);
        assert.strictEqual(URI.parse(testStr2).toString(), testStr2);
        assert.strictEqual(URI.parse(testStr3).toString(), testStr3);
    });

    test('URI#toFsPath()', () => {
        // assert.strictEqual(URI.toFsPath(URI.parse(testStr1)), '');
        // assert.strictEqual(URI.toFsPath(URI.parse(testStr2)), '');
        assert.strictEqual(URI.toFsPath(URI.parse(testStr3)), 'd:\\dev\\MarkdownNote\\src\\code\\common\\service\\test\\file.test.txt');
    });

});
