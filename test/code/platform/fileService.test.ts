import * as assert from 'assert';
import * as fs from 'fs';
import { DataBuffer } from 'src/base/common/files/buffer';
import { ByteSize, FileType } from 'src/base/common/files/file';
import { URI } from 'src/base/common/files/uri';
import { DiskFileSystemProvider } from 'src/platform/files/node/diskFileSystemProvider';
import { FileService } from 'src/platform/files/common/fileService';
import { NullLogger, TestURI } from 'test/utils/testService';
import { Random } from 'src/base/common/utilities/random';
import { Arrays } from 'src/base/common/utilities/array';
import { after, before } from 'mocha';
import { Blocker, EventBlocker } from 'src/base/common/utilities/async';
import { errorToMessage } from 'src/base/common/error';
import { listenStream } from 'src/base/common/files/stream';
import { directoryExists } from 'src/base/node/io';
import { ResourceChangeType } from 'src/platform/files/common/watcher';
import { IS_LINUX } from 'src/base/common/platform';

suite('FileService-disk-test', () => {

    const service = new FileService(new NullLogger());

    async function createFileWithSize(resource: URI, size: number, defaultChar?: number): Promise<void> {
        const buffer = DataBuffer.fromString(Random.string(size));
        fs.writeFileSync(URI.toFsPath(resource), buffer.toString(), { encoding: 'utf-8' });
    }

    const baseURI = URI.join(TestURI, 'file-service-test');
    const testFileURI = URI.join(baseURI, 'files');

    before(async () => {

        // in case, remove the preivous cache files.
        if (await directoryExists(URI.toFsPath(baseURI))) {
            fs.rmSync(URI.toFsPath(baseURI), { maxRetries: 3, recursive: true });
        }

        // disk provider registration
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);
        assert.strictEqual(provider, service.getProvider('file'));
        
        // create testing files
        fs.mkdirSync(URI.toFsPath(testFileURI), { recursive: true });

        for (const size of [
            ByteSize.KB, 
            256 * ByteSize.KB, 
            1 * ByteSize.MB, 
            10 * ByteSize.MB,
        ]) {
            await createFileWithSize(URI.join(testFileURI, `file-${size}.txt`), size, undefined);
        }
    });

    after(async () => {
        if (await directoryExists(URI.toFsPath(baseURI))) {
            fs.rmSync(URI.toFsPath(baseURI), { maxRetries: 3, recursive: true });
        }
    });

    test('stat - basic', async () => {
        const stat = await (service.stat(baseURI).unwrap());
        assert.strictEqual(stat.type, FileType.DIRECTORY);
        assert.strictEqual(stat.name, 'file-service-test');
        assert.strictEqual(stat.readonly, false);
        assert.strictEqual(stat.children, undefined);
    });

    test('stat - resolve children', async () => {
        const stat = await (service.stat(testFileURI, { resolveChildren: true }).unwrap());
        assert.strictEqual(stat.type, FileType.DIRECTORY);
        assert.strictEqual(stat.name, 'files');
        assert.strictEqual(stat.readonly, false);
        assert.strictEqual([...stat.children!].length, 4);
    });

    test('stat - resolve children recursive', async () => {
        const stat = await (service.stat(baseURI, { resolveChildrenRecursive: true }).unwrap());

        assert.strictEqual(stat.type, FileType.DIRECTORY);
        assert.strictEqual(stat.name, 'file-service-test');
        assert.strictEqual(stat.readonly, false);

        const tempDir = Arrays.coalesce([...stat.children!].map(child => child.name === 'files' ? child : undefined))[0]!;
        assert.strictEqual(tempDir.type, FileType.DIRECTORY);
        assert.strictEqual(tempDir.name, 'files');
        assert.strictEqual([...tempDir.children!].length, 4);
    });

    test('readFile - basic', async () => {
        const uri = URI.join(testFileURI, `file-${ByteSize.KB}.txt`);
        await (service.readFile(uri).unwrap());
    });

    test('readFile - error', async () => {
        const uri = URI.join(testFileURI, `file-unknown.txt`);
        await assert.rejects(() => (service.readFile(uri)).unwrap());
    });

    test('readDir', async () => {
        const dir = await (service.readDir(testFileURI).unwrap());
        assert.strictEqual(dir.length, 4);
        assert.strictEqual(dir[0]![1], FileType.FILE);
        assert.strictEqual(dir[1]![1], FileType.FILE);
        assert.strictEqual(dir[2]![1], FileType.FILE);
        assert.strictEqual(dir[3]![1], FileType.FILE);
    });

    test('createDir', async () => {
        const root = URI.join(baseURI, 'dir-1');
        const uri = URI.join(root, 'dir-2');

        await (service.createDir(uri).unwrap());
        const dir1 = await (service.readDir(root).unwrap());
        assert.strictEqual(dir1.length, 1);
        assert.strictEqual(dir1[0]![0], 'dir-2');
        assert.strictEqual(dir1[0]![1], FileType.DIRECTORY);

        await (service.delete(root, { recursive: true, useTrash: false }).unwrap());
    });

    test('exist', async () => {
        assert.strictEqual(await (service.exist(testFileURI).unwrap()), true);
        assert.strictEqual(await (service.exist(URI.join(testFileURI, `file-${ByteSize.KB}.hello.world`)).unwrap()), false);
        assert.strictEqual(await (service.exist(URI.join(testFileURI, `file-${256 * ByteSize.KB}.txt`)).unwrap()), true);
        assert.strictEqual(await (service.exist(URI.join(testFileURI, `file-${ByteSize.MB}.txt`)).unwrap()), true);
        assert.strictEqual(await (service.exist(URI.join(testFileURI, `file-${10 * ByteSize.MB}.txt`)).unwrap()), true);
    });

    test('delete - file', async () => {
        const base = URI.join(baseURI, 'delete');
        const uri = URI.join(base, 'delete.txt');
        await (service.writeFile(uri, DataBuffer.fromString('goodbyte world'), { create: true, overwrite: true, unlock: true }).unwrap());

        await (service.delete(uri, { useTrash: true, recursive: true }).unwrap());

        const dir = await (service.readDir(base).unwrap());
        assert.strictEqual(dir.length, 0);
    });

    test('delete - recursive', async () => {
        const root = URI.join(baseURI, 'delete-recursive');
        const dir1 = URI.join(root, 'dir-1');
        const dir2 = URI.join(dir1, 'dir-2');
        const dir3 = URI.join(dir2, 'dir-3');
        await (service.createDir(dir3).unwrap());

        await (service.delete(dir1, { useTrash: true, recursive: true }).unwrap());

        const dir = await (service.readDir(root).unwrap());
        assert.strictEqual(dir.length, 0);
    });

    test('delete - non recursive', async () => {
        const base = URI.join(baseURI, 'delete-non-recursive');
        try {
            const uri = URI.join(base, 'dir1', 'dir2', 'file1.txt');
            await (service.writeFile(uri, DataBuffer.alloc(0), { create: true, overwrite: true, unlock: true }).unwrap());
            await (service.delete(base, { useTrash: true, recursive: false }).unwrap());
            throw 'never';
        } catch (err: any) {
            if (err === 'never') {
                assert.fail(err);
            }
            await (service.delete(base, { useTrash: true, recursive: true }).unwrap());
        }
    });

    test('writeFile - basic', async () => {
        const uri = URI.join(baseURI, 'writefile');
        await (service.writeFile(uri, DataBuffer.alloc(0), { create: true, overwrite: true, unlock: true }).unwrap());

        const write1 = DataBuffer.fromString('Goodbye World');
        await (service.writeFile(uri, write1, { create: false, overwrite: true, unlock: true }).unwrap());
        const read1 = await (service.readFile(uri).unwrap());
        assert.strictEqual(read1.toString(), 'Goodbye World');

        const write2 = DataBuffer.fromString('Hello World');
        await (service.writeFile(uri, write2, { create: false, overwrite: true, unlock: true }).unwrap());
        const read2 = await (service.readFile(uri).unwrap());
        assert.strictEqual(read2.toString(), 'Hello World');
    });

    test('writeFile - create', async () => {
        const uri = URI.join(baseURI, 'writefile-create', 'create.txt');

        // create: false
        const write1 = DataBuffer.fromString('create new file1');
        try {
            await (service.writeFile(uri, write1, { create: false, overwrite: false, unlock: true }).unwrap());
        } catch { /** noop */ }
        const exist = await (service.exist(uri).unwrap());
        assert.strictEqual(exist, false);

        // create: true
        const write2 = DataBuffer.fromString('create new file2');
        await (service.writeFile(uri, write2, { create: true, overwrite: false, unlock: true }).unwrap());
        const read2 = await (service.readFile(uri).unwrap());
        assert.strictEqual(read2.toString(), 'create new file2');
    });

    test('writeFile - overwrite', async () => {
        const uri = URI.join(baseURI, 'writefile-overwrite', 'overwrite.txt');
        await (service.writeFile(uri, DataBuffer.fromString('Hello World'), { create: true, overwrite: true, unlock: true }).unwrap());

        try {
            await (service.writeFile(uri, DataBuffer.fromString('Goodbye World'), { create: false, overwrite: false, unlock: true }).unwrap());
        } catch { /** noop */ }
        const read1 = await (service.readFile(uri).unwrap());
        assert.strictEqual(read1.toString(), 'Hello World');
    });

    test('readFile - 256kb', async () => {
        const uri = URI.join(testFileURI, `file-${256 * ByteSize.KB}.txt`);
        await (service.readFile(uri).unwrap());
    });

    test('writeFile - 256kb', async () => {
        const uri = URI.join(testFileURI, `file-${256 * ByteSize.KB}.txt`);
        const buffer = DataBuffer.fromString(Random.string(256 * ByteSize.KB));
        await (service.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true }).unwrap());
    });

    test('readFile - 1mb', async () => {
        const uri = URI.join(testFileURI, `file-${1 * ByteSize.MB}.txt`);
        await (service.readFile(uri).unwrap());
    });

    test('writeFile - 1mb', async () => {
        const uri = URI.join(testFileURI, `file-${1 * ByteSize.MB}.txt`);
        const buffer = DataBuffer.fromString(Random.string(ByteSize.MB));
        await (service.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true }).unwrap());
    });

    test('readFile - 10mb', async () => {
        const uri = URI.join(testFileURI, `file-${10 * ByteSize.MB}.txt`);
        await (service.readFile(uri).unwrap());
    });

    test('writeFile - 10mb', async () => {
        const uri = URI.join(testFileURI, `file-${10 * ByteSize.MB}.txt`);
        const buffer = DataBuffer.fromString(Random.string(10 * ByteSize.MB));
        await (service.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true }).unwrap());
    });

    test('readFileStream', async () => {
        let cnt = 0;

        const totalSize = 1 * ByteSize.MB;
        const uri = URI.join(testFileURI, `file-${totalSize}.txt`);
        const ready = await (service.readFileStream(uri).unwrap());
        
        const stream = ready.flow();

        const end = new Blocker<void>();

        listenStream(stream, {
            onData: (buffer) => {
                cnt++;
            },
            onError: (error) => {
                assert.fail(errorToMessage(error));
            },
            onEnd: () => {
                assert.strictEqual(cnt, totalSize / FileService.bufferSize);
                end.resolve();
            }
        });

        await end.waiting();
        stream.destroy();
    });

    test('copyTo - file', async () => {
        const uri = URI.join(baseURI, 'copy', 'file.txt');
        const newUri = URI.join(baseURI, 'copy', 'file-copy.txt');
        await (service.createFile(uri, DataBuffer.fromString('copy content')).unwrap());

        await (service.copyTo(uri, newUri).unwrap());

        const content = (await service.readFile(newUri).unwrap()).toString();
        assert.strictEqual(content, 'copy content');

        await (service.writeFile(uri, DataBuffer.fromString('copy content1'), { overwrite: true, create: false, unlock: true }).unwrap());
        try {
            // cannot overwrite
            await (service.copyTo(uri, newUri, false).unwrap());
        } catch {
            // overwrite
            await (service.copyTo(uri, newUri, true).unwrap());
            const content = (await (service.readFile(newUri)).unwrap()).toString();
            assert.strictEqual(content, 'copy content1');
        }
    });

    test('copyTo - directory', async () => {
        const dir1Uri = URI.join(baseURI, 'copy', 'dir1');
        const uri = URI.join(dir1Uri, 'file.txt');
        const dir2Uri = URI.join(baseURI, 'copy', 'dir2');
        const newUri = URI.join(dir2Uri, 'file.txt');

        await (service.createFile(uri, DataBuffer.fromString('copy content')).unwrap());
        await (service.copyTo(dir1Uri, dir2Uri).unwrap());

        const content = (await (service.readFile(newUri)).unwrap()).toString();
        assert.strictEqual(content, 'copy content');

        await (service.writeFile(uri, DataBuffer.fromString('copy content1'), { overwrite: true, create: false, unlock: true }).unwrap());
        try {
            // cannot overwrite
            await (service.copyTo(dir1Uri, dir2Uri, false).unwrap());
        } catch {
            // overwrite
            await (service.copyTo(dir1Uri, dir2Uri, true).unwrap());
            const content = (await (service.readFile(newUri)).unwrap()).toString();
            assert.strictEqual(content, 'copy content1');
        }
    });

    test('moveTo - file', async () => {
        const uri = URI.join(baseURI, 'move', 'file.txt');
        const newUri = URI.join(baseURI, 'move', 'file-move.txt');
        await (service.createFile(uri, DataBuffer.fromString('move content')).unwrap());

        await (service.moveTo(uri, newUri).unwrap());
        const content = (await (service.readFile(newUri)).unwrap()).toString();
        assert.strictEqual(content, 'move content');
        const exist = await (service.exist(uri).unwrap());
        assert.strictEqual(exist, false);

        await (service.writeFile(uri, DataBuffer.fromString('move content1'), { overwrite: true, create: true, unlock: true }).unwrap());
        try {
            // cannot overwrite
            await (service.moveTo(uri, newUri, false).unwrap());
        } catch {
            // overwrite
            await (service.moveTo(uri, newUri, true).unwrap());
            const content = (await (service.readFile(newUri)).unwrap()).toString();
            assert.strictEqual(content, 'move content1');
            const exist = await (service.exist(uri).unwrap());
            assert.strictEqual(exist, false);
        }
    });

    test('moveTo - Directory', async () => {
        const dir1Uri = URI.join(baseURI, 'move', 'dir1');
        const uri = URI.join(dir1Uri, 'file.txt');
        const dir2Uri = URI.join(baseURI, 'move', 'dir2');
        const newUri = URI.join(dir2Uri, 'file.txt');
        await (service.createFile(uri, DataBuffer.fromString('move content')).unwrap());

        await (service.moveTo(dir1Uri, dir2Uri).unwrap());
        const content = (await (service.readFile(newUri)).unwrap()).toString();
        assert.strictEqual(content, 'move content');
        const exist = await (service.exist(dir1Uri).unwrap());
        assert.strictEqual(exist, false);

        await (service.createFile(uri, DataBuffer.fromString('move content1')).unwrap());
        try {
            // cannot overwrite
            await (service.moveTo(dir1Uri, dir2Uri, false).unwrap());
        } catch {
            // overwrite
            await (service.moveTo(dir1Uri, dir2Uri, true).unwrap());
            const content = (await (service.readFile(newUri)).unwrap()).toString();
            assert.strictEqual(content, 'move content1');
            const exist = await (service.exist(dir1Uri).unwrap());
            assert.strictEqual(exist, false);
        }
    });

    test('watch - deleting file', async () => {
        const base = URI.join(baseURI, 'watch');
        const file = URI.join(base, 'watch-deleting-file');
        await service.createFile(file, DataBuffer.alloc(0)).unwrap();
        
        const unwatch = await service.watch(file).unwrap();
        
        const firstDel = new EventBlocker(service.onDidResourceChange);
        
        await service.delete(file).unwrap();
        
        const events = await firstDel.waiting();
        assert.ok(events.wrap().match(file, [ResourceChangeType.DELETED]));

        unwatch.dispose();
    });
    
    test('watch - updating file', async function () {
        if (IS_LINUX) {
            this.skip(); // FIX
        }

        const base = URI.join(baseURI, 'watch');
        const file = URI.join(base, 'watch-updating-file');
        await service.createFile(file, DataBuffer.alloc(0)).unwrap();
        
        const unwatch = await service.watch(file).unwrap();
        
        const firstDel = new EventBlocker(service.onDidResourceChange);

        await service.delete(file).unwrap();
        await service.createFile(file, DataBuffer.alloc(0)).unwrap();
        
        const events = await firstDel.waiting();
        assert.ok(events.wrap().match(file, [ResourceChangeType.UPDATED]));

        unwatch.dispose();
    });

    test('watch - directory', async () => {
        const base = URI.join(baseURI, 'watch1');
        const dir = URI.join(base, 'watch-directory');
        await service.createDir(dir).unwrap();
        
        const unwatch = await service.watch(dir, { recursive: true }).unwrap();

        const first = new EventBlocker(service.onDidResourceChange, 10000);
        await service.createFile(URI.join(dir, 'nest-file1'), DataBuffer.alloc(0)).unwrap();
        
        const events = await first.waiting();
        assert.ok(events.wrap().affect(dir));
        unwatch.dispose();

        const second = new EventBlocker(service.onDidResourceChange, 100);
        await service.delete(URI.join(dir, 'nest-file1')).unwrap();
        
        return assert.rejects(() => second.waiting());
    });
});
