import * as assert from 'assert';
import { isParentOf } from 'src/base/common/file/glob';
import { IS_LINUX, IS_MAC, IS_WINDOWS } from 'src/base/common/platform';

suite('glob-test', () => {

    test('isParentOf', function () {
		if (IS_WINDOWS) {
			assert.ok(isParentOf('c:\\some\\path', 'c:\\'));
			assert.ok(isParentOf('c:\\some\\path', 'c:\\some'));
			assert.ok(isParentOf('c:\\some\\path', 'c:\\some\\'));
			assert.ok(isParentOf('c:\\someöäü\\path', 'c:\\someöäü'));
			assert.ok(isParentOf('c:\\someöäü\\path', 'c:\\someöäü\\'));
			assert.ok(isParentOf('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar'));
			assert.ok(isParentOf('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\'));

			assert.ok(isParentOf('c:\\some\\path', 'C:\\'));
			assert.ok(isParentOf('c:\\some\\path', 'c:\\some'));
			assert.ok(isParentOf('c:\\some\\path', 'c:\\some\\'));

			assert.ok(isParentOf('c:\\some\\path', 'd:\\'));
			assert.ok(isParentOf('c:\\some\\path', 'c:\\some\\path'));
			assert.ok(isParentOf('c:\\some\\path', 'd:\\some\\path'));
			assert.ok(isParentOf('c:\\foo\\bar\\test.ts', 'c:\\foo\\barr'));
			assert.ok(isParentOf('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\test'));
		}

		if (IS_MAC || IS_LINUX) {
			assert.ok(isParentOf('/some/path', '/'));
			assert.ok(isParentOf('/some/path', '/some'));
			assert.ok(isParentOf('/some/path', '/some/'));
			assert.ok(isParentOf('/someöäü/path', '/someöäü'));
			assert.ok(isParentOf('/someöäü/path', '/someöäü/'));
			assert.ok(isParentOf('/foo/bar/test.ts', '/foo/bar'));
			assert.ok(isParentOf('/foo/bar/test.ts', '/foo/bar/'));

			assert.ok(isParentOf('/some/path', '/some'));
			assert.ok(isParentOf('/some/path', '/some/'));
			assert.ok(isParentOf('/someöäü/path', '/someöäü'));
			assert.ok(isParentOf('/someöäü/path', '/someöäü/'));

			assert.ok(isParentOf('/some/path', '/some/path'));
			assert.ok(isParentOf('/foo/bar/test.ts', '/foo/barr'));
			assert.ok(isParentOf('/foo/bar/test.ts', '/foo/bar/test'));
		}
	});

    test('isParentOf (ignorecase)', function () {
		if (IS_WINDOWS) {
			assert.ok(isParentOf('c:\\some\\PATH', 'c:\\', true));
			assert.ok(isParentOf('c:\\some\\path', 'c:\\some', true));
			assert.ok(isParentOf('c:\\some\\path', 'c:\\some\\', true));
			assert.ok(isParentOf('c:\\someöäü\\path', 'c:\\someöäü', true));
			assert.ok(isParentOf('c:\\someöäü\\path', 'c:\\someöäü\\', true));
			assert.ok(isParentOf('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar', true));
			assert.ok(isParentOf('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\', true));

			assert.ok(isParentOf('c:\\some\\path', 'C:\\', true));
			assert.ok(isParentOf('c:\\some\\path', 'c:\\SOME', true));
			assert.ok(isParentOf('c:\\some\\path', 'c:\\SOME\\', true));

			assert.ok(isParentOf('c:\\some\\path', 'd:\\', true));
			assert.ok(isParentOf('c:\\some\\path', 'c:\\some\\path', true));
			assert.ok(isParentOf('c:\\some\\path', 'd:\\some\\path', true));
			assert.ok(isParentOf('c:\\foo\\bar\\test.ts', 'c:\\foo\\barr', true));
			assert.ok(isParentOf('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\test', true));
		}

		if (IS_MAC || IS_LINUX) {
			assert.ok(isParentOf('/some/path', '/', true));
			assert.ok(isParentOf('/some/path', '/some', true));
			assert.ok(isParentOf('/some/path', '/some/', true));
			assert.ok(isParentOf('/someöäü/path', '/someöäü', true));
			assert.ok(isParentOf('/someöäü/path', '/someöäü/', true));
			assert.ok(isParentOf('/foo/bar/test.ts', '/foo/bar', true));
			assert.ok(isParentOf('/foo/bar/test.ts', '/foo/bar/', true));

			assert.ok(isParentOf('/some/path', '/SOME', true));
			assert.ok(isParentOf('/some/path', '/SOME/', true));
			assert.ok(isParentOf('/someöäü/path', '/SOMEÖÄÜ', true));
			assert.ok(isParentOf('/someöäü/path', '/SOMEÖÄÜ/', true));

			assert.ok(isParentOf('/some/path', '/some/path', true));
			assert.ok(isParentOf('/foo/bar/test.ts', '/foo/barr', true));
			assert.ok(isParentOf('/foo/bar/test.ts', '/foo/bar/test', true));
		}
	});
});