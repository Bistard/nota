import * as assert from 'assert';
import { afterEach, before } from 'mocha';
import { DataBuffer } from 'src/base/common/files/buffer';
import { Schemas, URI } from 'src/base/common/files/uri';
import { IS_LINUX } from 'src/base/common/platform';
import { EventBlocker } from 'src/base/common/utilities/async';
import { directoryExists } from 'src/base/node/io';
import { FileService, IFileService } from 'src/platform/files/common/fileService';
import { IRawResourceChangeEvents } from 'src/platform/files/common/watcher';
import { DiskFileSystemProvider } from 'src/platform/files/node/diskFileSystemProvider';
import { Watcher } from 'src/platform/files/node/watcher';
import { NullLogger, TestURI } from 'test/utils/testService';

suite('watcher-test', () => {

    let fileService: IFileService;
    const baseURI = URI.join(TestURI, 'watcher');

    async function clean(): Promise<void> {
        if (await directoryExists(URI.toFsPath(baseURI))) {
            (await fileService.delete(baseURI, { recursive: true }).unwrap());
        }
    }

    before(async () => {
        fileService = new FileService(new NullLogger());
        fileService.registerProvider(Schemas.FILE, new DiskFileSystemProvider());
        await clean();
    });

    afterEach(async () => {
        await clean();
    });

    test('watch file - update', async () => {
        const fileURI = URI.join(baseURI, 'file.txt');
        (await fileService.createFile(fileURI, DataBuffer.alloc(0), { overwrite: true }).unwrap());
        
        const watcher = new Watcher();
        const cancel = await watcher.watch({
            resource: fileURI,
            recursive: false,
        });

        const blocker = new EventBlocker<IRawResourceChangeEvents>(watcher.onDidChange);
        (await fileService.writeFile(fileURI, DataBuffer.fromString('hello world'), { create: false, overwrite: true, }).unwrap());
        const e = await blocker.waiting();
        
        /**
         * The raw path produce by the node.js watcher should have schema file://.
         */
        assert.strictEqual(URI.parse(e.events[0]!.resource).scheme, Schemas.FILE);
        assert.strictEqual(e.events[0]!.resource, URI.toString(fileURI));
        
        // match check
        assert.ok(e.anyFile);
        assert.ok(e.anyUpdated);
        assert.ok(!e.anyDeleted);
        assert.ok(!e.anyAdded);
        assert.ok(!e.anyDirectory);
        assert.ok(e.wrap().match(fileURI));

        cancel.dispose();
    });

    test('watch directory (non-recursive) direct file will be watched', async function () {
        if (IS_LINUX) {
            this.skip(); // FIX
        }
        
        const subDirURI = URI.join(baseURI, 'subDir');
        await fileService.createDir(subDirURI).unwrap();

        const fileURI = URI.join(subDirURI, 'file.txt');

        const watcher = new Watcher();
        const cancel = await watcher.watch({
            resource: subDirURI,
            recursive: false,
        });

        const blocker = new EventBlocker<IRawResourceChangeEvents>(watcher.onDidChange);
        await fileService.writeFile(fileURI, DataBuffer.fromString('hello world'), { create: true, overwrite: true, }).unwrap();
        const events = await blocker.waiting();
        
        assert.ok(events.anyAdded);
        assert.ok(events.anyFile);
        assert.ok(!events.anyDeleted);
        assert.ok(!events.anyUpdated);
        assert.ok(!events.anyDirectory);
        assert.ok(events.wrap().match(fileURI));

        cancel.dispose();
    });
    
    test('watch directory (non-recursive) non-direct file will not be watched', async function () {
        const subDirURI = URI.join(baseURI, 'subDir');
        await fileService.createDir(URI.join(subDirURI, 'non-direct')).unwrap();

        const fileURI = URI.join(subDirURI, 'non-direct', 'file.txt');

        const watcher = new Watcher();
        const cancel = await watcher.watch({
            resource: subDirURI,
            recursive: false,
        });

        const blocker = new EventBlocker<IRawResourceChangeEvents>(watcher.onDidChange, 10);
        await fileService.writeFile(fileURI, DataBuffer.fromString('hello world'), { create: true, overwrite: true, }).unwrap();
        
        return assert.rejects(() => blocker.waiting())
        .then(() => cancel.dispose());
    });
    
    test('watch directory (recursive)', async function () {
        if (IS_LINUX) {
            this.skip(); // FIX
        }
        
        const subDirURI = URI.join(baseURI, 'subDir');
        await fileService.createDir(URI.join(subDirURI, 'non-direct')).unwrap();

        const fileURI = URI.join(subDirURI, 'non-direct', 'file.txt');

        const watcher = new Watcher();
        const cancel = await watcher.watch({
            resource: subDirURI,
            recursive: true,
        });

        const blocker = new EventBlocker<IRawResourceChangeEvents>(watcher.onDidChange);
        await fileService.writeFile(fileURI, DataBuffer.fromString('hello world'), { create: true, overwrite: true, }).unwrap();
        const events = await blocker.waiting();
        
        assert.ok(events.anyAdded);
        assert.ok(events.anyFile);
        assert.ok(!events.anyDeleted);
        assert.ok(!events.anyUpdated);
        assert.ok(!events.anyDirectory);
        assert.ok(events.wrap().match(fileURI));

        cancel.dispose();
    });
});