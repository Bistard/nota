import * as assert from 'assert';
import { before, after } from 'mocha';
import { errorToMessage } from 'src/base/common/error';
import { DataBuffer } from 'src/base/common/files/buffer';
import { ByteSize, FileType } from 'src/base/common/files/file';
import { listenStream } from 'src/base/common/files/stream';
import { Schemas, URI } from 'src/base/common/files/uri';
import { Arrays } from 'src/base/common/utilities/array';
import { Blocker } from 'src/base/common/utilities/async';
import { Random } from 'src/base/common/utilities/random';
import { BrowserFileChannel } from 'src/platform/files/browser/fileChannel';
import { FileService, IFileService } from 'src/platform/files/common/fileService';
import { MainFileChannel } from 'src/platform/files/electron/mainFileChannel';
import { DiskFileSystemProvider } from 'src/platform/files/node/diskFileSystemProvider';
import { IpcChannel } from 'src/platform/ipc/common/channel';
import { ClientBase } from 'src/platform/ipc/common/net';
import { ReviverRegistrant } from 'src/platform/ipc/common/revive';
import { RegistrantService } from 'src/platform/registrant/common/registrantService';
import { FakeAsync } from 'test/utils/fakeAsync';
import { NullLogger, TestIPC, TestURI } from 'test/utils/testService';
import * as fs from 'fs';

