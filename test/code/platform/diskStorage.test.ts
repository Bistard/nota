import * as assert from 'assert';
import { after, afterEach, before } from 'mocha';
import { join } from 'src/base/common/files/path';
import { Schemas, URI } from 'src/base/common/files/uri';
import { FileService, IFileService } from 'src/platform/files/common/fileService';
import { DiskStorage } from 'src/platform/files/common/diskStorage';
import { NullLogger } from 'test/utils/testService';
import { InMemoryFileSystemProvider } from 'src/platform/files/common/inMemoryFileSystemProvider';
import { DataBuffer } from 'src/base/common/files/buffer';
import { FakeAsync } from 'test/utils/fakeAsync';

suite('DiskStorage-test', () => {
    let dir: URI;
    let path: URI;
    let fileService: IFileService;

    before(() => FakeAsync.run(async () => {
        dir = URI.fromFile(join('temp', 'storage'));
        path = URI.join(dir, 'storage.json');

        fileService = new FileService(new NullLogger());
        fileService.registerProvider(Schemas.FILE, new InMemoryFileSystemProvider());

        (await fileService.createDir(dir).unwrap());
        (await fileService.createFile(path).unwrap());
    }));

    afterEach(() => FakeAsync.run(async () => {
        (await fileService.writeFile(path, DataBuffer.fromString(''), { create: false }).unwrap());
    }));

    after(() => FakeAsync.run(async () => {
        (await fileService.delete(dir, { recursive: true }).unwrap());
        fileService.dispose();
    }));

    test('basic - set / get / has', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, fileService);
        (await storage.init().unwrap());

        await storage.set('key1', 'value1').unwrap();
        assert.strictEqual(storage.get('key1'), 'value1');

        await storage.set('key2', null).unwrap();
        assert.strictEqual(storage.get('key2'), undefined);

        assert.strictEqual(storage.get('key3'), undefined);

        await storage.setLot([
            { key: 'key3', val: 'value3' },
            { key: 'key4', val: 'value4' },
            { key: 'key5', val: 'value5' },
        ]).unwrap();
        assert.strictEqual(storage.get('key3'), 'value3');
        assert.strictEqual(storage.get('key4'), 'value4');
        assert.strictEqual(storage.get('key5'), 'value5');

        await storage.set('key6', null).unwrap();
        assert.deepStrictEqual(storage.getLot(['key6', 'key7'], [undefined, undefined]), [undefined, undefined]);

        assert.strictEqual(storage.has('key4'), true);
        assert.strictEqual(storage.has('key5'), true);
        assert.strictEqual(storage.has('key6'), false);
        assert.strictEqual(storage.has('key7'), false);
    }));

    test('get with no value - replace with default', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, fileService);
        (await storage.init().unwrap());
        assert.strictEqual(storage.get('key1', 'default1'), 'default1');
    }));

    test('used before init', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, fileService);

        await storage.set('key1', 'value1').unwrap();
        await storage.delete('key2').unwrap();

        assert.strictEqual(storage.get('key1'), 'value1');
        assert.strictEqual(storage.get('key2'), undefined);

        (await storage.init().unwrap());

        assert.strictEqual(storage.get('key1'), 'value1');
        assert.strictEqual(storage.get('key2'), undefined);
    }));

    test('used after close', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, fileService);
        (await storage.init().unwrap());

        await storage.set('key1', 'value1').unwrap();
        await storage.set('key2', 'value2').unwrap();
        await storage.set('key3', 'value3').unwrap();
        await storage.set('key4', 'value4').unwrap();

        (await storage.close().unwrap());

        await storage.set('key5', 'marker').unwrap();

        const contents = ((await fileService.readFile(path).unwrap())).toString();
        assert.ok(contents.includes('value1'));
        assert.ok(!contents.includes('marker'));

        (await storage.close().unwrap());
    }));

    test('Closed before init', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, fileService);

        await storage.set('key1', 'value1').unwrap();
        await storage.set('key2', 'value2').unwrap();
        await storage.set('key3', 'value3').unwrap();
        await storage.set('key4', 'value4').unwrap();

        (await storage.close().unwrap());

        const contents = ((await fileService.readFile(path).unwrap())).toString();
        assert.strictEqual(contents.length, 0);
    }));

    test('re-init', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, fileService);
        (await storage.init().unwrap());

        (await storage.close().unwrap());

        await storage.set('key1', 'value1').unwrap();
        await storage.set('key2', 'value2').unwrap();
        await storage.set('key3', 'value3').unwrap();
        await storage.set('key4', 'value4').unwrap();

        (await storage.init().unwrap());

        assert.deepStrictEqual(storage.getLot(['key1', 'key2', 'key3', 'key4']), [undefined, undefined, undefined, undefined]);
    }));

    test('manually saving', () => FakeAsync.run(async () => {
        const storage = new DiskStorage(path, fileService);
        (await storage.init().unwrap());

        await storage.set('key1', 'value1').unwrap();
        await storage.set('key2', 'value2').unwrap();
        await storage.set('key3', 'value3').unwrap();
        await storage.set('key4', 'value4').unwrap();

        (await storage.save().unwrap());

        const contents = ((await fileService.readFile(path).unwrap())).toString();
        assert.strictEqual(contents.length > 0, true);
    }));
});