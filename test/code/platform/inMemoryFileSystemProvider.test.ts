import * as assert from 'assert';
import { Event } from 'src/base/common/event';
import { DataBuffer } from 'src/base/common/files/buffer';
import { FileOperationErrorType, FileType } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { InMemoryFileSystemProvider } from 'src/platform/files/common/inMemoryFileSystemProvider';

suite('InMemoryFileSystemProvider-test', () => {

    let provider: InMemoryFileSystemProvider;
    const fileURI = URI.parse('file:///testFile');
    const directoryURI = URI.parse('file:///testDirectory');
    const renamedFileURI = URI.parse('file:///renamedFile');

    setup(() => {
        provider = new InMemoryFileSystemProvider();
    });

    test('create new file', async () => {
        await provider.writeFile(fileURI, new Uint8Array(), { create: true, overwrite: false });

        const stat = await provider.stat(fileURI);
        assert.strictEqual(stat.type, FileType.FILE);
    });

    test('write and read file', async () => {
        const writeContent = new Uint8Array([1, 2, 3]);
        await provider.writeFile(fileURI, writeContent, { create: true, overwrite: true });

        const readContent = await provider.readFile(fileURI);
        assert.deepStrictEqual(readContent, writeContent);
    });

    test('delete file', async () => {
        await provider.writeFile(fileURI, new Uint8Array(), { create: true, overwrite: false });
        await provider.delete(fileURI, { recursive: false });

        try {
            await provider.stat(fileURI);
        } catch (e: any) {
            assert.ok(e.code === FileOperationErrorType.FILE_NOT_FOUND);
        }
    });

    test('rename file', async () => {
        await provider.writeFile(fileURI, new Uint8Array(), { create: true, overwrite: false });
        await provider.rename(fileURI, renamedFileURI, { overwrite: false });

        try {
            await provider.stat(fileURI);
        } catch (e: any) {
            assert.ok(e.code === FileOperationErrorType.FILE_NOT_FOUND);
        }

        const stat = await provider.stat(renamedFileURI);
        assert.strictEqual(stat.type, FileType.FILE);
    });

    test('create new directory', async () => {
        await provider.mkdir(directoryURI);

        const stat = await provider.stat(directoryURI);
        assert.strictEqual(stat.type, FileType.DIRECTORY);
    });

    test('watch - file', async () => {
        const driURI = URI.parse('file:///dir1');
        const fileURI = URI.join(driURI, 'file1');

        await provider.mkdir(driURI);
        const disposable = await provider.watch(fileURI);

        const onChange = Event.toPromise(provider.onDidResourceChange);

        await provider.writeFile(fileURI, DataBuffer.fromString('hello world').buffer, { create: true });

        await onChange.then(e => {
            for (const raw of e.events) {
                assert.strictEqual(raw.resource, URI.toString(fileURI));
            }
            assert.ok(e.anyAdded);
            assert.ok(e.anyUpdated);
            assert.ok(e.anyFile);
            assert.ok(!e.anyDirectory);
        });
        disposable.dispose();
    });

    test('watch - directory', async () => {
        const driURI = URI.parse('file:///dir1');

        const disposable = await provider.watch(driURI);
        const onChange = Event.toPromise(provider.onDidResourceChange);

        await provider.mkdir(driURI);

        await onChange.then(e => {
            for (const raw of e.events) {
                assert.strictEqual(raw.resource, URI.toString(driURI));
            }
            assert.ok(e.anyAdded);
            assert.ok(e.anyUpdated);
            assert.ok(!e.anyFile);
            assert.ok(e.anyDirectory);
        });
        disposable.dispose();
    });
});
