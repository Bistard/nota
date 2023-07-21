import * as assert from 'assert';
import { after, afterEach, before } from 'mocha';
import { join } from 'src/base/common/file/path';
import { Schemas, URI } from 'src/base/common/file/uri';
import { FileService, IFileService } from 'src/platform/files/common/fileService';
import { DiskStorage } from 'src/platform/files/common/diskStorage';
import { NullLogger } from 'test/utils/testService';
import { InMemoryFileSystemProvider } from 'src/platform/files/common/inMemoryFileSystemProvider';
import { DataBuffer } from 'src/base/common/file/buffer';
import { FakeAsync } from 'test/utils/fakeAsync';

suite('storage-test', () => {

    let dir: URI;
    let path: URI;
    let fileService: IFileService;

    before(() => FakeAsync.run(async () => {
        dir = URI.fromFile(join('temp', 'storage'));
        path = URI.join(dir, 'storage.json');

        fileService = new FileService(new NullLogger());
        fileService.registerProvider(Schemas.FILE, new InMemoryFileSystemProvider());

        await fileService.createDir(dir);
        await fileService.createFile(path);
    }));

    afterEach(() => FakeAsync.run(async () => {
        await fileService.writeFile(path, DataBuffer.fromString(''), { create: false });
    }));

    after(() => FakeAsync.run(async () => {
        await fileService.delete(dir, { recursive: true });
        fileService.dispose();
    }));

    test('basic - set / get / has', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, true, fileService);
        await storage.init();

        storage.set('key1', 'value1');
        assert.strictEqual(storage.get('key1'), 'value1');

        storage.set('key2', null);
        assert.strictEqual(storage.get('key2'), undefined);

        assert.strictEqual(storage.get('key3'), undefined);

        storage.setLot([
            { key: 'key3', val: 'value3' },
            { key: 'key4', val: 'value4' },
            { key: 'key5', val: 'value5' },
        ]);
        assert.strictEqual(storage.get('key3'), 'value3');
        assert.strictEqual(storage.get('key4'), 'value4');
        assert.strictEqual(storage.get('key5'), 'value5');

        storage.set('key6', null);
        assert.deepStrictEqual(storage.getLot(['key6', 'key7'], [undefined, undefined]), [undefined, undefined]);

        assert.strictEqual(storage.has('key4'), true);
        assert.strictEqual(storage.has('key5'), true);
        assert.strictEqual(storage.has('key6'), false);
        assert.strictEqual(storage.has('key7'), false);
    }));

    test('used before init', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, true, fileService);

        storage.set('key1', 'value1');
        storage.delete('key2');

        assert.strictEqual(storage.get('key1'), 'value1');
        assert.strictEqual(storage.get('key2'), undefined);

        await storage.init();

        assert.strictEqual(storage.get('key1'), 'value1');
        assert.strictEqual(storage.get('key2'), undefined);
    }));

    test('used after close', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, true, fileService);
        await storage.init();

        storage.set('key1', 'value1');
        storage.set('key2', 'value2');
        storage.set('key3', 'value3');
        storage.set('key4', 'value4');

        await storage.close();

        storage.set('key5', 'marker');

        const contents = (await fileService.readFile(path)).toString();
        assert.ok(contents.includes('value1'));
        assert.ok(!contents.includes('marker'));

        await storage.close();
    }));

    test('Closed before init', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, true, fileService);

        storage.set('key1', 'value1');
        storage.set('key2', 'value2');
        storage.set('key3', 'value3');
        storage.set('key4', 'value4');

        await storage.close();

        const contents = (await fileService.readFile(path)).toString();
        assert.strictEqual(contents.length, 0);
    }));

    test('re-init', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, true, fileService);
        await storage.init();

        await storage.close();

        storage.set('key1', 'value1');
        storage.set('key2', 'value2');
        storage.set('key3', 'value3');
        storage.set('key4', 'value4');

        await storage.init();

        assert.deepStrictEqual(storage.getLot(['key1', 'key2', 'key3', 'key4']), [undefined, undefined, undefined, undefined]);
    }));

    test('non-sync saving', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, false, fileService);
        await storage.init();

        storage.set('key1', 'value1');
        storage.set('key2', 'value2');
        storage.set('key3', 'value3');
        storage.set('key4', 'value4');

        let contents = (await fileService.readFile(path)).toString();
        assert.strictEqual(contents.length, 0);

        await storage.close();

        contents = (await fileService.readFile(path)).toString();
        assert.strictEqual(contents.length > 0, true);
    }));

    test('manually saving', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, false, fileService);
        await storage.init();

        storage.set('key1', 'value1');
        storage.set('key2', 'value2');
        storage.set('key3', 'value3');
        storage.set('key4', 'value4');

        await storage.save();

        const contents = (await fileService.readFile(path)).toString();
        assert.strictEqual(contents.length > 0, true);
    }));

    test('sync saving', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, true, fileService);
        await storage.init();

        await storage.set('key1', 'value1');
        await storage.set('key2', 'value2');
        await storage.set('key3', 'value3');
        await storage.set('key4', 'value4');

        const contents = (await fileService.readFile(path)).toString();
        assert.strictEqual(contents.length > 0, true);
    }));
});