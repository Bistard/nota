/* eslint-disable local/code-no-json-stringify */
import * as assert from 'assert';
import { toForwardSlash } from 'src/base/common/files/extpath';
import { posix, win32 } from 'src/base/common/files/path';
import { URI } from 'src/base/common/files/uri';
import { IS_WINDOWS, Platform } from 'src/base/common/platform';
import { ReviverRegistrant } from 'src/platform/ipc/common/revive';


suite('URI-test', () => {

	const oldToString = URI.toString;
	URI.toString = function (uri: URI, skipEncoding: boolean = false): string {
		return oldToString(uri, skipEncoding);
	};

    const testStr1 = 'foo://example.com:8042/over/there?name=ferret#nose';
    const testStr2 = 'urn:example:animal:ferret:nose';
    const testStr3 = 'file://d:/dev/program/src/code/common/service/test/file.test.txt';

    test('toString (decoding)', () => {
        assert.strictEqual(URI.toString(URI.parse(testStr1), true), testStr1);
        assert.strictEqual(URI.toString(URI.parse(testStr1)), 'foo://example.com:8042/over/there?name%3Dferret#nose');
        assert.strictEqual(URI.toString(URI.parse(testStr2), true), testStr2);
        assert.strictEqual(URI.toString(URI.parse(testStr2)), 'urn:example%3Aanimal%3Aferret%3Anose');
        assert.strictEqual(URI.toString(URI.parse(testStr3)), testStr3);
    });

    test('parse', () => {
        let value = URI.parse('http:/api/files/test.me?t=1234');
		assert.strictEqual(value.scheme, 'http');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, '/api/files/test.me');
		assert.strictEqual(value.query, 't=1234');
		assert.strictEqual(value.fragment, '');

		value = URI.parse('http://api/files/test.me?t=1234');
		assert.strictEqual(value.scheme, 'http');
		assert.strictEqual(value.authority, 'api');
		assert.strictEqual(value.path, '/files/test.me');
		assert.strictEqual(value.query, 't=1234');
		assert.strictEqual(value.fragment, '');

		value = URI.parse('file:///c:/test/me');
		assert.strictEqual(value.scheme, 'file');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, '/c:/test/me');
		assert.strictEqual(value.fragment, '');
		assert.strictEqual(value.query, '');
		
		value = URI.parse('file://shares/files/c%23/p.cs');
		assert.strictEqual(value.scheme, 'file');
		assert.strictEqual(value.authority, 'shares');
		assert.strictEqual(value.path, '/files/c#/p.cs');
		assert.strictEqual(value.fragment, '');
		assert.strictEqual(value.query, '');
		
		value = URI.parse('file:///c:/Source/Z%C3%BCrich%20or%20Zurich%20(%CB%88zj%CA%8A%C9%99r%C9%AAk,/Code/resources/app/plugins/c%23/plugin.json');
		assert.strictEqual(value.scheme, 'file');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, '/c:/Source/Zürich or Zurich (ˈzjʊərɪk,/Code/resources/app/plugins/c#/plugin.json');
		assert.strictEqual(value.fragment, '');
		assert.strictEqual(value.query, '');

		value = URI.parse('file:///c:/test %25/path');
		assert.strictEqual(value.scheme, 'file');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, '/c:/test %/path');
		assert.strictEqual(value.fragment, '');
		assert.strictEqual(value.query, '');

		value = URI.parse('inmemory:');
		assert.strictEqual(value.scheme, 'inmemory');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, '');
		assert.strictEqual(value.query, '');
		assert.strictEqual(value.fragment, '');

		value = URI.parse('foo:api/files/test');
		assert.strictEqual(value.scheme, 'foo');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, 'api/files/test');
		assert.strictEqual(value.query, '');
		assert.strictEqual(value.fragment, '');

		value = URI.parse('file:?q');
		assert.strictEqual(value.scheme, 'file');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, '/');
		assert.strictEqual(value.query, 'q');
		assert.strictEqual(value.fragment, '');

		value = URI.parse('file:#d');
		assert.strictEqual(value.scheme, 'file');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, '/');
		assert.strictEqual(value.query, '');
		assert.strictEqual(value.fragment, 'd');

		value = URI.parse('f3ile:#d');
		assert.strictEqual(value.scheme, 'f3ile');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, '');
		assert.strictEqual(value.query, '');
		assert.strictEqual(value.fragment, 'd');

		value = URI.parse('foo+bar:path');
		assert.strictEqual(value.scheme, 'foo+bar');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, 'path');
		assert.strictEqual(value.query, '');
		assert.strictEqual(value.fragment, '');

		value = URI.parse('foo-bar:path');
		assert.strictEqual(value.scheme, 'foo-bar');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, 'path');
		assert.strictEqual(value.query, '');
		assert.strictEqual(value.fragment, '');

		value = URI.parse('foo.bar:path');
		assert.strictEqual(value.scheme, 'foo.bar');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, 'path');
		assert.strictEqual(value.query, '');
		assert.strictEqual(value.fragment, '');
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

    test('toFsPath - (windows)', function () {
		if (!IS_WINDOWS) {
            this.skip();
        }
		assert.strictEqual(URI.toFsPath(URI.fromFile('c:\\win\\path')), 'c:\\win\\path');
        assert.strictEqual(URI.toFsPath(URI.fromFile('c:\\win/path')), 'c:\\win\\path');

        assert.strictEqual(URI.toFsPath(URI.fromFile('c:/win/path')), 'c:\\win\\path');
        assert.strictEqual(URI.toFsPath(URI.fromFile('c:/win/path/')), 'c:\\win\\path\\');
        assert.strictEqual(URI.toFsPath(URI.fromFile('C:/win/path')), 'c:\\win\\path');
        assert.strictEqual(URI.toFsPath(URI.fromFile('/c:/win/path')), 'c:\\win\\path');
        assert.strictEqual(URI.toFsPath(URI.fromFile('./c/win/path')), '\\.\\c\\win\\path');
	});

    test('toFsPath - (posix)', function () {
        if (IS_WINDOWS) {
            this.skip();
        }
        assert.strictEqual(URI.toFsPath(URI.fromFile('c:/win/path')), 'c:/win/path');
        assert.strictEqual(URI.toFsPath(URI.fromFile('c:/win/path/')), 'c:/win/path/');
        assert.strictEqual(URI.toFsPath(URI.fromFile('C:/win/path')), 'c:/win/path');
        assert.strictEqual(URI.toFsPath(URI.fromFile('/c:/win/path')), 'c:/win/path');
        assert.strictEqual(URI.toFsPath(URI.fromFile('./c/win/path')), '/./c/win/path');
    });

	test('toFsPath - no `path` when no `path`', () => {
		const value = URI.parse('file://%2Fhome%2Fticino%2Fdesktop%2Fcpluscplus%2Ftest.cpp');
		assert.strictEqual(value.authority, '/home/ticino/desktop/cpluscplus/test.cpp');
		assert.strictEqual(value.path, '/');
		if (IS_WINDOWS) {
			assert.strictEqual(URI.toFsPath(value), '\\');
		} else {
			assert.strictEqual(URI.toFsPath(value), '/');
		}
	});

    test('fromFile (windows)', function () {
        if (!IS_WINDOWS) {
            this.skip();
        }
        
        let value = URI.fromFile('c:\\test\\drive');
			assert.strictEqual(value.path, '/c:/test/drive');
			assert.strictEqual(URI.toString(value), 'file:///c%3A/test/drive');

			value = URI.fromFile('\\\\shäres\\path\\c#\\plugin.json');
			assert.strictEqual(value.scheme, 'file');
			assert.strictEqual(value.authority, 'shäres');
			assert.strictEqual(value.path, '/path/c#/plugin.json');
			assert.strictEqual(value.fragment, '');
			assert.strictEqual(value.query, '');
			assert.strictEqual(URI.toString(value), 'file://sh%C3%A4res/path/c%23/plugin.json');

			value = URI.fromFile('\\\\localhost\\c$\\GitDevelopment\\express');
			assert.strictEqual(value.scheme, 'file');
			assert.strictEqual(value.path, '/c$/GitDevelopment/express');
			assert.strictEqual(URI.toFsPath(value), '\\\\localhost\\c$\\GitDevelopment\\express');
			assert.strictEqual(value.query, '');
			assert.strictEqual(value.fragment, '');
			assert.strictEqual(URI.toString(value), 'file://localhost/c%24/GitDevelopment/express');

			value = URI.fromFile('c:\\test with %\\path');
			assert.strictEqual(value.path, '/c:/test with %/path');
			assert.strictEqual(URI.toString(value), 'file:///c%3A/test%20with%20%25/path');

			value = URI.fromFile('c:\\test with %25\\path');
			assert.strictEqual(value.path, '/c:/test with %25/path');
			assert.strictEqual(URI.toString(value), 'file:///c%3A/test%20with%20%2525/path');

			value = URI.fromFile('c:\\test with %25\\c#code');
			assert.strictEqual(value.path, '/c:/test with %25/c#code');
			assert.strictEqual(URI.toString(value), 'file:///c%3A/test%20with%20%2525/c%23code');

			value = URI.fromFile('\\\\shares');
			assert.strictEqual(value.scheme, 'file');
			assert.strictEqual(value.authority, 'shares');
			assert.strictEqual(value.path, '/'); // slash is always there

			value = URI.fromFile('\\\\shares\\');
			assert.strictEqual(value.scheme, 'file');
			assert.strictEqual(value.authority, 'shares');
			assert.strictEqual(value.path, '/');
    });

    test('fromFile - no path-is-uri check', () => {
		// we don't complain here
		const value = URI.fromFile('file://path/to/file');
		assert.strictEqual(value.scheme, 'file');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, '/file://path/to/file');
	});

    test('fromFile - always slash', () => {

		let value = URI.fromFile('a.file');
		assert.strictEqual(value.scheme, 'file');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, '/a.file');
		assert.strictEqual(URI.toString(value), 'file:///a.file');

		value = URI.parse(URI.toString(value));
		assert.strictEqual(value.scheme, 'file');
		assert.strictEqual(value.authority, '');
		assert.strictEqual(value.path, '/a.file');
		assert.strictEqual(URI.toString(value), 'file:///a.file');
	});

    test('toString - empty URI parse', () => {
        const emptyUri = URI.parse('');
        assert.strictEqual(URI.toString(emptyUri), 'file:///');
    });

    test('toString - only scheme and query', () => {
		const value = URI.parse('stuff:?qüery');
		assert.strictEqual(URI.toString(value), 'stuff:?q%C3%BCery');
	});

	test('toString - upper-case percent espaces', () => {
		const value = URI.parse('file://sh%c3%a4res/path');
		assert.strictEqual(URI.toString(value), 'file://sh%C3%A4res/path');
	});

	test('toString - lower-case windows drive letter', () => {
		assert.strictEqual(URI.toString(URI.parse('untitled:c:/Users/jrieken/Code/abc.txt')), 'untitled:c%3A/Users/jrieken/Code/abc.txt');
		assert.strictEqual(URI.toString(URI.parse('untitled:C:/Users/jrieken/Code/abc.txt')), 'untitled:c%3A/Users/jrieken/Code/abc.txt');
	});

	test('toString - escape all the bits', () => {

		const value = URI.fromFile('/Users/jrieken/Code/_samples/18500/Mödel + Other Thîngß/model.js');
		assert.strictEqual(URI.toString(value), 'file:///Users/jrieken/Code/_samples/18500/M%C3%B6del%20%2B%20Other%20Th%C3%AEng%C3%9F/model.js');
	});

	test('toString - don\'t encode port', () => {
		let value = URI.parse('http://localhost:8080/far');
		assert.strictEqual(URI.toString(value), 'http://localhost:8080/far');

		value = new URI('http', 'löcalhost:8080', '/far', undefined, undefined);
		assert.strictEqual(URI.toString(value), 'http://l%C3%B6calhost:8080/far');
	});

	test('toString - user information in authority', () => {
		let value = URI.parse('http://foo:bar@localhost/far');
		assert.strictEqual(URI.toString(value), 'http://foo:bar@localhost/far');

		value = URI.parse('http://foo@localhost/far');
		assert.strictEqual(URI.toString(value), 'http://foo@localhost/far');

		value = URI.parse('http://foo:bAr@localhost:8080/far');
		assert.strictEqual(URI.toString(value), 'http://foo:bAr@localhost:8080/far');

		value = URI.parse('http://foo@localhost:8080/far');
		assert.strictEqual(URI.toString(value), 'http://foo@localhost:8080/far');

		value = new URI('http', 'föö:bör@löcalhost:8080', '/far', undefined, undefined);
		assert.strictEqual(URI.toString(value), 'http://f%C3%B6%C3%B6:b%C3%B6r@l%C3%B6calhost:8080/far');
	});

    test('toString (http)', () => {
		assert.strictEqual(URI.toString(URI.from({ scheme: 'http', authority: 'www.example.com', path: '/my/path' })), 'http://www.example.com/my/path');
		assert.strictEqual(URI.toString(URI.from({ scheme: 'http', authority: 'www.example.com', path: '/my/path' })), 'http://www.example.com/my/path');
		assert.strictEqual(URI.toString(URI.from({ scheme: 'http', authority: 'www.EXAMPLE.com', path: '/my/path' })), 'http://www.example.com/my/path');
		assert.strictEqual(URI.toString(URI.from({ scheme: 'http', authority: '', path: 'my/path' })), 'http:/my/path');
		assert.strictEqual(URI.toString(URI.from({ scheme: 'http', authority: '', path: '/my/path' })), 'http:/my/path');
		assert.strictEqual(URI.toString(URI.from({ scheme: 'http', authority: 'example.com', path: '/', query: 'variable=true' })), 'http://example.com/?variable%3Dtrue');
		assert.strictEqual(URI.toString(URI.from({ scheme: 'http', authority: 'example.com', path: '/', query: '', fragment: 'variable=true' })), 'http://example.com/#variable%3Dtrue');
	});

	test('toString - (http when encode=FALSE)', () => {
		assert.strictEqual(URI.toString(URI.from({ scheme: 'http', authority: 'example.com', path: '/', query: 'variable=true' }), true), 'http://example.com/?variable=true');
		assert.strictEqual(URI.toString(URI.from({ scheme: 'http', authority: 'example.com', path: '/', query: '', fragment: 'variable=true' }), true), 'http://example.com/#variable=true');
		assert.strictEqual(URI.toString(URI.from({ scheme: 'http', path: '/api/files/test.me', query: 't=1234' }), true), 'http:/api/files/test.me?t=1234');

		const value = URI.parse('file://shares/pröjects/c%23/#l12');
		assert.strictEqual(value.authority, 'shares');
		assert.strictEqual(value.path, '/pröjects/c#/');
		assert.strictEqual(value.fragment, 'l12');
		assert.strictEqual(URI.toString(value), 'file://shares/pr%C3%B6jects/c%23/#l12');
		assert.strictEqual(URI.toString(value, true), 'file://shares/pröjects/c%23/#l12');

		const uri2 = URI.parse(URI.toString(value, true));
		const uri3 = URI.parse(URI.toString(value));
		assert.strictEqual(uri2.authority, uri3.authority);
		assert.strictEqual(uri2.path, uri3.path);
		assert.strictEqual(uri2.query, uri3.query);
		assert.strictEqual(uri2.fragment, uri3.fragment);
	});

    test('with - identity', () => {
		const uri = URI.parse('foo:bar/path');

		let uri2 = URI.with(uri, null!);
		assert.ok(uri === uri2);
		uri2 = URI.with(uri, undefined!);
		assert.ok(uri === uri2);
		uri2 = URI.with(uri, {});
		assert.ok(uri === uri2);
		uri2 = URI.with(uri, { scheme: 'foo', path: 'bar/path' });
		assert.ok(uri === uri2);
	});

	test('with - changes', () => {
        assert.strictEqual(URI.toString(URI.with(URI.parse('before:some/file/path'), { scheme: 'after' })), 'after:some/file/path');
        assert.strictEqual(URI.toString(URI.with(URI.from({ scheme: 's' }), { scheme: 'http', path: '/api/files/test.me', query: 't=1234' })), 'http:/api/files/test.me?t%3D1234');
        assert.strictEqual(URI.toString(URI.with(URI.from({ scheme: 's' }), { scheme: 'http', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' })), 'http:/api/files/test.me?t%3D1234');
        assert.strictEqual(URI.toString(URI.with(URI.from({ scheme: 's' }), { scheme: 'https', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' })), 'https:/api/files/test.me?t%3D1234');
        assert.strictEqual(URI.toString(URI.with(URI.from({ scheme: 's' }), { scheme: 'HTTP', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' })), 'HTTP:/api/files/test.me?t%3D1234');
        assert.strictEqual(URI.toString(URI.with(URI.from({ scheme: 's' }), { scheme: 'HTTPS', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' })), 'HTTPS:/api/files/test.me?t%3D1234');
        assert.strictEqual(URI.toString(URI.with(URI.from({ scheme: 's' }), { scheme: 'boo', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' })), 'boo:/api/files/test.me?t%3D1234');
    });
    
    test('with - remove components #8465', () => {
        assert.strictEqual(URI.toString(URI.with(URI.parse('scheme://authority/path'), { authority: '' })), 'scheme:/path');
        assert.strictEqual(URI.toString(URI.with(URI.with(URI.parse('scheme:/path'), { authority: 'authority' }), { authority: '' })), 'scheme:/path');
        assert.strictEqual(URI.toString(URI.with(URI.with(URI.parse('scheme:/path'), { authority: 'authority' }), { authority: null })), 'scheme:/path');
        assert.strictEqual(URI.toString(URI.with(URI.with(URI.parse('scheme:/path'), { authority: 'authority' }), { path: '' })), 'scheme://authority');
        assert.strictEqual(URI.toString(URI.with(URI.with(URI.parse('scheme:/path'), { authority: 'authority' }), { path: null })), 'scheme://authority');
        assert.strictEqual(URI.toString(URI.with(URI.parse('scheme:/path'), { authority: '' })), 'scheme:/path');
        assert.strictEqual(URI.toString(URI.with(URI.parse('scheme:/path'), { authority: null })), 'scheme:/path');
    });

	test('with - validation', () => {
		const uri = URI.parse('foo:bar/path');
		assert.throws(() => URI.with(uri, { scheme: 'fai:l' }));
		assert.throws(() => URI.with(uri, { scheme: 'fäil' }));
		assert.throws(() => URI.with(uri, { authority: 'fail' }));
		assert.throws(() => URI.with(uri, { path: '//fail' }));
	});

    test('basename - basics', () => {
        const uri = URI.parse('file:///c:/test/dir/file.txt');
        assert.strictEqual(URI.basename(uri), 'file.txt');

        // Without file extension
        const noExtUri = URI.parse('file:///c:/test/dir/file');
        assert.strictEqual(URI.basename(noExtUri), 'file');

        // With multiple periods
        const multiDotUri = URI.parse('file:///c:/test/dir/file.name.ext');
        assert.strictEqual(URI.basename(multiDotUri), 'file.name.ext');
    });

	test('basename - more (windows)', function () {
		if (!IS_WINDOWS) {
			this.skip();
		}
		assert.strictEqual(URI.basename(URI.fromFile('c:\\some\\file\\test.txt')), 'test.txt');
		assert.strictEqual(URI.basename(URI.fromFile('c:\\some\\file')), 'file');
		assert.strictEqual(URI.basename(URI.fromFile('c:\\some\\file\\')), 'file');
		assert.strictEqual(URI.basename(URI.fromFile('C:\\some\\file\\')), 'file');
	});

	test('basename - more (posix)', function () {
		if (IS_WINDOWS) {
			this.skip();
		}
		assert.strictEqual(URI.basename(URI.fromFile('/some/file/test.txt')), 'test.txt');
		assert.strictEqual(URI.basename(URI.fromFile('/some/file/')), 'file');
		assert.strictEqual(URI.basename(URI.fromFile('/some/file')), 'file');
		assert.strictEqual(URI.basename(URI.fromFile('/some')), 'some');
	});

	test('basename - more (URI)', () => {
		assert.strictEqual(URI.basename(URI.parse('foo://a/some/file/test.txt')), 'test.txt');
		assert.strictEqual(URI.basename(URI.parse('foo://a/some/file/')), 'file');
		assert.strictEqual(URI.basename(URI.parse('foo://a/some/file')), 'file');
		assert.strictEqual(URI.basename(URI.parse('foo://a/some')), 'some');
		assert.strictEqual(URI.basename(URI.parse('foo://a/')), '');
		assert.strictEqual(URI.basename(URI.parse('foo://a')), '');
	});

    test('extname - basics', () => {
        const uri = URI.parse('file:///c:/test/dir/file.txt');
        assert.strictEqual(URI.extname(uri), '.txt');

        // Without file extension
        const noExtUri = URI.parse('file:///c:/test/dir/file');
        assert.strictEqual(URI.extname(noExtUri), '');

        // With multiple periods
        const multiDotUri = URI.parse('file:///c:/test/dir/file.name.ext');
        assert.strictEqual(URI.extname(multiDotUri), '.ext');
    });

	test('dirname - more (windows)', function () {
		if (!IS_WINDOWS) {
			this.skip();
		}

		assert.strictEqual(URI.toString(URI.dirname(URI.fromFile('c:\\some\\file\\test.txt'))), 'file:///c%3A/some/file');
		assert.strictEqual(URI.toString(URI.dirname(URI.fromFile('c:\\some\\file'))), 'file:///c%3A/some');
		assert.strictEqual(URI.toString(URI.dirname(URI.fromFile('c:\\some\\file\\'))), 'file:///c%3A/some');
		assert.strictEqual(URI.toString(URI.dirname(URI.fromFile('c:\\some'))), 'file:///c%3A/');
		assert.strictEqual(URI.toString(URI.dirname(URI.fromFile('C:\\some'))), 'file:///c%3A/');
		assert.strictEqual(URI.toString(URI.dirname(URI.fromFile('c:\\'))), 'file:///c%3A/');
	});

	test('dirname - more (posix)', function () {
		if (IS_WINDOWS) {
			this.skip();
		}

		assert.strictEqual(URI.toString(URI.dirname(URI.fromFile('/some/file/test.txt'))), 'file:///some/file');
		assert.strictEqual(URI.toString(URI.dirname(URI.fromFile('/some/file/'))), 'file:///some');
		assert.strictEqual(URI.toString(URI.dirname(URI.fromFile('/some/file'))), 'file:///some');
	});

	test('dirname - more (URI)', () => {
		assert.strictEqual(URI.toString(URI.dirname(URI.parse('foo://a/some/file/test.txt'))), 'foo://a/some/file');
		assert.strictEqual(URI.toString(URI.dirname(URI.parse('foo://a/some/file/'))), 'foo://a/some');
		assert.strictEqual(URI.toString(URI.dirname(URI.parse('foo://a/some/file'))), 'foo://a/some');
		assert.strictEqual(URI.toString(URI.dirname(URI.parse('foo://a/some'))), 'foo://a/');
		assert.strictEqual(URI.toString(URI.dirname(URI.parse('foo://a/'))), 'foo://a/');
		assert.strictEqual(URI.toString(URI.dirname(URI.parse('foo://a'))), 'foo://a');

		// does not explode (https://github.com/microsoft/vscode/issues/41987)
		URI.dirname(URI.from({ scheme: 'file', authority: '/users/someone/portal.h' }));

		assert.strictEqual(URI.toString(URI.dirname(URI.parse('foo://a/b/c?q'))), 'foo://a/b?q');
	});

    test('revive', () => {
        const reviver = new ReviverRegistrant();
		reviver.initRegistrations();
		
		const obj = { scheme: 'http', authority: 'host', path: '/parts', query: 'query', fragment: 'fragment' };
        const uri = URI.revive(obj, reviver);
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
			const clone = URI.revive(JSON.parse(data), reviver);

			assert.strictEqual(clone.scheme, value.scheme);
			assert.strictEqual(clone.authority, value.authority);
			assert.strictEqual(clone.path, value.path);
			assert.strictEqual(clone.query, value.query);
			assert.strictEqual(clone.fragment, value.fragment);
			assert.strictEqual(URI.toFsPath(clone), URI.toFsPath(value));
			assert.strictEqual(URI.toString(clone), URI.toString(value));
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

    test('correctFileUriToFilePath2', () => {

		const test = (input: string, expected: string) => {
			const value = URI.parse(input);
			assert.strictEqual(URI.toFsPath(value), expected, 'Result for ' + input);
			const value2 = URI.fromFile(URI.toFsPath(value));
			assert.strictEqual(URI.toFsPath(value2), expected, 'Result for ' + input);
			assert.strictEqual(URI.toString(value), URI.toString(value2));
		};

		test('file:///c:/alex.txt', IS_WINDOWS ? 'c:\\alex.txt' : 'c:/alex.txt');
		test('file:///c:/Source/Z%C3%BCrich%20or%20Zurich%20(%CB%88zj%CA%8A%C9%99r%C9%AAk,/Code/resources/app/plugins', IS_WINDOWS ? 'c:\\Source\\Zürich or Zurich (ˈzjʊərɪk,\\Code\\resources\\app\\plugins' : 'c:/Source/Zürich or Zurich (ˈzjʊərɪk,/Code/resources/app/plugins');
		test('file://monacotools/folder/isi.txt', IS_WINDOWS ? '\\\\monacotools\\folder\\isi.txt' : '//monacotools/folder/isi.txt');
		test('file://monacotools1/certificates/SSL/', IS_WINDOWS ? '\\\\monacotools1\\certificates\\SSL\\' : '//monacotools1/certificates/SSL/');
	});

    test('class URI cannot represent relative file paths', function () {

		assert.strictEqual(URI.fromFile('/foo/bar').path, '/foo/bar');
		assert.strictEqual(URI.fromFile('foo/bar').path, '/foo/bar');
		assert.strictEqual(URI.fromFile('./foo/bar').path, '/./foo/bar'); // missing normalization

		const fileUri1 = URI.parse(`file:foo/bar`);
		assert.strictEqual(fileUri1.path, '/foo/bar');
		assert.strictEqual(fileUri1.authority, '');
		
        const uri = URI.toString(fileUri1);
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

    test('join', () => {
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

	test('join - more', () => {
		if (IS_WINDOWS) {
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('c:\\foo\\bar'), '/file.js')), 'file:///c%3A/foo/bar/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('c:\\foo\\bar\\'), 'file.js')), 'file:///c%3A/foo/bar/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('c:\\foo\\bar\\'), '/file.js')), 'file:///c%3A/foo/bar/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('c:\\'), '/file.js')), 'file:///c%3A/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('c:\\'), 'bar/file.js')), 'file:///c%3A/bar/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('c:\\foo'), './file.js')), 'file:///c%3A/foo/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('c:\\foo'), '/./file.js')), 'file:///c%3A/foo/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('C:\\foo'), '../file.js')), 'file:///c%3A/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('C:\\foo\\.'), '../file.js')), 'file:///c%3A/file.js');
		} else {
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('/foo/bar'), '/file.js')), 'file:///foo/bar/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('/foo/bar'), 'file.js')), 'file:///foo/bar/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('/foo/bar/'), '/file.js')), 'file:///foo/bar/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('/'), '/file.js')), 'file:///file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('/foo/bar'), './file.js')), 'file:///foo/bar/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('/foo/bar'), '/./file.js')), 'file:///foo/bar/file.js');
			assert.strictEqual(URI.toString(URI.join(URI.fromFile('/foo/bar'), '../file.js')), 'file:///foo/file.js');
		}
		assert.strictEqual(URI.toString(URI.join(URI.parse('foo://a/foo/bar'))), 'foo://a/foo/bar');
		assert.strictEqual(URI.toString(URI.join(URI.parse('foo://a/foo/bar'), '/file.js')), 'foo://a/foo/bar/file.js');
		assert.strictEqual(URI.toString(URI.join(URI.parse('foo://a/foo/bar'), 'file.js')), 'foo://a/foo/bar/file.js');
		assert.strictEqual(URI.toString(URI.join(URI.parse('foo://a/foo/bar/'), '/file.js')), 'foo://a/foo/bar/file.js');
		assert.strictEqual(URI.toString(URI.join(URI.parse('foo://a/'), '/file.js')), 'foo://a/file.js');
		assert.strictEqual(URI.toString(URI.join(URI.parse('foo://a/foo/bar/'), './file.js')), 'foo://a/foo/bar/file.js');
		assert.strictEqual(URI.toString(URI.join(URI.parse('foo://a/foo/bar/'), '/./file.js')), 'foo://a/foo/bar/file.js');
		assert.strictEqual(URI.toString(URI.join(URI.parse('foo://a/foo/bar/'), '../file.js')), 'foo://a/foo/file.js');

		assert.strictEqual(
			URI.toString(URI.join(URI.from({ scheme: 'myScheme', authority: 'authority', path: '/path', query: 'query', fragment: 'fragment' }), '/file.js')),
			'myScheme://authority/path/file.js?query#fragment');
	});

	function assertEqualURI(actual: URI, expected: URI, message?: string, /** ignoreCase?: boolean */) {
		if (!URI.equals(expected, actual)) {
			assert.strictEqual(URI.toString(actual), URI.toString(expected), message);
		}
	}

	function assertRelativePath(u1: URI, u2: URI, expectedPath: string | undefined, ignoreJoin?: boolean, /** ignoreCase?: boolean */) {
		assert.strictEqual(
			URI.relative(u1, u2), 
			expectedPath, 
			`from '${URI.toString(u1)}' to '${URI.toString(u2)}'`,
		);
		
		// if (isString(expectedPath) && !ignoreJoin) {
		// 	assertEqualURI(
		// 		removeTrailingPathSeparator(URI.join(u1, expectedPath)), 
		// 		removeTrailingPathSeparator(u2), 
		// 		'`join` on `relative` should be equal',
		// 	);
		// }
	}

	test('relative (common)', () => {
		assertRelativePath(URI.parse('foo://a/foo'), URI.parse('foo://a/foo/bar'), 'bar');
		assertRelativePath(URI.parse('foo://a/foo'), URI.parse('foo://a/foo/bar/'), 'bar');
		assertRelativePath(URI.parse('foo://a/foo'), URI.parse('foo://a/foo/bar/goo'), 'bar/goo');
		assertRelativePath(URI.parse('foo://a/'), URI.parse('foo://a/foo/bar/goo'), 'foo/bar/goo');
		assertRelativePath(URI.parse('foo://a/foo/xoo'), URI.parse('foo://a/foo/bar'), '../bar');
		assertRelativePath(URI.parse('foo://a/foo/xoo/yoo'), URI.parse('foo://a'), '../../..', true);
		assertRelativePath(URI.parse('foo://a/foo'), URI.parse('foo://a/foo/'), '');
		assertRelativePath(URI.parse('foo://a/foo/'), URI.parse('foo://a/foo'), '');
		assertRelativePath(URI.parse('foo://a/foo/'), URI.parse('foo://a/foo/'), '');
		assertRelativePath(URI.parse('foo://a/foo'), URI.parse('foo://a/foo'), '');
		assertRelativePath(URI.parse('foo://a'), URI.parse('foo://a'), '', true);
		assertRelativePath(URI.parse('foo://a/'), URI.parse('foo://a/'), '');
		assertRelativePath(URI.parse('foo://a/'), URI.parse('foo://a'), '', true);
		assertRelativePath(URI.parse('foo://a/foo?q'), URI.parse('foo://a/foo/bar#h'), 'bar', true);
		assertRelativePath(URI.parse('foo://'), URI.parse('foo://a/b'), undefined);
		assertRelativePath(URI.parse('foo://a2/b'), URI.parse('foo://a/b'), undefined);
		assertRelativePath(URI.parse('goo://a/b'), URI.parse('foo://a/b'), undefined);

		// @Bistard these unit test need to be enabled when supporing ignorecase in `relative`
		// assertRelativePath(URI.parse('foo://a/foo'), URI.parse('foo://A/FOO/bar/goo'), 'bar/goo', false, /** true */);
		// assertRelativePath(URI.parse('foo://a/foo'), URI.parse('foo://A/FOO/BAR/GOO'), 'BAR/GOO', false, /** true */);
		// assertRelativePath(URI.parse('foo://a/foo/xoo'), URI.parse('foo://A/FOO/BAR/GOO'), '../BAR/GOO', false, /** true */);
		// assertRelativePath(URI.parse('foo:///c:/a/foo'), URI.parse('foo:///C:/a/foo/xoo/'), 'xoo', false, /** true */);
	});

	test('relative (windows)', function () {
		if (!IS_WINDOWS) {
			this.skip();
		}

		assertRelativePath(URI.fromFile('c:\\foo\\bar'), URI.fromFile('c:\\foo\\bar'), '');
		assertRelativePath(URI.fromFile('c:\\foo\\bar\\huu'), URI.fromFile('c:\\foo\\bar'), '..');
		assertRelativePath(URI.fromFile('c:\\foo\\bar\\a1\\a2'), URI.fromFile('c:\\foo\\bar'), '../..');
		assertRelativePath(URI.fromFile('c:\\foo\\bar\\'), URI.fromFile('c:\\foo\\bar\\a1\\a2'), 'a1/a2');
		assertRelativePath(URI.fromFile('c:\\foo\\bar\\'), URI.fromFile('c:\\foo\\bar\\a1\\a2\\'), 'a1/a2');
		assertRelativePath(URI.fromFile('c:\\'), URI.fromFile('c:\\foo\\bar'), 'foo/bar');
		assertRelativePath(URI.fromFile('\\\\server\\share\\some\\'), URI.fromFile('\\\\server\\share\\some\\path'), 'path');
		assertRelativePath(URI.fromFile('\\\\server\\share\\some\\'), URI.fromFile('\\\\server\\share2\\some\\path'), '../../share2/some/path', true); // ignore joinPath assert: path.join is not root aware
	});

	test('relative (posix)', function () {
		if (IS_WINDOWS) {
			this.skip();
		}

		assertRelativePath(URI.fromFile('/a/foo'), URI.fromFile('/a/foo/bar'), 'bar');
		assertRelativePath(URI.fromFile('/a/foo'), URI.fromFile('/a/foo/bar/'), 'bar');
		assertRelativePath(URI.fromFile('/a/foo'), URI.fromFile('/a/foo/bar/goo'), 'bar/goo');
		assertRelativePath(URI.fromFile('/a/'), URI.fromFile('/a/foo/bar/goo'), 'foo/bar/goo');
		assertRelativePath(URI.fromFile('/'), URI.fromFile('/a/foo/bar/goo'), 'a/foo/bar/goo');
		assertRelativePath(URI.fromFile('/a/foo/xoo'), URI.fromFile('/a/foo/bar'), '../bar');
		assertRelativePath(URI.fromFile('/a/foo/xoo/yoo'), URI.fromFile('/a'), '../../..');
		assertRelativePath(URI.fromFile('/a/foo'), URI.fromFile('/a/foo/'), '');
		assertRelativePath(URI.fromFile('/a/foo'), URI.fromFile('/b/foo/'), '../../b/foo');
	});

	function assertResolve(u1: URI, path: string, expected: URI) {
		const actual = URI.resolve(u1, path);
		assertEqualURI(actual, expected, `from ${u1.toString()} and ${path}`);

		const p = path.indexOf('/') !== -1 ? posix : win32;
		if (!p.isAbsolute(path)) {
			let expectedPath = IS_WINDOWS ? toForwardSlash(path) : path;
			expectedPath = expectedPath.startsWith('./') ? expectedPath.substr(2) : expectedPath;
			assert.strictEqual(URI.relative(u1, actual), expectedPath, `relative (${u1.toString()}) on actual (${actual.toString()}) should be to path (${expectedPath})`);
		}
	}
	
	test('resolve (common)', function () {
		assertResolve(URI.parse('foo://server/foo/bar'), 'file.js', URI.parse('foo://server/foo/bar/file.js'));
		assertResolve(URI.parse('foo://server/foo/bar'), './file.js', URI.parse('foo://server/foo/bar/file.js'));
		assertResolve(URI.parse('foo://server/foo/bar'), './file.js', URI.parse('foo://server/foo/bar/file.js'));
		assertResolve(URI.parse('foo://server/foo/bar'), 'c:\\a1\\b1', URI.parse('foo://server/c:/a1/b1'));
		assertResolve(URI.parse('foo://server/foo/bar'), 'c:\\', URI.parse('foo://server/c:'));
	});

	test('resolve (windows)', function () {
		if (!IS_WINDOWS) {
			this.skip();
		}

		assertResolve(URI.fromFile('c:\\foo\\bar'), 'file.js', URI.fromFile('c:\\foo\\bar\\file.js'));
		assertResolve(URI.fromFile('c:\\foo\\bar'), 't\\file.js', URI.fromFile('c:\\foo\\bar\\t\\file.js'));
		assertResolve(URI.fromFile('c:\\foo\\bar'), '.\\t\\file.js', URI.fromFile('c:\\foo\\bar\\t\\file.js'));
		assertResolve(URI.fromFile('c:\\foo\\bar'), 'a1/file.js', URI.fromFile('c:\\foo\\bar\\a1\\file.js'));
		assertResolve(URI.fromFile('c:\\foo\\bar'), './a1/file.js', URI.fromFile('c:\\foo\\bar\\a1\\file.js'));
		assertResolve(URI.fromFile('c:\\foo\\bar'), '\\b1\\file.js', URI.fromFile('c:\\b1\\file.js'));
		assertResolve(URI.fromFile('c:\\foo\\bar'), '/b1/file.js', URI.fromFile('c:\\b1\\file.js'));
		assertResolve(URI.fromFile('c:\\foo\\bar\\'), 'file.js', URI.fromFile('c:\\foo\\bar\\file.js'));

		assertResolve(URI.fromFile('c:\\'), 'file.js', URI.fromFile('c:\\file.js'));
		assertResolve(URI.fromFile('c:\\'), '\\b1\\file.js', URI.fromFile('c:\\b1\\file.js'));
		assertResolve(URI.fromFile('c:\\'), '/b1/file.js', URI.fromFile('c:\\b1\\file.js'));
		assertResolve(URI.fromFile('c:\\'), 'd:\\foo\\bar.txt', URI.fromFile('d:\\foo\\bar.txt'));

		assertResolve(URI.fromFile('\\\\server\\share\\some\\'), 'b1\\file.js', URI.fromFile('\\\\server\\share\\some\\b1\\file.js'));
		assertResolve(URI.fromFile('\\\\server\\share\\some\\'), '\\file.js', URI.fromFile('\\\\server\\share\\file.js'));

		assertResolve(URI.fromFile('c:\\'), '\\\\server\\share\\some\\', URI.fromFile('\\\\server\\share\\some'));
		assertResolve(URI.fromFile('\\\\server\\share\\some\\'), 'c:\\', URI.fromFile('c:\\'));
	});

	test('resolve (posix)', function () {
		if (IS_WINDOWS) {
			this.skip();
		}

		assertResolve(URI.fromFile('/foo/bar'), 'file.js', URI.fromFile('/foo/bar/file.js'));
		assertResolve(URI.fromFile('/foo/bar'), './file.js', URI.fromFile('/foo/bar/file.js'));
		assertResolve(URI.fromFile('/foo/bar'), '/file.js', URI.fromFile('/file.js'));
		assertResolve(URI.fromFile('/foo/bar/'), 'file.js', URI.fromFile('/foo/bar/file.js'));
		assertResolve(URI.fromFile('/'), 'file.js', URI.fromFile('/file.js'));
		assertResolve(URI.fromFile(''), './file.js', URI.fromFile('/file.js'));
		assertResolve(URI.fromFile(''), '/file.js', URI.fromFile('/file.js'));
	});

    test('URI.toString() wrongly encode IPv6 literals', function () {
        assert.strictEqual(URI.toString(URI.parse('http://[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/index.html')), 'http://[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80/index.html');
		assert.strictEqual(URI.toString(URI.parse('http://user@[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/index.html')), 'http://user@[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80/index.html');
		assert.strictEqual(URI.toString(URI.parse('http://us[er@[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/index.html')), 'http://us%5Ber@[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80/index.html');
	});

	test('isParentOf', () => {
		if (IS_WINDOWS) {
			assert.ok(URI.isParentOf(URI.fromFile('c:\\foo'), URI.fromFile('c:')));
			assert.ok(URI.isParentOf(URI.fromFile('c:\\foo\\bar'), URI.fromFile('c:')));
			assert.ok(URI.isParentOf(URI.fromFile('c:\\foo\\bar'), URI.fromFile('c:\\foo')));
			assert.ok(!URI.isParentOf(URI.fromFile('c:\\foo\\bar'), URI.fromFile('c:\\foo\\bar')));
			assert.ok(!URI.isParentOf(URI.fromFile('c:\\foo\\foo'), URI.fromFile('c:\\foo\\bar')));
			assert.ok(!URI.isParentOf(URI.fromFile('c:\\foo'), URI.fromFile('c:\\foo\\bar')));
		} else {
			assert.ok(URI.isParentOf(URI.fromFile('/foo'), URI.fromFile('')));
			assert.ok(URI.isParentOf(URI.fromFile('/foo/bar'), URI.fromFile('')));
			assert.ok(URI.isParentOf(URI.fromFile('/foo/bar'), URI.fromFile('/foo')));
			assert.ok(!URI.isParentOf(URI.fromFile('/foo/bar'), URI.fromFile('/foo/bar')));
			assert.ok(!URI.isParentOf(URI.fromFile('/foo/foo'), URI.fromFile('/foo/bar')));
			assert.ok(!URI.isParentOf(URI.fromFile('/foo'), URI.fromFile('/foo/bar')));
		}
		
		assert.ok(URI.isParentOf(URI.parse('foo//bar'), URI.parse('foo')));
		assert.ok(URI.isParentOf(URI.parse('foo//foo//bar'), URI.parse('foo')));
		assert.ok(URI.isParentOf(URI.parse('foo//foo//bar'), URI.parse('foo//foo')));
		assert.ok(!URI.isParentOf(URI.parse('foo//foo//bar'), URI.parse('foo//foo//bar')));
		assert.ok(!URI.isParentOf(URI.parse('foo//foo//foo'), URI.parse('foo//foo//bar')));
		assert.ok(!URI.isParentOf(URI.parse('foo//foo'), URI.parse('foo//foo//bar')));
		
		if (IS_WINDOWS) {
			assert.ok(URI.isParentOf(URI.fromFile('file:///c:/foo/:foo//bar'), URI.fromFile('file:///c:/foo/:foo')));
			assert.ok(URI.isParentOf(URI.fromFile('file:///c:/foo/:foo//foo//bar'), URI.fromFile('file:///c:/foo/:foo')));
			assert.ok(URI.isParentOf(URI.fromFile('file:///c:/foo/:foo//foo//bar'), URI.fromFile('file:///c:/foo/:foo//foo')));
			assert.ok(!URI.isParentOf(URI.fromFile('file:///c:/foo/:foo//foo//bar'), URI.fromFile('file:///c:/foo/:foo//foo//bar')));
			assert.ok(!URI.isParentOf(URI.fromFile('file:///c:/foo/:foo//foo//foo'), URI.fromFile('file:///c:/foo/:foo//foo//bar')));
			assert.ok(!URI.isParentOf(URI.fromFile('file:///c:/foo/:foo//foo'), URI.fromFile('file:///c:/foo/:foo//foo//bar')));
		} else {
			assert.ok(URI.isParentOf(URI.fromFile('file:///foo/:foo//bar'), URI.fromFile('file:///foo/:foo')));
			assert.ok(URI.isParentOf(URI.fromFile('file:///foo/:foo//foo//bar'), URI.fromFile('file:///foo/:foo')));
			assert.ok(URI.isParentOf(URI.fromFile('file:///foo/:foo//foo//bar'), URI.fromFile('file:///foo/:foo//foo')));
			assert.ok(!URI.isParentOf(URI.fromFile('file:///foo/:foo//foo//bar'), URI.fromFile('file:///foo/:foo//foo//bar')));
			assert.ok(!URI.isParentOf(URI.fromFile('file:///foo/:foo//foo//foo'), URI.fromFile('file:///foo/:foo//foo//bar')));
			assert.ok(!URI.isParentOf(URI.fromFile('file:///foo/:foo//foo'), URI.fromFile('file:///foo/:foo//foo//bar')));
		}
	});

	test('equals', () => {
		const fileURI = IS_WINDOWS ? URI.fromFile('c:\\foo\\bar') : URI.fromFile('/foo/bar');
		const fileURI2 = IS_WINDOWS ? URI.fromFile('C:\\foo\\Bar') : URI.fromFile('/foo/Bar');
		
		assert.strictEqual(URI.equals(fileURI, fileURI, true), true);
		assert.strictEqual(URI.equals(fileURI, fileURI, false), true);
		assert.strictEqual(URI.equals(fileURI, fileURI, false), true);
		assert.strictEqual(URI.equals(fileURI, fileURI2, true), true);
		assert.strictEqual(URI.equals(fileURI, fileURI2, false), false);
		
		const fileURI3 = URI.parse('foo://server:453/foo/bar');
		const fileURI4 = URI.parse('foo://server:453/foo/Bar');
		assert.strictEqual(URI.equals(fileURI3, fileURI3, true), true);
		assert.strictEqual(URI.equals(fileURI3, fileURI3, false), true);
		assert.strictEqual(URI.equals(fileURI3, fileURI3, false), true);
		assert.strictEqual(URI.equals(fileURI3, fileURI4, true), true);
		assert.strictEqual(URI.equals(fileURI3, fileURI4, false), false);

		assert.strictEqual(URI.equals(fileURI, fileURI3, true), false);

		assert.strictEqual(URI.equals(URI.parse('file://server'), URI.parse('file://server/'), true), true);
		assert.strictEqual(URI.equals(URI.parse('http://server'), URI.parse('http://server/'), true), true);
		assert.strictEqual(URI.equals(URI.parse('foo://server'), URI.parse('foo://server/'), true), false); // only selected scheme have / as the default path
		assert.strictEqual(URI.equals(URI.parse('foo://server/foo'), URI.parse('foo://server/foo/'), true), false);
		assert.strictEqual(URI.equals(URI.parse('foo://server/foo'), URI.parse('foo://server/foo?'), true), true);

		const fileURI5 = URI.parse('foo://server:453/foo/bar?q=1');
		const fileURI6 = URI.parse('foo://server:453/foo/bar#xy');

		assert.strictEqual(URI.equals(fileURI5, fileURI5, true), true);
		assert.strictEqual(URI.equals(fileURI5, fileURI3, true), false);
		assert.strictEqual(URI.equals(fileURI6, fileURI6, true), true);
		assert.strictEqual(URI.equals(fileURI6, fileURI5, true), false);
		assert.strictEqual(URI.equals(fileURI6, fileURI3, true), false);
	});

	test('distinctParents', () => {

		// Basic
		let resources = [
			URI.fromFile('/some/folderA/file.txt'),
			URI.fromFile('/some/folderB/file.txt'),
			URI.fromFile('/some/folderC/file.txt')
		];

		let distinct = URI.distinctParents(resources);
		assert.strictEqual(distinct.length, 3);
		assert.strictEqual(distinct[0]!.toString(), resources[0]!.toString());
		assert.strictEqual(distinct[1]!.toString(), resources[1]!.toString());
		assert.strictEqual(distinct[2]!.toString(), resources[2]!.toString());

		// Parent / Child
		resources = [
			URI.fromFile('/some/folderA'),
			URI.fromFile('/some/folderA/file.txt'),
			URI.fromFile('/some/folderA/child/file.txt'),
			URI.fromFile('/some/folderA2/file.txt'),
			URI.fromFile('/some/file.txt')
		];

		distinct = URI.distinctParents(resources);
		assert.strictEqual(distinct.length, 3);
		assert.strictEqual(distinct[0]!.toString(), resources[0]!.toString());
		assert.strictEqual(distinct[1]!.toString(), resources[3]!.toString());
		assert.strictEqual(distinct[2]!.toString(), resources[4]!.toString());
	});

	test('distinctParentsByUri', () => {
		type TestItem = { uri: URI };
		const getUri = (item: TestItem) => item.uri;
	
		// Basic test case with distinct URIs
		let items: TestItem[] = [
			{ uri: URI.fromFile('/some/folderA/file.txt') },
			{ uri: URI.fromFile('/some/folderB/file.txt') },
			{ uri: URI.fromFile('/some/folderC/file.txt') }
		];
	
		let distinct = URI.distinctParentsByUri(items, getUri);
		assert.strictEqual(distinct.length, 3);
		assert.strictEqual(distinct[0]!.uri.toString(), items[0]!.uri.toString());
		assert.strictEqual(distinct[1]!.uri.toString(), items[1]!.uri.toString());
		assert.strictEqual(distinct[2]!.uri.toString(), items[2]!.uri.toString());
	
		// More case with parent and child URIs
		items = [
			{ uri: URI.fromFile('/some/folderA') },
			{ uri: URI.fromFile('/some/folderA/file.txt') },
			{ uri: URI.fromFile('/some/folderA/child/file.txt') },
			{ uri: URI.fromFile('/some/folderA2/file.txt') },
			{ uri: URI.fromFile('/some/file.txt') }
		];
	
		distinct = URI.distinctParentsByUri(items, getUri);
		assert.strictEqual(distinct.length, 3);
		assert.strictEqual(distinct[0]!.uri.toString(), items[0]!.uri.toString());
		assert.strictEqual(distinct[1]!.uri.toString(), items[3]!.uri.toString());
		assert.strictEqual(distinct[2]!.uri.toString(), items[4]!.uri.toString());
	});

	suite('URI.tildify', () => {
		const winFileUri = URI.fromFile('c:/some/folder/file.txt');
		const nixFileUri = URI.fromFile('/some/folder/file.txt');
		const nixBadFileUri = URI.from({ scheme: 'nota', authority: 'file', path: '//some/folder/file.txt' });
		const uncFileUri = URI.with(winFileUri, { authority: 'auth' });
		const remoteFileUri = URI.with(nixFileUri, { scheme: 'nota-test', authority: 'auth' });

		test('basic', () => {
			assert.strictEqual(URI.tildify(winFileUri, { os: Platform.Windows }), 'C:\\some\\folder\\file.txt');
			assert.strictEqual(URI.tildify(winFileUri, { os: Platform.Mac }), 'c:/some/folder/file.txt');
			assert.strictEqual(URI.tildify(winFileUri, { os: Platform.Linux }), 'c:/some/folder/file.txt');

			assert.strictEqual(URI.tildify(nixFileUri, { os: Platform.Windows }), '\\some\\folder\\file.txt');
			assert.strictEqual(URI.tildify(nixFileUri, { os: Platform.Mac }), '/some/folder/file.txt');
			assert.strictEqual(URI.tildify(nixFileUri, { os: Platform.Linux }), '/some/folder/file.txt');

			assert.strictEqual(URI.tildify(uncFileUri, { os: Platform.Windows }), '\\\\auth\\c:\\some\\folder\\file.txt');
			assert.strictEqual(URI.tildify(uncFileUri, { os: Platform.Mac }), '/auth/c:/some/folder/file.txt');
			assert.strictEqual(URI.tildify(uncFileUri, { os: Platform.Linux }), '/auth/c:/some/folder/file.txt');

			assert.strictEqual(URI.tildify(remoteFileUri, { os: Platform.Windows }), '\\some\\folder\\file.txt');
			assert.strictEqual(URI.tildify(remoteFileUri, { os: Platform.Mac }), '/some/folder/file.txt');
			assert.strictEqual(URI.tildify(remoteFileUri, { os: Platform.Linux }), '/some/folder/file.txt');
		});

		test('tildify', () => {
			const nixUserHome = URI.fromFile('/some');
			const remoteUserHome = URI.with(nixUserHome, { scheme: 'nota-test', authority: 'auth' });

			assert.strictEqual(URI.tildify(nixFileUri, { os: Platform.Windows, tildify: { userHome: nixUserHome } }), '\\some\\folder\\file.txt');
			assert.strictEqual(URI.tildify(nixFileUri, { os: Platform.Mac, tildify: { userHome: nixUserHome } }), '~/folder/file.txt');
			assert.strictEqual(URI.tildify(nixBadFileUri, { os: Platform.Mac, tildify: { userHome: nixUserHome } }), '/some/folder/file.txt');
			assert.strictEqual(URI.tildify(nixFileUri, { os: Platform.Linux, tildify: { userHome: nixUserHome } }), '~/folder/file.txt');

			assert.strictEqual(URI.tildify(nixFileUri, { os: Platform.Windows, tildify: { userHome: remoteUserHome } }), '\\some\\folder\\file.txt');
			assert.strictEqual(URI.tildify(nixFileUri, { os: Platform.Mac, tildify: { userHome: remoteUserHome } }), '~/folder/file.txt');
			assert.strictEqual(URI.tildify(nixFileUri, { os: Platform.Linux, tildify: { userHome: remoteUserHome } }), '~/folder/file.txt');

			const nixUntitledUri = URI.with(nixFileUri, { scheme: 'untitled' });

			assert.strictEqual(URI.tildify(nixUntitledUri, { os: Platform.Windows, tildify: { userHome: nixUserHome } }), '\\some\\folder\\file.txt');
			assert.strictEqual(URI.tildify(nixUntitledUri, { os: Platform.Mac, tildify: { userHome: nixUserHome } }), '~/folder/file.txt');
			assert.strictEqual(URI.tildify(nixUntitledUri, { os: Platform.Linux, tildify: { userHome: nixUserHome } }), '~/folder/file.txt');

			assert.strictEqual(URI.tildify(nixUntitledUri, { os: Platform.Windows, tildify: { userHome: remoteUserHome } }), '\\some\\folder\\file.txt');
			assert.strictEqual(URI.tildify(nixUntitledUri, { os: Platform.Mac, tildify: { userHome: remoteUserHome } }), '~/folder/file.txt');
			assert.strictEqual(URI.tildify(nixUntitledUri, { os: Platform.Linux, tildify: { userHome: remoteUserHome } }), '~/folder/file.txt');
		});
	});
});
