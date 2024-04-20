import * as assert from 'assert';
import { isPathSeparator, toForwardSlash, toPosixPath } from 'src/base/common/files/extpath';

suite('extpath-test', function () {
    suite('isPathSeparator', function () {
        test('should return true for forward slash', function () {
            assert.strictEqual(isPathSeparator(47), true); // 47 is char code for '/'
        });

        test('should return true for backslash', function () {
            assert.strictEqual(isPathSeparator(92), true); // 92 is char code for '\'
        });

        test('should return false for non-separator characters', function () {
            assert.strictEqual(isPathSeparator(65), false); // 65 is char code for 'A'
        });
    });

    suite('toForwardSlash', function () {
        test('should convert backslashes to forward slashes', function () {
            assert.strictEqual(toForwardSlash('C:\\Users\\Name'), 'C:/Users/Name');
        });

        test('should not alter path already using forward slashes', function () {
            assert.strictEqual(toForwardSlash('C:/Users/Name'), 'C:/Users/Name');
        });

        test('should handle mixed slashes', function () {
            assert.strictEqual(toForwardSlash('C:/Users\\Name'), 'C:/Users/Name');
        });

        test('more', () => {
            assert.strictEqual(toForwardSlash('\\\\server\\share\\some\\path'), '//server/share/some/path');
            assert.strictEqual(toForwardSlash('c:\\test'), 'c:/test');
            assert.strictEqual(toForwardSlash('foo\\bar'), 'foo/bar');
            assert.strictEqual(toForwardSlash('/user/far'), '/user/far');
        });
    });

    suite('toPosixPath', function () {
        test('should convert Windows path to posix path', function () {
            assert.strictEqual(toPosixPath('C:\\Users\\Name'), '/C:/Users/Name');
        });

        test('should handle paths with forward slashes', function () {
            assert.strictEqual(toPosixPath('C:/Users/Name'), '/C:/Users/Name');
        });

        test('should not alter posix path', function () {
            assert.strictEqual(toPosixPath('/home/user'), '/home/user');
        });

        test('should handle root drive without trailing slash', function () {
            assert.strictEqual(toPosixPath('C:'), '/C:');
        });
    });
});