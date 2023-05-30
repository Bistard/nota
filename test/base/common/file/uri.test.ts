import * as assert from 'assert';
import { URI } from 'src/base/common/file/uri';
import { IS_WINDOWS } from 'src/base/common/platform';

suite.only('URI-test', () => {
    
    const testStr1 = 'foo://example.com:8042/over/there?name=ferret#nose';
    const testStr2 = 'urn:example:animal:ferret:nose';
    const testStr3 = 'file://d:/dev/nota/src/code/common/service/test/file.test.txt';

    test('toString', () => {
        assert.strictEqual(URI.toString(URI.parse(testStr1)), testStr1);
        assert.strictEqual(URI.toString(URI.parse(testStr2)), testStr2);
        assert.strictEqual(URI.toString(URI.parse(testStr3)), testStr3);
    });

    test('toFsPath', () => {
        if (IS_WINDOWS) {
            assert.strictEqual(URI.toFsPath(URI.parse(testStr3)), 'd:\\dev\\nota\\src\\code\\common\\service\\test\\file.test.txt');
        } else {
            assert.strictEqual(URI.toFsPath(URI.parse(testStr3)), 'd:/dev/nota/src/code/common/service/test/file.test.txt');
        }
    });

    test('parse', () => {
        // 'http://host/parts'
        let uri = URI.parse('http://host/parts');
        assert.strictEqual(uri.scheme, 'http');
        assert.strictEqual(uri.authority, 'host');
        assert.strictEqual(uri.path, '/parts');
        assert.strictEqual(uri.query, '');
        assert.strictEqual(uri.fragment, '');

        // Empty string
        uri = URI.parse('');
        assert.strictEqual(uri.scheme, '');
        assert.strictEqual(uri.authority, '');
        assert.strictEqual(uri.path, '');
        assert.strictEqual(uri.query, '');
        assert.strictEqual(uri.fragment, '');

        // Invalid URI
        uri = URI.parse('invalidURI');
        assert.strictEqual(uri.scheme, '');
        assert.strictEqual(uri.authority, '');
        assert.strictEqual(uri.path, 'invalidURI');
        assert.strictEqual(uri.query, '');
        assert.strictEqual(uri.fragment, '');
    });

    test('isURI', () => {
        const uri = URI.parse('http://host/parts');
        assert.strictEqual(URI.isURI(uri), true);
        assert.strictEqual(URI.isURI(null), false);
        assert.strictEqual(URI.isURI(undefined), false);
        assert.strictEqual(URI.isURI({}), false);
        assert.strictEqual(URI.isURI('string'), false);
        assert.strictEqual(URI.isURI(123), false);
    });

    test('toFsPath', () => {
        const uri = URI.parse('file:///c:/test');
        assert.strictEqual(URI.toFsPath(uri), 'c:/test');

        const winUri = URI.parse('file:///c:/windows/test');
        assert.strictEqual(URI.toFsPath(winUri, true), 'c:/windows/test');
        assert.strictEqual(URI.toFsPath(winUri, false), 'c:/windows/test');
    });

    test('fromFile', () => {
        const path = '/c:/test';
        const uri = URI.fromFile(path);
        assert.strictEqual(uri.scheme, 'file');
        assert.strictEqual(uri.authority, '');
        assert.strictEqual(uri.path, path);

        const winPath = 'c:/windows/test';
        const winUri = URI.fromFile(winPath);
        assert.strictEqual(winUri.scheme, 'file');
        assert.strictEqual(winUri.authority, '');
        assert.strictEqual(winUri.path, 'c:/windows/test');
    });

    test('join', () => {
        const uri = URI.parse('file:///c:/');
        const joinedUri = URI.join(uri, 'test', 'dir');
        assert.strictEqual(joinedUri.path, 'c:/test/dir');

        // Joining nothing should not alter the original URI
        const joinedUriEmpty = URI.join(uri);
        assert.strictEqual(joinedUriEmpty.path, uri.path);
    });

    test('toString', () => {
        const uri = URI.parse('http://host/parts');
        assert.strictEqual(URI.toString(uri), 'http://host/parts');

        // Empty URI
        const emptyUri = URI.parse('');
        assert.strictEqual(URI.toString(emptyUri), '');
    });

    test('basename', () => {
        const uri = URI.parse('file:///c:/test/dir/file.txt');
        assert.strictEqual(URI.basename(uri), 'file.txt');

        // Without file extension
        const noExtUri = URI.parse('file:///c:/test/dir/file');
        assert.strictEqual(URI.basename(noExtUri), 'file');

        // With multiple periods
        const multiDotUri = URI.parse('file:///c:/test/dir/file.name.ext');
        assert.strictEqual(URI.basename(multiDotUri), 'file.name.ext');
    });

    test('extname', () => {
        const uri = URI.parse('file:///c:/test/dir/file.txt');
        assert.strictEqual(URI.extname(uri), '.txt');

        // Without file extension
        const noExtUri = URI.parse('file:///c:/test/dir/file');
        assert.strictEqual(URI.extname(noExtUri), '');

        // With multiple periods
        const multiDotUri = URI.parse('file:///c:/test/dir/file.name.ext');
        assert.strictEqual(URI.extname(multiDotUri), '.ext');
    });

    test('dirname', () => {
        const uri = URI.parse('file:///c:/test/dir/file.txt');
        const dirUri = URI.dirname(uri);
        assert.strictEqual(dirUri.path, 'c:/test/dir');

        // Without file
        const noFileUri = URI.parse('file:///c:/test/dir/');
        const noFileDirUri = URI.dirname(noFileUri);
        assert.strictEqual(noFileDirUri.path, 'c:/test');

        // Root directory
        const rootUri = URI.parse('file:///c:/');
        const rootDirUri = URI.dirname(rootUri);
        assert.strictEqual(rootDirUri.path, 'c:/');
    });

    test('revive', () => {
        const obj = { scheme: 'http', authority: 'host', path: '/parts', query: 'query', fragment: 'fragment' };
        const uri = URI.revive(obj);
        assert.ok(uri instanceof URI);
        assert.strictEqual(uri.scheme, obj.scheme);
        assert.strictEqual(uri.authority, obj.authority);
        assert.strictEqual(uri.path, obj.path);
        assert.strictEqual(uri.query, obj.query);
        assert.strictEqual(uri.fragment, obj.fragment);
    });
});
