import * as fs from 'fs';
import * as assert from 'assert';
import { FileSystemProviderError, FileOperationErrorType, FileType } from 'src/base/common/files/file';
import { URI } from 'src/base/common/files/uri';
import { DiskFileSystemProvider } from 'src/platform/files/node/diskFileSystemProvider';
import { TestURI } from 'test/utils/testService';
import { afterEach, beforeEach } from 'mocha';

suite('DiskFileSystemProvider-test', () => {

    const baseTestURI = URI.join(TestURI, 'disk-file-system-provider');
    const testFileURI = URI.join(baseTestURI, 'test.txt');
    const testNonFileURI = URI.join(baseTestURI, 'non-exist-test.txt');
    const testFileContent = new Uint8Array(Buffer.from('Test content'));
    const provider = new DiskFileSystemProvider();

    beforeEach(() => {
        // Setup: Create a test dir
        if (!fs.existsSync(URI.toFsPath(baseTestURI))) {
            fs.mkdirSync(URI.toFsPath(baseTestURI), { recursive: true });
        }

        // Setup: Create a test file
        if (!fs.existsSync(URI.toFsPath(testFileURI))) {
            fs.writeFileSync(URI.toFsPath(testFileURI), testFileContent);
        }
    });

    afterEach(() => {
        // Teardown: Remove the test files and directories
        fs.rmSync(URI.toFsPath(baseTestURI), { recursive: true });
    });

    test('Should read the file correctly', async () => {
        const content = await provider.readFile(testFileURI);
        assert.deepStrictEqual(content, Buffer.from(testFileContent));
    });

    test('Should throw when reading a non-existing file', async () => {
        const nonExistingFileURI = testNonFileURI;

        try {
            await provider.readFile(nonExistingFileURI);
            assert.fail('Should have thrown');
        } catch (err) {
            assert.ok(err instanceof FileSystemProviderError, 'not a FileSystemProviderError');
            assert.strictEqual(err.code, FileOperationErrorType.FILE_NOT_FOUND);
        }
    });

    test('Should write to the file correctly', async () => {
        const newContent = new Uint8Array(Buffer.from('New content'));
        await provider.writeFile(testFileURI, newContent, { create: false, overwrite: true });
        const content = fs.readFileSync(URI.toFsPath(testFileURI));
        assert.deepStrictEqual(content, Buffer.from(newContent));
    });

    test('Should throw when writing to a non-existing file with create = false', async () => {
        const nonExistingFileURI = testNonFileURI;
        const newContent = new Uint8Array(Buffer.from('New content'));

        try {
            await provider.writeFile(nonExistingFileURI, newContent, { create: false, overwrite: true });
            assert.fail('Should have thrown');
        } catch (err) {
            assert.ok(err instanceof FileSystemProviderError);
            assert.strictEqual(err.code, FileOperationErrorType.FILE_NOT_FOUND);
        }
    });

    test('Should not overwrite an existing file when overwrite = false', async () => {
        const newContent = new Uint8Array(Buffer.from('New content'));

        try {
            await provider.writeFile(testFileURI, newContent, { create: true, overwrite: false });
            assert.fail('Should have thrown');
        } catch (err) {
            assert.ok(err instanceof FileSystemProviderError);
            assert.strictEqual(err.code, FileOperationErrorType.FILE_EXISTS);
        }
    });

    test('Should return the correct file stat', async () => {
        const stat = await provider.stat(testFileURI);

        assert.ok(stat);
        assert.strictEqual(stat.type, FileType.FILE);
        assert.strictEqual(stat.byteSize, testFileContent.byteLength);
    });

    test('Should throw when getting stat of a non-existing file', async () => {
        const nonExistingFileURI = testNonFileURI;

        try {
            await provider.stat(nonExistingFileURI);
            assert.fail('Should have thrown');
        } catch (err) {
            assert.ok(err instanceof FileSystemProviderError, 'not a FileSystemProviderError');
            assert.strictEqual(err.code, FileOperationErrorType.FILE_NOT_FOUND);
        }
    });
});
