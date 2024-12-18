import * as assert from 'assert';
import { isPathSeparator, tildify, toForwardSlash, toPosixPath } from 'src/base/common/files/extpath';
import { Platform } from 'src/base/common/platform';

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

    suite('tildify', () => {

        test('should return the original path if os is Windows', () => {
            const result = tildify('C:/Users/Example/path', 'C:/Users/Example', Platform.Windows);
            assert.strictEqual(result, 'C:/Users/Example/path');
        });
    
        test('should return the original path if path is empty', () => {
            const result = tildify('', '/home/user', Platform.Linux);
            assert.strictEqual(result, '');
        });
    
        test('should return the original path if userHome is empty', () => {
            const result = tildify('/home/user/file.txt', '', Platform.Linux);
            assert.strictEqual(result, '/home/user/file.txt');
        });
    
        test('should replace userHome prefix with "~" on Linux when path starts with userHome', () => {
            const result = tildify('/home/user/documents/file.txt', '/home/user', Platform.Linux);
            assert.strictEqual(result, '~/documents/file.txt');
        });
    
        test('should not replace userHome prefix if path does not start with userHome on Linux', () => {
            const result = tildify('/home/otheruser/file.txt', '/home/user', Platform.Linux);
            assert.strictEqual(result, '/home/otheruser/file.txt');
        });
    
        test('should replace userHome prefix with "~" on macOS ignoring case', () => {
            const result = tildify('/Users/User/Documents/file.txt', '/users/user', Platform.Mac);
            assert.strictEqual(result, '~/Documents/file.txt');
        });
    
        test('should not replace userHome prefix on macOS if path does not start with userHome', () => {
            const result = tildify('/Users/OtherUser/file.txt', '/Users/User', Platform.Mac);
            assert.strictEqual(result, '/Users/OtherUser/file.txt');
        });
    
        test('should normalize userHome and path on Windows before comparison', () => {
            const result = tildify('C:/Users/Example/Documents/file.txt', 'C:\\Users\\Example', Platform.Linux);
            assert.strictEqual(result, '~/Documents/file.txt');
        });
    
        test('should return the original path if normalizedUserHome is cached and does not match', () => {
            const result = tildify('/different/user/documents/file.txt', '/home/user', Platform.Linux);
            assert.strictEqual(result, '/different/user/documents/file.txt');
        });
    
        test('should trim trailing slashes from userHome and append a POSIX separator', () => {
            const result = tildify('/home/user/documents/file.txt', '/home/user/', Platform.Linux);
            assert.strictEqual(result, '~/documents/file.txt');
        });
    });
});