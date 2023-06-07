import * as assert from 'assert';
import { URI } from 'src/base/common/file/uri';
import { IS_WINDOWS } from 'src/base/common/platform';

suite('URI-test', () => {
    
    const testStr1 = 'foo://example.com:8042/over/there?name=ferret#nose';
    const testStr2 = 'urn:example:animal:ferret:nose';
    const testStr3 = 'file://d:/dev/nota/src/code/common/service/test/file.test.txt';

    test('toString (decoding)', () => {
        assert.strictEqual(URI.toString(URI.parse(testStr1), true), testStr1);
        assert.strictEqual(URI.toString(URI.parse(testStr1)), 'foo://example.com:8042/over/there?name%3Dferret#nose');
        assert.strictEqual(URI.toString(URI.parse(testStr2), true), testStr2);
        assert.strictEqual(URI.toString(URI.parse(testStr2)), 'urn:example%3Aanimal%3Aferret%3Anose');
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

        const values = [
			URI.parse('http://localhost:8080/far'),
			URI.fromFile('c:\\test with %25\\c#code'),
			URI.fromFile('\\\\shäres\\path\\c#\\plugin.json'),
			URI.parse('http://api/files/test.me?t=1234'),
			URI.parse('http://api/files/test.me?t=1234#fff'),
			URI.parse('http://api/files/test.me#fff'),
		];

		for (const value of values) {
			const data = JSON.stringify(value);
			const clone = URI.revive(JSON.parse(data));

			assert.strictEqual(clone.scheme, value.scheme);
			assert.strictEqual(clone.authority, value.authority);
			assert.strictEqual(clone.path, value.path);
			assert.strictEqual(clone.query, value.query);
			assert.strictEqual(clone.fragment, value.fragment);
			assert.strictEqual(URI.toFsPath(clone), URI.toFsPath(value));
			assert.strictEqual(clone.toString(), value.toString());
		}
    });

    test('URI - http, query & toString', function () {
        
		let uri = URI.parse('https://go.microsoft.com/fwlink/?LinkId=518008');
		assert.strictEqual(uri.query, 'LinkId=518008');
		assert.strictEqual(URI.toString(uri, true), 'https://go.microsoft.com/fwlink/?LinkId=518008');
		assert.strictEqual(URI.toString(uri), 'https://go.microsoft.com/fwlink/?LinkId%3D518008');

		let uri2 = URI.parse(URI.toString(uri));
		assert.strictEqual(uri2.query, 'LinkId=518008');
		assert.strictEqual(uri2.query, uri.query);

		uri = URI.parse('https://go.microsoft.com/fwlink/?LinkId=518008&foö&ké¥=üü');
		assert.strictEqual(uri.query, 'LinkId=518008&foö&ké¥=üü');
		assert.strictEqual(URI.toString(uri, true), 'https://go.microsoft.com/fwlink/?LinkId=518008&foö&ké¥=üü');
		assert.strictEqual(URI.toString(uri), 'https://go.microsoft.com/fwlink/?LinkId%3D518008%26fo%C3%B6%26k%C3%A9%C2%A5%3D%C3%BC%C3%BC');

		uri2 = URI.parse(URI.toString(uri));
		assert.strictEqual(uri2.query, 'LinkId=518008&foö&ké¥=üü');
		assert.strictEqual(uri2.query, uri.query);

		// #24849
		uri = URI.parse('https://twitter.com/search?src=typd&q=%23tag');
		assert.strictEqual(URI.toString(uri, true), 'https://twitter.com/search?src=typd&q=%23tag');
	});

    test.skip('class URI cannot represent relative file paths', function () { // FIX

		assert.strictEqual(URI.fromFile('/foo/bar').path, '/foo/bar');
		assert.strictEqual(URI.fromFile('foo/bar').path, '/foo/bar');
		assert.strictEqual(URI.fromFile('./foo/bar').path, '/./foo/bar'); // missing normalization

		const fileUri1 = URI.parse(`file:foo/bar`);
		assert.strictEqual(fileUri1.path, '/foo/bar');
		assert.strictEqual(fileUri1.authority, '');
		
        const uri = fileUri1.toString();
		assert.strictEqual(uri, 'file:///foo/bar');
		
        const fileUri2 = URI.parse(uri);
		assert.strictEqual(fileUri2.path, '/foo/bar');
		assert.strictEqual(fileUri2.authority, '');
	});

    function assertJoined(base: string, fragment: string, expected: string, checkWithUrl: boolean = true) {
		const baseUri = URI.parse(base);
		const newUri = URI.join(baseUri, fragment);
		const actual = URI.toString(newUri, true);
		assert.strictEqual(actual, expected);

		if (checkWithUrl) {
			const actualUrl = new URL(fragment, base).href;
			assert.strictEqual(actualUrl, expected, 'DIFFERENT from URL');
		}
	}

    test.skip('join', () => { // FIX
        assertJoined(('file:///foo/'), '../../bazz', 'file:///bazz');
		assertJoined(('file:///foo'), '../../bazz', 'file:///bazz');
		assertJoined(('file:///foo'), '../../bazz', 'file:///bazz');
		assertJoined(('file:///foo/bar/'), './bazz', 'file:///foo/bar/bazz');
		assertJoined(('file:///foo/bar'), './bazz', 'file:///foo/bar/bazz', false);
		assertJoined(('file:///foo/bar'), 'bazz', 'file:///foo/bar/bazz', false);

		// "auto-path" scheme
		assertJoined(('file:'), 'bazz', 'file:///bazz');
		assertJoined(('http://domain'), 'bazz', 'http://domain/bazz');
		assertJoined(('https://domain'), 'bazz', 'https://domain/bazz');
		assertJoined(('http:'), 'bazz', 'http:/bazz', false);
		assertJoined(('https:'), 'bazz', 'https:/bazz', false);

		// no "auto-path" scheme with and w/o paths
		assertJoined(('foo:/'), 'bazz', 'foo:/bazz');
		assertJoined(('foo://bar/'), 'bazz', 'foo://bar/bazz');

		// no "auto-path" + no path -> error
		assert.throws(() => assertJoined(('foo:'), 'bazz', ''));
		assert.throws(() => new URL('bazz', 'foo:'));
		assert.throws(() => assertJoined(('foo://bar'), 'bazz', ''));

        // const uri = URI.parse('file:///c:/');
        // const joinedUri = URI.join(uri, 'test', 'dir');
        // assert.strictEqual(joinedUri.path, 'c:/test/dir');

        // // Joining nothing should not alter the original URI
        // const joinedUriEmpty = URI.join(uri);
        // assert.strictEqual(joinedUriEmpty.path, uri.path);
    });

    test('join (posix)', function () {
		if (IS_WINDOWS) {
			this.skip();
		}
		assertJoined(('file:///c:/foo/'), '../../bazz', 'file:///bazz', false);
		assertJoined(('file://server/share/c:/'), '../../bazz', 'file://server/bazz', false);
		assertJoined(('file://server/share/c:'), '../../bazz', 'file://server/bazz', false);

		assertJoined(('file://ser/foo/'), '../../bazz', 'file://ser/bazz', false); // Firefox -> Different, Edge, Chrome, Safar -> OK
		assertJoined(('file://ser/foo'), '../../bazz', 'file://ser/bazz', false); // Firefox -> Different, Edge, Chrome, Safar -> OK
	});

	test('join (windows)', function () {
		if (!IS_WINDOWS) {
			this.skip();
		}
		assertJoined(('file:///c:/foo/'), '../../bazz', 'file:///c:/bazz', false);
		assertJoined(('file://server/share/c:/'), '../../bazz', 'file://server/share/bazz', false);
		assertJoined(('file://server/share/c:'), '../../bazz', 'file://server/share/bazz', false);

		assertJoined(('file://ser/foo/'), '../../bazz', 'file://ser/foo/bazz', false);
		assertJoined(('file://ser/foo'), '../../bazz', 'file://ser/foo/bazz', false);

		//https://github.com/microsoft/vscode/issues/93831
		assertJoined('file:///c:/foo/bar', './other/foo.img', 'file:///c:/foo/bar/other/foo.img', false);
	});

    test('URI.toString() wrongly encode IPv6 literals', function () {
        assert.strictEqual(URI.toString(URI.parse('http://[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/index.html')), 'http://[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80/index.html');
		assert.strictEqual(URI.toString(URI.parse('http://user@[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/index.html')), 'http://user@[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80/index.html');
		assert.strictEqual(URI.toString(URI.parse('http://us[er@[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/index.html')), 'http://us%5Ber@[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80/index.html');
	});
});