suite('FileChannel-test (IPC)', () => {

    let server: TestIPC.IpcServer;
    let client: ClientBase;

    let mainService: IFileService;
    let clientService: BrowserFileChannel;

    // const baseURI = URI.fromFile('file-channel-test');
    const baseURI = URI.join(TestURI, 'file-channel-test');
    const testFileURI = URI.join(baseURI, 'files');

    before(async function () {
        const logService = new NullLogger();
        const registrantService = new RegistrantService(logService);
        registrantService.registerRegistrant(new ReviverRegistrant());
        registrantService.init();

        mainService = new FileService(logService);
        mainService.registerProvider(Schemas.FILE, new DiskFileSystemProvider());

        server = new TestIPC.IpcServer();
        server.registerChannel(IpcChannel.DiskFile, new MainFileChannel(logService, mainService, registrantService));
        
        client = server.createConnection('browserFileChannel');
        clientService = new BrowserFileChannel({ _serviceMarker: undefined, dispose: () => {}, getChannel: () => client.getChannel(IpcChannel.DiskFile) }, registrantService);

        // create testing files
        {
            await mainService.createDir(testFileURI).unwrap();

            for (const size of [
                ByteSize.KB, 
                256 * ByteSize.KB, 
                1 * ByteSize.MB, 
                10 * ByteSize.MB,
            ]) {
                await createFileWithSize(URI.join(testFileURI, `file-${size}.txt`), size, undefined);
            }
        }
    });

    after(() => {
        server.dispose();
        client.dispose();
        fs.rmSync(URI.toFsPath(baseURI), { maxRetries: 3, recursive: true });
    });

    async function createFileWithSize(resource: URI, size: number, defaultChar?: number): Promise<void> {
        const buffer = DataBuffer.fromString(Random.string(size));
        await mainService.createFile(resource, buffer, { overwrite: true }).unwrap();
    }

    test('basics', () => FakeAsync.run(async () => {
        const uri = URI.join(baseURI, 'createDirFolder');
        await clientService.createDir(uri).unwrap();
        assert.ok(await mainService.exist(baseURI).unwrap());
        assert.ok(await mainService.exist(uri).unwrap());
    }));

    test('stat - basic', () => FakeAsync.run(async () => {
        const stat = await (clientService.stat(baseURI).unwrap());
        assert.strictEqual(stat.type, FileType.DIRECTORY);
        assert.strictEqual(stat.name, 'file-channel-test');
        assert.strictEqual(stat.readonly, false);
        assert.strictEqual(stat.children, undefined);
    }));

    // FIX: super slow
    test('stat - resolve children', () => FakeAsync.run(async () => {
        const stat = await (clientService.stat(testFileURI, { resolveChildren: true }).unwrap());
        assert.strictEqual(stat.type, FileType.DIRECTORY);
        assert.strictEqual(stat.name, 'files');
        assert.strictEqual(stat.readonly, false);
        assert.strictEqual([...stat.children!].length, 4);
    }));

    test('stat - resolve children recursive', () => FakeAsync.run(async () => {
        const stat = await (clientService.stat(baseURI, { resolveChildrenRecursive: true }).unwrap());

        assert.strictEqual(stat.type, FileType.DIRECTORY);
        assert.strictEqual(stat.name, 'file-channel-test');
        assert.strictEqual(stat.readonly, false);

        const tempDir = Arrays.coalesce([...stat.children!].map(child => child.name === 'files' ? child : undefined))[0]!;
        assert.strictEqual(tempDir.type, FileType.DIRECTORY);
        assert.strictEqual(tempDir.name, 'files');
        assert.strictEqual([...tempDir.children!].length, 4);
    }));

    test('readFile - basic', () => FakeAsync.run(async () => {
        const uri = URI.join(testFileURI, `file-${ByteSize.KB}.txt`);
        await (clientService.readFile(uri).unwrap());
    }));

    test('readFile - error', () => FakeAsync.run(async () => {
        const uri = URI.join(testFileURI, `file-unknown.txt`);
        await assert.rejects(() => (clientService.readFile(uri)).unwrap());
    }));

    test('readDir', () => FakeAsync.run(async () => {
        const dir = await (clientService.readDir(testFileURI).unwrap());
        assert.strictEqual(dir.length, 4);
        assert.strictEqual(dir[0]![1], FileType.FILE);
        assert.strictEqual(dir[1]![1], FileType.FILE);
        assert.strictEqual(dir[2]![1], FileType.FILE);
        assert.strictEqual(dir[3]![1], FileType.FILE);
    }));

    test('createDir', () => FakeAsync.run(async () => {
        const root = URI.join(baseURI, 'dir-1');
        const uri = URI.join(root, 'dir-2');

        await (clientService.createDir(uri).unwrap());
        const dir1 = await (clientService.readDir(root).unwrap());
        assert.strictEqual(dir1.length, 1);
        assert.strictEqual(dir1[0]![0], 'dir-2');
        assert.strictEqual(dir1[0]![1], FileType.DIRECTORY);

        await (clientService.delete(root, { recursive: true, useTrash: false }).unwrap());
    }));

    test('exist', () => FakeAsync.run(async () => {
        assert.strictEqual(await (clientService.exist(testFileURI).unwrap()), true);
        assert.strictEqual(await (clientService.exist(URI.join(testFileURI, `file-${ByteSize.KB}.hello.world`)).unwrap()), false);
        assert.strictEqual(await (clientService.exist(URI.join(testFileURI, `file-${256 * ByteSize.KB}.txt`)).unwrap()), true);
        assert.strictEqual(await (clientService.exist(URI.join(testFileURI, `file-${ByteSize.MB}.txt`)).unwrap()), true);
        assert.strictEqual(await (clientService.exist(URI.join(testFileURI, `file-${10 * ByteSize.MB}.txt`)).unwrap()), true);
    }));

    test('delete - file', () => FakeAsync.run(async () => {
        const base = URI.join(baseURI, 'delete');
        const uri = URI.join(base, 'delete.txt');
        await (clientService.writeFile(uri, DataBuffer.fromString('goodbyte world'), { create: true, overwrite: true, unlock: true }).unwrap());

        await (clientService.delete(uri, { useTrash: true, recursive: true }).unwrap());

        const dir = await (clientService.readDir(base).unwrap());
        assert.strictEqual(dir.length, 0);
    }));

    test('delete - recursive', () => FakeAsync.run(async () => {
        const root = URI.join(baseURI, 'delete-recursive');
        const dir1 = URI.join(root, 'dir-1');
        const dir2 = URI.join(dir1, 'dir-2');
        const dir3 = URI.join(dir2, 'dir-3');
        await (clientService.createDir(dir3).unwrap());

        await (clientService.delete(dir1, { useTrash: true, recursive: true }).unwrap());

        const dir = await (clientService.readDir(root).unwrap());
        assert.strictEqual(dir.length, 0);
    }));

    test('delete - non recursive', () => FakeAsync.run(async () => {
        const base = URI.join(baseURI, 'delete-non-recursive');
        try {
            const uri = URI.join(base, 'dir1', 'dir2', 'file1.txt');
            await (clientService.writeFile(uri, DataBuffer.alloc(0), { create: true, overwrite: true, unlock: true }).unwrap());
            await (clientService.delete(base, { recursive: false }).unwrap());
            throw 'never';
        } catch (err: any) {
            if (err === 'never') {
                assert.fail(err);
            }
            await (clientService.delete(base, { recursive: true }).unwrap());
        }
    }));

    test('writeFile - basic', () => FakeAsync.run(async () => {
        const uri = URI.join(baseURI, 'writefile');
        await (clientService.writeFile(uri, DataBuffer.alloc(0), { create: true, overwrite: true, unlock: true }).unwrap());

        const write1 = DataBuffer.fromString('Goodbye World');
        await (clientService.writeFile(uri, write1, { create: false, overwrite: true, unlock: true }).unwrap());
        const read1 = await (clientService.readFile(uri).unwrap());
        assert.strictEqual(read1.toString(), 'Goodbye World');

        const write2 = DataBuffer.fromString('Hello World');
        await (clientService.writeFile(uri, write2, { create: false, overwrite: true, unlock: true }).unwrap());
        const read2 = await (clientService.readFile(uri).unwrap());
        assert.strictEqual(read2.toString(), 'Hello World');
    }));

    test('writeFile - create', () => FakeAsync.run(async () => {
        const uri = URI.join(baseURI, 'writefile-create', 'create.txt');

        // create: false
        const write1 = DataBuffer.fromString('create new file1');
        try {
            await (clientService.writeFile(uri, write1, { create: false, overwrite: false, unlock: true }).unwrap());
        } catch { /** noop */ }
        const exist = await (clientService.exist(uri).unwrap());
        assert.strictEqual(exist, false);

        // create: true
        const write2 = DataBuffer.fromString('create new file2');
        await (clientService.writeFile(uri, write2, { create: true, overwrite: false, unlock: true }).unwrap());
        const read2 = await (clientService.readFile(uri).unwrap());
        assert.strictEqual(read2.toString(), 'create new file2');
    }));

    test('writeFile - overwrite', () => FakeAsync.run(async () => {
        const uri = URI.join(baseURI, 'writefile-overwrite', 'overwrite.txt');
        await (clientService.writeFile(uri, DataBuffer.fromString('Hello World'), { create: true, overwrite: true, unlock: true }).unwrap());

        try {
            await (clientService.writeFile(uri, DataBuffer.fromString('Goodbye World'), { create: false, overwrite: false, unlock: true }).unwrap());
        } catch { /** noop */ }
        const read1 = await (clientService.readFile(uri).unwrap());
        assert.strictEqual(read1.toString(), 'Hello World');
    }));

    test('readFile - 256kb', () => FakeAsync.run(async () => {
        const uri = URI.join(testFileURI, `file-${256 * ByteSize.KB}.txt`);
        await (clientService.readFile(uri).unwrap());
    }));

    test('writeFile - 256kb', () => FakeAsync.run(async () => {
        const uri = URI.join(testFileURI, `file-${256 * ByteSize.KB}.txt`);
        const buffer = DataBuffer.fromString(Random.string(256 * ByteSize.KB));
        await (clientService.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true }).unwrap());
    }));

    test('readFile - 1mb', () => FakeAsync.run(async () => {
        const uri = URI.join(testFileURI, `file-${1 * ByteSize.MB}.txt`);
        await (clientService.readFile(uri).unwrap());
    }));

    test('writeFile - 1mb', () => FakeAsync.run(async () => {
        const uri = URI.join(testFileURI, `file-${1 * ByteSize.MB}.txt`);
        const buffer = DataBuffer.fromString(Random.string(ByteSize.MB));
        await (clientService.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true }).unwrap());
    }));

    test('readFile - 10mb', () => FakeAsync.run(async () => {
        const uri = URI.join(testFileURI, `file-${10 * ByteSize.MB}.txt`);
        await (clientService.readFile(uri).unwrap());
    }));

    test('writeFile - 10mb', () => FakeAsync.run(async () => {
        const uri = URI.join(testFileURI, `file-${10 * ByteSize.MB}.txt`);
        const buffer = DataBuffer.fromString(Random.string(10 * ByteSize.MB));
        await (clientService.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true }).unwrap());
    }));

    // FIX
    test.skip('readFileStream', () => FakeAsync.run(async () => {
        let cnt = 0;

        const totalSize = 1 * ByteSize.MB;
        const uri = URI.join(testFileURI, `file-${totalSize}.txt`);
        const ready = await (clientService.readFileStream(uri).unwrap());
        
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
    }));

    test('copyTo - file', () => FakeAsync.run(async () => {
        const uri = URI.join(baseURI, 'copy', 'file.txt');
        const newUri = URI.join(baseURI, 'copy', 'file-copy.txt');
        await (clientService.createFile(uri, DataBuffer.fromString('copy content')).unwrap());

        await (clientService.copyTo(uri, newUri).unwrap());

        const content = (await clientService.readFile(newUri).unwrap()).toString();
        assert.strictEqual(content, 'copy content');

        await (clientService.writeFile(uri, DataBuffer.fromString('copy content1'), { overwrite: true, create: false, unlock: true }).unwrap());
        try {
            // cannot overwrite
            await (clientService.copyTo(uri, newUri, false).unwrap());
        } catch {
            // overwrite
            await (clientService.copyTo(uri, newUri, true).unwrap());
            const content = (await (clientService.readFile(newUri)).unwrap()).toString();
            assert.strictEqual(content, 'copy content1');
        }
    }));

    test('copyTo - directory', () => FakeAsync.run(async () => {
        const dir1Uri = URI.join(baseURI, 'copy', 'dir1');
        const uri = URI.join(dir1Uri, 'file.txt');
        const dir2Uri = URI.join(baseURI, 'copy', 'dir2');
        const newUri = URI.join(dir2Uri, 'file.txt');

        await (clientService.createFile(uri, DataBuffer.fromString('copy content')).unwrap());
        await (clientService.copyTo(dir1Uri, dir2Uri).unwrap());

        const content = (await (clientService.readFile(newUri)).unwrap()).toString();
        assert.strictEqual(content, 'copy content');

        await (clientService.writeFile(uri, DataBuffer.fromString('copy content1'), { overwrite: true, create: false, unlock: true }).unwrap());
        try {
            // cannot overwrite
            await (clientService.copyTo(dir1Uri, dir2Uri, false).unwrap());
        } catch {
            // overwrite
            await (clientService.copyTo(dir1Uri, dir2Uri, true).unwrap());
            const content = (await (clientService.readFile(newUri)).unwrap()).toString();
            assert.strictEqual(content, 'copy content1');
        }
    }));

    test('moveTo - file', () => FakeAsync.run(async () => {
        const uri = URI.join(baseURI, 'move', 'file.txt');
        const newUri = URI.join(baseURI, 'move', 'file-move.txt');
        await (clientService.createFile(uri, DataBuffer.fromString('move content')).unwrap());

        await (clientService.moveTo(uri, newUri).unwrap());
        const content = (await (clientService.readFile(newUri)).unwrap()).toString();
        assert.strictEqual(content, 'move content');
        const exist = await (clientService.exist(uri).unwrap());
        assert.strictEqual(exist, false);

        await (clientService.writeFile(uri, DataBuffer.fromString('move content1'), { overwrite: true, create: true, unlock: true }).unwrap());
        try {
            // cannot overwrite
            await (clientService.moveTo(uri, newUri, false).unwrap());
        } catch {
            // overwrite
            await (clientService.moveTo(uri, newUri, true).unwrap());
            const content = (await (clientService.readFile(newUri)).unwrap()).toString();
            assert.strictEqual(content, 'move content1');
            const exist = await (clientService.exist(uri).unwrap());
            assert.strictEqual(exist, false);
        }
    }));

    test('moveTo - Directory', () => FakeAsync.run(async () => {
        const dir1Uri = URI.join(baseURI, 'move', 'dir1');
        const uri = URI.join(dir1Uri, 'file.txt');
        const dir2Uri = URI.join(baseURI, 'move', 'dir2');
        const newUri = URI.join(dir2Uri, 'file.txt');
        await (clientService.createFile(uri, DataBuffer.fromString('move content')).unwrap());

        await (clientService.moveTo(dir1Uri, dir2Uri).unwrap());
        const content = (await (clientService.readFile(newUri)).unwrap()).toString();
        assert.strictEqual(content, 'move content');
        const exist = await (clientService.exist(dir1Uri).unwrap());
        assert.strictEqual(exist, false);

        await (clientService.createFile(uri, DataBuffer.fromString('move content1')).unwrap());
        try {
            // cannot overwrite
            await (clientService.moveTo(dir1Uri, dir2Uri, false).unwrap());
        } catch {
            // overwrite
            await (clientService.moveTo(dir1Uri, dir2Uri, true).unwrap());
            const content = (await (clientService.readFile(newUri)).unwrap()).toString();
            assert.strictEqual(content, 'move content1');
            const exist = await (clientService.exist(dir1Uri).unwrap());
            assert.strictEqual(exist, false);
        }
    }));
});