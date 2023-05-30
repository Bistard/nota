import * as assert from 'assert';
import { FileOperationErrorType, FileType } from "src/base/common/file/file";
import { URI } from "src/base/common/file/uri";
import { delayFor } from 'src/base/common/util/async';
import { InMemoryFileSystemProvider } from 'src/code/platform/files/common/inMemoryFileSystemProvider';
import { ResourceChangeType } from 'src/code/platform/files/common/watcher';

suite('InMemoryFileSystemProvider-test', () => {
    
    let provider: InMemoryFileSystemProvider;
    const fileURI = URI.parse('file:///testFile');
    const directoryURI = URI.parse('file:///testDirectory');
    const renamedFileURI = URI.parse('file:///renamedFile');

    setup(() => {
        provider = new InMemoryFileSystemProvider();
    });

    test('create new file', async () => {
        let eventTriggered = false;

        provider.onDidResourceChange((e) => {
            eventTriggered = true;
            assert.ok(e.events.some(event => event.type === ResourceChangeType.ADDED && event.resource === URI.toString(fileURI)));
        });

        await provider.writeFile(fileURI, new Uint8Array(), { create: true, overwrite: false });

        const stat = await provider.stat(fileURI);
        assert.strictEqual(stat.type, FileType.FILE);
        await delayFor(5, () => assert.ok(eventTriggered));
    });

    test('write and read file', async () => {
        const writeContent = new Uint8Array([1, 2, 3]);
        await provider.writeFile(fileURI, writeContent, { create: true, overwrite: true });

        const readContent = await provider.readFile(fileURI);

        assert.deepStrictEqual(readContent, writeContent);
    });

    test('delete file', async () => {
        let eventTriggered = false;
        provider.onDidResourceChange((e) => {
            eventTriggered = true;
            assert.ok(e.events.some(event => event.type === ResourceChangeType.DELETED && event.resource === URI.toString(fileURI)));
        });

        await provider.writeFile(fileURI, new Uint8Array(), { create: true, overwrite: false });
        await provider.delete(fileURI, { recursive: false });

        try {
            await provider.stat(fileURI);
        } catch (e: any) {
            assert.ok(e.code === FileOperationErrorType.FILE_NOT_FOUND);
        }

        await delayFor(5, () => assert.ok(eventTriggered));
    });

    test('rename file', async () => {
        let eventTriggered = false;
        provider.onDidResourceChange((e) => {
            eventTriggered = true;
            assert.ok(e.events.some(event => event.type === ResourceChangeType.DELETED && event.resource === URI.toString(fileURI)));
            assert.ok(e.events.some(event => event.type === ResourceChangeType.ADDED && event.resource === URI.toString(renamedFileURI)));
        });

        await provider.writeFile(fileURI, new Uint8Array(), { create: true, overwrite: false });
        await provider.rename(fileURI, renamedFileURI, { overwrite: false });

        try {
            await provider.stat(fileURI);
        } catch (e: any) {
            assert.ok(e.code === FileOperationErrorType.FILE_NOT_FOUND);
        }

        const stat = await provider.stat(renamedFileURI);
        assert.strictEqual(stat.type, FileType.FILE);
        await delayFor(5, () => assert.ok(eventTriggered));
    });

    test('create new directory', async () => {
        let eventTriggered = false;
        provider.onDidResourceChange((e) => {
            eventTriggered = true;
            assert.ok(e.events.some(event => event.type === ResourceChangeType.ADDED && event.resource === URI.toString(directoryURI)));
        });

        await provider.mkdir(directoryURI);

        const stat = await provider.stat(directoryURI);
        assert.strictEqual(stat.type, FileType.DIRECTORY);
        await delayFor(5, () => assert.ok(eventTriggered));
    });
});
