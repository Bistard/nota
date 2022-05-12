import * as assert from 'assert';
import { resolve } from 'path';
import { delayFor } from 'src/base/common/async';
import { DataBuffer } from 'src/base/common/file/buffer';
import { FileType } from 'src/base/common/file/file';
import { dirname, posix } from 'src/base/common/file/path';
import { URI } from 'src/base/common/file/uri';
import { DiskFileSystemProvider } from 'src/base/node/diskFileSystemProvider';
import { fileExists } from 'src/base/node/io';
import { FileService } from 'src/code/common/service/fileService/fileService';

suite('FileService-disk-unbuffered-test', () => {

    test('provider registration', async () => {
        // TODO
    });
    
    test('readFile - basic', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);
        
        const uri = URI.parse('file://' + posix.resolve('test/code/service/temp', 'fileService-hello.txt'));
        
        const read = await service.readFile(uri);
        assert.strictEqual(read.toString(), 'Hello World');
    });

    test('readFile - error', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);
        
        const uri = URI.parse('file://' + posix.resolve('test/code/service/temp', 'unknown.txt'));
        
        try {
            const read = await service.readFile(uri);
            assert.strictEqual(false, true);
        } catch (error) {
            assert.strictEqual(true, true);
        }
    });

    test('readDir', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        try {
            const uri = URI.fromFile('test/code/service/temp');
            const dir = await service.readDir(uri);
            assert.strictEqual(dir.length, 4);
            assert.strictEqual(dir[0]![1], FileType.FILE);
            assert.strictEqual(dir[1]![1], FileType.FILE);
            assert.strictEqual(dir[2]![1], FileType.FILE);
            assert.strictEqual(dir[3]![1], FileType.FILE);
        } catch (err) {
            assert.strictEqual(false, true);
        }
    });

    // TODO
    test('createDir', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        try {
            const root = URI.fromFile('test/code/service/temp/newDir1');
            const uri = URI.fromFile('test/code/service/temp/newDir1/newDir2');
            await service.createDir(uri);
            await delayFor(1500);

            const dir1 = await service.readDir(root);
            assert.strictEqual(dir1.length, 1);
            assert.strictEqual(dir1[0]![0], 'newDir2');
            assert.strictEqual(dir1[0]![1], FileType.DIRECTORY);
            
            await service.delete(root, { recursive: true, useTrash: false });
        } catch (err) {
            throw err;
            // assert.strictEqual(false, true);
        }
    });

    test('exist', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        assert.strictEqual(await service.exist(URI.fromFile('test/code/service/temp')), true);
        assert.strictEqual(await service.exist(URI.fromFile('test/code/service/temp1')), false);
        assert.strictEqual(await service.exist(URI.fromFile('test/code/service/temp/fileService-1mb.txt')), true);
        assert.strictEqual(await service.exist(URI.fromFile('test/code/service/temp/fileService-1mb')), false);
    });

    // TODO
    test('delete - file', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        try {
            const root = URI.fromFile('test/code/service/temp');
            const uri = URI.fromFile('test/code/service/temp/newfile1');
            await service.writeFile(uri, DataBuffer.alloc(0), { create: true, overwrite: true, unlock: true });

            await service.delete(uri, { useTrash: true, recursive: true });
            await delayFor(1500);

            const dir = await service.readDir(root);
            assert.strictEqual(dir.length, 4);
            assert.strictEqual(dir[0]![1], FileType.FILE);
            assert.strictEqual(dir[1]![1], FileType.FILE);
            assert.strictEqual(dir[2]![1], FileType.FILE);
            assert.strictEqual(dir[3]![1], FileType.FILE);
        } catch (err) {
            throw err;
            // assert.strictEqual(false, true);
        }

        
    });

    test('delete - directory', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        try {
            const root = URI.fromFile('test/code/service/temp');
            const uri = URI.fromFile('test/code/service/temp/newDir1');
            await service.createDir(uri);

            await service.delete(uri, { useTrash: true, recursive: true });
            
            const dir = await service.readDir(root);
            assert.strictEqual(dir.length, 4);
            assert.strictEqual(dir[0]![1], FileType.FILE);
            assert.strictEqual(dir[1]![1], FileType.FILE);
            assert.strictEqual(dir[2]![1], FileType.FILE);
            assert.strictEqual(dir[3]![1], FileType.FILE);
        } catch (err) {
            assert.strictEqual(false, true);
        }
    });

    test('delete - recursive', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        try {
            const root = URI.fromFile('test/code/service/temp');
            const deleted = URI.fromFile('test/code/service/temp/newDir1');
            const uri = URI.fromFile('test/code/service/temp/newDir1/newDir2/newDir3');
            await service.writeFile(uri, DataBuffer.alloc(0), { create: true, overwrite: true, unlock: true });

            await service.delete(deleted, { useTrash: true, recursive: true });
            await delayFor(500);

            const dir = await service.readDir(root);
            assert.strictEqual(dir.length, 4);
            assert.strictEqual(dir[0]![1], FileType.FILE);
            assert.strictEqual(dir[1]![1], FileType.FILE);
            assert.strictEqual(dir[2]![1], FileType.FILE);
            assert.strictEqual(dir[3]![1], FileType.FILE);
        } catch (err) {
            assert.strictEqual(false, true);
        }
    });

    test('delete - non recursive', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        const deleted = URI.fromFile('test/code/service/temp/newDir1');
        try {    
            const uri = URI.fromFile('test/code/service/temp/newDir1/newDir2/newDir3');
            await service.writeFile(uri, DataBuffer.alloc(0), { create: true, overwrite: true, unlock: true });

            await service.delete(deleted, { useTrash: true, recursive: false });
            assert.strictEqual(true, false);
        } catch (err) {
            await service.delete(deleted, { useTrash: true, recursive: true });
            assert.strictEqual(true, true);
        }
    });

    test('writeFile - basic', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        const uri = URI.parse('file://' + posix.resolve('test/code/service/temp', 'fileService-hello.txt'));
        
        const write1 = DataBuffer.fromString('Goodbye World');
        await service.writeFile(uri, write1, { create: false, overwrite: true, unlock: true });
        const read1 = await service.readFile(uri);
        assert.strictEqual(read1.toString(), 'Goodbye World');

        const write2 = DataBuffer.fromString('Hello World');
        await service.writeFile(uri, write2, { create: false, overwrite: true, unlock: true });
        const read2 = await service.readFile(uri);
        assert.strictEqual(read2.toString(), 'Hello World');
    });

    function __generateString(length: number, char: string = '0') {
        var result = '';
        for (var i = length; i > 0; --i) result += char;
        return result;
    }

    test('writeFile - create', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        const uri = URI.fromFile(resolve('test/code/service/temp', 'fileService-create.txt'));
        
        // { create: false }
        const write1 = DataBuffer.fromString('create new file');
        try {
            await service.writeFile(uri, write1, { create: false, overwrite: false, unlock: true });
        } catch (err) {
            // ignore cannot create error
        }
        assert.strictEqual(fileExists(uri.toString().slice('file://'.length)), false);

        // { create: true } 
        const write2 = DataBuffer.fromString('create new file');
        await service.writeFile(uri, write2, { create: true, overwrite: false, unlock: true });
        const read2 = await service.readFile(uri);
        assert.strictEqual(read2.toString(), 'create new file');

        await provider.delete(uri, { recursive: true, useTrash: false });
    });

    test('writeFile - create recursive', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        const uri = URI.parse('file://' + posix.resolve('test/code/service/temp/recursive', 'fileService-create.txt'));
        
        // { create: false }
        const write1 = DataBuffer.fromString('create new file recursively');
        try {
            await service.writeFile(uri, write1, { create: false, overwrite: false, unlock: true });
        } catch (err) {
            // ignore cannot create error
        }
        assert.strictEqual(fileExists(uri.toString().slice('file://'.length)), false);

        // { create: true } 
        const write2 = DataBuffer.fromString('create new file recursively');
        await service.writeFile(uri, write2, { create: true, overwrite: false, unlock: true });
        const read2 = await service.readFile(uri);
        assert.strictEqual(read2.toString(), 'create new file recursively');
        
        await provider.delete(URI.fromFile(dirname(URI.toFsPath(uri))), { recursive: true, useTrash: false });
    });

    test('writeFile - overwrite', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        const uri = URI.parse('file://' + posix.resolve('test/code/service/temp', 'fileService-hello.txt'));
        const write1 = DataBuffer.fromString('Goodbye World');
        try {
            await service.writeFile(uri, write1, { create: true, overwrite: false, unlock: true });
        } catch (err) {
            // ignore cannot overwrite error
        }
        const read1 = await service.readFile(uri);
        assert.strictEqual(read1.toString(), 'Hello World');
    });
   
    async function __createFileWithSize(sizeInByte: number, filename: string, fill: string = '0'): Promise<void> {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        const uri = URI.parse('file://' + posix.resolve('test/code/service/temp', filename));
        const buffer = DataBuffer.fromString(__generateString(sizeInByte, fill));
        return await service.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true });
    }

    const str256kb = __generateString(256 * 1024, '0');
    const str1mb = __generateString(4 * 256 * 1024, '0');
    const str10mb = __generateString(40 * 256 * 1024, '0');

    test('readFile - 256kb', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        try {
            const uri = URI.parse('file://' + posix.resolve('test/code/service/temp', 'fileService-256kb.txt'));
            const read = await service.readFile(uri);
            assert.strictEqual(true, true);
        } catch (err) {
            assert.strictEqual(false, true);
        }
    });

    test('writeFile - 256kb', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        try {
            const uri = URI.parse('file://' + posix.resolve('test/code/service/temp', 'fileService-256kb.txt'));
            const buffer = DataBuffer.fromString(str256kb);
            await service.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true });
            assert.strictEqual(true, true);
        } catch (err) {
            assert.strictEqual(false, true);
        }
    });

    test('readFile - 1mb', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        try {
            const uri = URI.parse('file://' + posix.resolve('test/code/service/temp', 'fileService-1mb.txt'));
            const read = await service.readFile(uri);
            assert.strictEqual(true, true);
        } catch (err) {
            assert.strictEqual(false, true);
        }
    });

    test('writeFile - 1mb', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        try {
            const uri = URI.parse('file://' + posix.resolve('test/code/service/temp', 'fileService-1mb.txt'));
            const buffer = DataBuffer.fromString(str1mb);
            await service.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true });
            assert.strictEqual(true, true);
        } catch (err) {
            assert.strictEqual(false, true);
        }
    });

    test('readFile - 10mb', async () => {
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        try {
            const uri = URI.parse('file://' + posix.resolve('test/code/service/temp', 'fileService-10mb.txt'));
            const read = await service.readFile(uri);
            assert.strictEqual(true, true);
        } catch (err) {
            assert.strictEqual(false, true);
        }
    });

    test('writeFile - 10mb', async () => { // REVIEW: slow (~160ms)
        const service = new FileService();
        const provider = new DiskFileSystemProvider();
        service.registerProvider('file', provider);

        try {
            const uri = URI.parse('file://' + posix.resolve('test/code/service/temp', 'fileService-10mb.txt'));
            const buffer = DataBuffer.fromString(str10mb);
            await service.writeFile(uri, buffer, { create: true, overwrite: true, unlock: true });
            assert.strictEqual(true, true);
        } catch (err) {
            assert.strictEqual(false, true);
        }
    });

});

suite('fileService-test-disk-buffered', () => {
    // TODO

    // test('rename-svg-icons-in-batch', async () => {
    //     const service = new FileService();
    //     const provider = new DiskFileSystemProvider();
    //     service.registerProvider('file', provider);
        
    //     // read directory
    //     const dir = URI.fromFile('D:/dev/nota/src/assets/svg');
    //     const read = await provider.readdir(dir);
        
    //     for (const pair of read) {
    //         const file = pair[0]!;
    //         const buffer = await service.readFile(URI.fromFile(URI.toFsPath(dir) + '/' + file));
    //         await service.writeFile(URI.fromFile('D:/dev/nota/src/assets/save/' + file.slice(6)), buffer, {create: true, overwrite: true, unlock: true});
    //     }
    // });

});