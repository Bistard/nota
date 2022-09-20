import * as assert from 'assert';
import { DataBuffer } from 'src/base/common/file/buffer';
import { ByteSize, FileType } from 'src/base/common/file/file';
import { URI } from 'src/base/common/file/uri';
import { DiskFileSystemProvider } from 'src/code/platform/files/node/diskFileSystemProvider';
import { FileService } from 'src/code/platform/files/common/fileService';
import { NullLogger, TestURI } from 'test/utility';
import { Random } from 'src/base/common/util/random';
import { Arrays } from 'src/base/common/util/array';
import { after, before } from 'mocha';

suite('FileService-disk-test', () => {

    const service = new FileService(new NullLogger());

    async function createFileWithSize(resource: URI, size: number, defaultChar?: number): Promise<void> {
        
        const arr: string[] = [];

        if (!defaultChar) {
            for (let i = 0; i < size; i++) {
                arr[i] = Random.char();
            }
        } else {
            for (let i = 0; i < size; i++) {
                arr[i] = String(defaultChar);
            }
        }
        
        const buffer = DataBuffer.fromString(arr.join());
        return service.writeFile(resource, buffer, { create: true, overwrite: true, unlock: true });
    }

    const baseURI = URI.join(TestURI, 'file-service-test');

    before(async () => {
        // disk provider registration
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);
        assert.strictEqual(provider, service.getProvider('file'));

        // create testing files
        await service.createDir(baseURI);
        const filebaseURI = URI.join(baseURI, 'files');
        for (const size of [ByteSize.KB, 256 * ByteSize.KB, ByteSize.MB, 10 * ByteSize.MB]) {
            await createFileWithSize(URI.join(filebaseURI, `file-${size}.txt`), size, undefined);
        }
    });

    test('stat - basic', async () => {
        const stat = await service.stat(baseURI);
        assert.strictEqual(stat.type, FileType.DIRECTORY);
        assert.strictEqual(stat.name, 'file-service-test');
        assert.strictEqual(stat.readonly, false);
        assert.strictEqual(stat.children, undefined);
    });
    
    test('stat - resolve children', async () => {
        const filebaseURI = URI.join(baseURI, 'files');
        const stat = await service.stat(filebaseURI, { resolveChildren: true });
        assert.strictEqual(stat.type, FileType.DIRECTORY);
        assert.strictEqual(stat.name, 'files');
        assert.strictEqual(stat.readonly, false);
        assert.strictEqual([...stat.children!].length, 4);
    });

    test('stat - resolve children recursive', async () => {
        const stat = await service.stat(baseURI, { resolveChildrenRecursive: true });
        
        assert.strictEqual(stat.type, FileType.DIRECTORY);
        assert.strictEqual(stat.name, 'file-service-test');
        assert.strictEqual(stat.readonly, false);

        const tempDir = Arrays.coalesce([...stat.children!].map(child => child.name === 'files' ? child : undefined))[0]!;
        assert.strictEqual(tempDir.type, FileType.DIRECTORY);
        assert.strictEqual(tempDir.name, 'files');
        assert.strictEqual([...tempDir.children!].length, 4);
    });

    test('readFile - basic', async () => {
        const filebaseURI = URI.join(baseURI, 'files');
        const uri = URI.join(filebaseURI, `file-${ByteSize.KB}.txt`);
        await service.readFile(uri);
    });

    test('readFile - error', async () => {
        const filebaseURI = URI.join(baseURI, 'files');
        const uri = URI.join(filebaseURI, `file-unknown.txt`);
        try {
            await service.readFile(uri);
            assert.strictEqual(false, true);
        } catch (error) {
            assert.strictEqual(true, true);
        }
    });

    test('readDir', async () => {
        const filebaseURI = URI.join(baseURI, 'files');
        const dir = await service.readDir(filebaseURI);
        assert.strictEqual(dir.length, 4);
        assert.strictEqual(dir[0]![1], FileType.FILE);
        assert.strictEqual(dir[1]![1], FileType.FILE);
        assert.strictEqual(dir[2]![1], FileType.FILE);
        assert.strictEqual(dir[3]![1], FileType.FILE);
    });

    test('createDir', async () => {
        const root = URI.join(baseURI, 'dir-1');
        const uri = URI.join(root, 'dir-2');
        
        await service.createDir(uri);
        const dir1 = await service.readDir(root);
        assert.strictEqual(dir1.length, 1);
        assert.strictEqual(dir1[0]![0], 'dir-2');
        assert.strictEqual(dir1[0]![1], FileType.DIRECTORY);
        
        await service.delete(root, { recursive: true, useTrash: false });
    });

    test('exist', async () => {
        const filebaseURI = URI.join(baseURI, 'files');
        assert.strictEqual(await service.exist(filebaseURI), true);
        assert.strictEqual(await service.exist(URI.join(filebaseURI, `file-${ByteSize.KB}.hello.world`)), false);
        assert.strictEqual(await service.exist(URI.join(filebaseURI, `file-${256 * ByteSize.KB}.txt`)), true);
        assert.strictEqual(await service.exist(URI.join(filebaseURI, `file-${ByteSize.MB}.txt`)), true);
        assert.strictEqual(await service.exist(URI.join(filebaseURI, `file-${10 * ByteSize.MB}.txt`)), true);
    });

    test('delete - file', async () => {
        const base = URI.join(baseURI, 'delete');
        const uri = URI.join(base, 'delete.txt');
        await service.writeFile(uri, DataBuffer.fromString('goodbyte world'), { create: true, overwrite: true, unlock: true });

        await service.delete(uri, { useTrash: true, recursive: true });

        const dir = await service.readDir(base);
        assert.strictEqual(dir.length, 0);
    });

    test('delete - recursive', async () => {
        const root = URI.join(baseURI, 'delete-recursive');
        const dir1 = URI.join(root, 'dir-1');
        const dir2 = URI.join(dir1, 'dir-2');
        const dir3 = URI.join(dir2, 'dir-3');
        await service.createDir(dir3);

        await service.delete(dir1, { useTrash: true, recursive: true });

        const dir = await service.readDir(root);
        assert.strictEqual(dir.length, 0);
    });

    test('delete - non recursive', async () => {
        const base = URI.join(baseURI, 'delete-non-recursive');
        try {    
            const uri = URI.join(base, 'dir1', 'dir2', 'file1.txt');
            await service.writeFile(uri, DataBuffer.alloc(0), { create: true, overwrite: true, unlock: true });
            await service.delete(base, { useTrash: true, recursive: false });
            assert.strictEqual(true, false);
        } catch (err) {
            await service.delete(base, { useTrash: true, recursive: true });
            assert.strictEqual(true, true);
        }
    });

    test('writeFile - basic', async () => {
        const uri = URI.join(baseURI, 'writefile');
        await service.writeFile(uri, DataBuffer.alloc(0), { create: true, overwrite: true, unlock: true });

        const write1 = DataBuffer.fromString('Goodbye World');
        await service.writeFile(uri, write1, { create: false, overwrite: true, unlock: true });
        const read1 = await service.readFile(uri);
        assert.strictEqual(read1.toString(), 'Goodbye World');

        const write2 = DataBuffer.fromString('Hello World');
        await service.writeFile(uri, write2, { create: false, overwrite: true, unlock: true });
        const read2 = await service.readFile(uri);
        assert.strictEqual(read2.toString(), 'Hello World');
    });

    test('writeFile - create', async () => {
        const uri = URI.join(baseURI, 'writefile-create', 'create.txt');
        
        // create: false
        const write1 = DataBuffer.fromString('create new file1');
        try {
            await service.writeFile(uri, write1, { create: false, overwrite: false, unlock: true });
        } catch { /** noop */ }
        const exist = await service.exist(uri);
        assert.strictEqual(exist, false);

        // create: true
        const write2 = DataBuffer.fromString('create new file2');
        await service.writeFile(uri, write2, { create: true, overwrite: false, unlock: true });
        const read2 = await service.readFile(uri);
        assert.strictEqual(read2.toString(), 'create new file2');
    });

    test('writeFile - overwrite', async () => {
        const uri = URI.join(baseURI, 'writefile-overwrite', 'overwrite.txt');
        await service.writeFile(uri, DataBuffer.fromString('Hello World'), { create: true, overwrite: true, unlock: true });

        try {
            await service.writeFile(uri, DataBuffer.fromString('Goodbye World'), { create: false, overwrite: false, unlock: true });
        } catch { /** noop */ }
        const read1 = await service.readFile(uri);
        assert.strictEqual(read1.toString(), 'Hello World');
    });
   
    test('readFile - 256kb', async () => {
        const uri = URI.join(baseURI, 'files', `file-${256 * ByteSize.KB}.txt`);
        await service.readFile(uri);
    });

    test('writeFile - 256kb', async () => {
        const uri = URI.join(baseURI, 'files', `file-${256 * ByteSize.KB}.txt`);
        const buffer = DataBuffer.fromString(Random.string(256 * ByteSize.KB));
        await service.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true });
    });

    test('readFile - 1mb', async () => {
        const uri = URI.join(baseURI, 'files', `file-${1 * ByteSize.MB}.txt`);
        await service.readFile(uri);
    });

    test('writeFile - 1mb', async () => {
        const uri = URI.join(baseURI, 'files', `file-${1 * ByteSize.MB}.txt`);
        const buffer = DataBuffer.fromString(Random.string(ByteSize.MB));
        await service.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true });
    });

    test('readFile - 10mb', async () => {
        const uri = URI.join(baseURI, 'files', `file-${10 * ByteSize.MB}.txt`);
        await service.readFile(uri);
    });

    test('writeFile - 10mb', async () => {
        const uri = URI.join(baseURI, 'files', `file-${10 * ByteSize.MB}.txt`);
        const buffer = DataBuffer.fromString(Random.string(10 * ByteSize.MB));
        await service.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true });
    });

    test('readFileStream', async () => {
        let cnt = 0;
        const totalSize = 1 * ByteSize.MB;
        const uri = URI.join(baseURI, 'files', `file-${totalSize}.txt`);
        const stream = await service.readFileStream(uri);
        stream.on('data', (data) => {
            cnt++;
        });
        stream.on('end', () => {
            assert.strictEqual(cnt, totalSize / FileService.bufferSize);
        });
        stream.on('error', (err) => {
            assert.strictEqual(false, true);
        }); 

        stream.destroy();
    });

    test('copyTo - file', async () => {
        const uri = URI.join(baseURI, 'copy', 'file.txt');
        const newUri = URI.join(baseURI, 'copy', 'file-copy.txt');
        await service.createFile(uri, DataBuffer.fromString('copy content'));

        await service.copyTo(uri, newUri);

        const content = (await service.readFile(newUri)).toString();
        assert.strictEqual(content, 'copy content');

        await service.writeFile(uri, DataBuffer.fromString('copy content1'), { overwrite: true, create: false, unlock: true });
        try {
            // cannot overwrite
            await service.copyTo(uri, newUri, false);
        } catch {
            // overwrite
            await service.copyTo(uri, newUri, true);
            const content = (await service.readFile(newUri)).toString();
            assert.strictEqual(content, 'copy content1');
        }
    });

    test('copyTo - directory', async () => {
        const dir1Uri = URI.join(baseURI, 'copy', 'dir1');
        const uri = URI.join(dir1Uri, 'file.txt');
        const dir2Uri = URI.join(baseURI, 'copy', 'dir2');
        const newUri = URI.join(dir2Uri, 'file.txt');
        
        await service.createFile(uri, DataBuffer.fromString('copy content'));
        await service.copyTo(dir1Uri, dir2Uri);

        const content = (await service.readFile(newUri)).toString();
        assert.strictEqual(content, 'copy content');

        await service.writeFile(uri, DataBuffer.fromString('copy content1'), { overwrite: true, create: false, unlock: true });
        try {
            // cannot overwrite
            await service.copyTo(dir1Uri, dir2Uri, false);
        } catch {
            // overwrite
            await service.copyTo(dir1Uri, dir2Uri, true);
            const content = (await service.readFile(newUri)).toString();
            assert.strictEqual(content, 'copy content1');
        }
    });

    test('moveTo - file', async () => {
        const uri = URI.join(baseURI, 'move', 'file.txt');
        const newUri = URI.join(baseURI, 'move', 'file-move.txt');
        await service.createFile(uri, DataBuffer.fromString('move content'));

        await service.moveTo(uri, newUri);
        const content = (await service.readFile(newUri)).toString();
        assert.strictEqual(content, 'move content');
        const exist = await service.exist(uri);
        assert.strictEqual(exist, false);

        await service.writeFile(uri, DataBuffer.fromString('move content1'), { overwrite: true, create: true, unlock: true });
        try {
            // cannot overwrite
            await service.moveTo(uri, newUri, false);
        } catch {
            // overwrite
            await service.moveTo(uri, newUri, true);
            const content = (await service.readFile(newUri)).toString();
            assert.strictEqual(content, 'move content1');
            const exist = await service.exist(uri);
            assert.strictEqual(exist, false);
        }
    });

    test('moveTo - Directory', async () => {
        const dir1Uri = URI.join(baseURI, 'move', 'dir1');
        const uri = URI.join(dir1Uri, 'file.txt');
        const dir2Uri = URI.join(baseURI, 'move', 'dir2');
        const newUri = URI.join(dir2Uri, 'file.txt');
        await service.createFile(uri, DataBuffer.fromString('move content'));

        await service.moveTo(dir1Uri, dir2Uri);
        const content = (await service.readFile(newUri)).toString();
        assert.strictEqual(content, 'move content');
        const exist = await service.exist(dir1Uri);
        assert.strictEqual(exist, false);

        await service.createFile(uri, DataBuffer.fromString('move content1'));
        try {
            // cannot overwrite
            await service.moveTo(dir1Uri, dir2Uri, false);
        } catch {
            // overwrite
            await service.moveTo(dir1Uri, dir2Uri, true);
            const content = (await service.readFile(newUri)).toString();
            assert.strictEqual(content, 'move content1');
            const exist = await service.exist(dir1Uri);
            assert.strictEqual(exist, false);
        }
    });

    // FIX: this does not work in macOS
    // test('watch - basic', async () => {
    //     const base = URI.join(baseURI, 'watch');
    //     const file = URI.join(base, 'watch-file');
    //     await service.createFile(file, DataBuffer.alloc(0));
    //     const unwatch = service.watch(file);

    //     const first = new EventBlocker(service.onDidResourceChange);
    //     service.delete(file);
    //     await first.waiting()
    //     .then((e) => assert.strictEqual(e.match(file), true))
    //     .catch(() => assert.fail());

    //     unwatch.dispose();

    //     const second = new EventBlocker(service.onDidResourceChange, 100);
    //     service.createFile(file, DataBuffer.alloc(0));
    //     await second.waiting()
    //     .then(() => assert.fail('should not be watching'))
    //     .catch(() => { /** success (not watching for this) */ });
    // });

    // FIX: idk why this doesn't work
    // test('watch - directory', async () => {
        
    //     const base = URI.join(baseURI, 'watch1');
    //     const dir = URI.join(base, 'watch-directory');
    //     await service.createDir(dir);
    //     const unwatch = service.watch(dir, { recursive: true });

    //     const first = new EventBlocker(service.onDidResourceChange);
    //     service.createFile(URI.join(dir, 'nest-file1'), DataBuffer.alloc(0));
    //     await first.waiting()
    //     .then((e) => assert.strictEqual(e.affect(dir), true));

    //     unwatch.dispose();

    //     const second = new EventBlocker(service.onDidResourceChange, 100);
    //     service.delete(URI.join(dir, 'nest-file1'));
    //     await second.waiting()
    //     .then(() => assert.fail('should not be watching'))
    //     .catch(() => { /** success (not watching for this) */ });
    // });
    
    after(async () => {
        await service.delete(baseURI, { recursive: true });
    });
});
