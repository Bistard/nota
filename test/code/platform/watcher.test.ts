import * as assert from 'assert';
import { after, before } from 'mocha';
import { IDisposable, disposeAll } from 'src/base/common/dispose';
import { DataBuffer } from 'src/base/common/files/buffer';
import { Schemas, URI } from 'src/base/common/files/uri';
import { Blocker } from 'src/base/common/utilities/async';
import { FileService, IFileService } from 'src/platform/files/common/fileService';
import { IRawResourceChangeEvents } from 'src/platform/files/common/watcher';
import { DiskFileSystemProvider } from 'src/platform/files/node/diskFileSystemProvider';
import { Watcher } from 'src/platform/files/node/watcher';
import { NullLogger, TestURI } from 'test/utils/testService';

suite('watcher-test', () => {

    let fileService: IFileService;
    const baseURI = URI.join(TestURI, 'watcher');

    before(async () => {
        fileService = new FileService(new NullLogger());
        fileService.registerProvider(Schemas.FILE, new DiskFileSystemProvider());
    });

    after(async () => {
        (await fileService.delete(baseURI, { recursive: true }).unwrap());
    });

    test('watch file', async () => {
        const fileURI = URI.join(baseURI, 'file.txt');
        (await fileService.createFile(fileURI, DataBuffer.alloc(0), { overwrite: true }).unwrap());
        
        const disposables: IDisposable[] = [];

        const watcher = new Watcher();
        disposables.push(watcher.watch({
            resource: fileURI,
            recursive: false,
        }));

        const blocker = new Blocker<IRawResourceChangeEvents>();
        disposables.push(watcher.onDidChange((e) => blocker.resolve(e)));

        (await fileService.writeFile(fileURI, DataBuffer.fromString('hello world'), { create: false, overwrite: true, }).unwrap());

        const e = await blocker.waiting();
        
        /**
         * The raw path produce by the node.js watcher should have schema file://.
         */
        assert.strictEqual(URI.parse(e.events[0]!.resource).scheme, Schemas.FILE);
        assert.strictEqual(e.events[0]!.resource, URI.toString(fileURI));
        
        // match check
        assert.ok(e.wrap().match(fileURI));

        disposeAll(disposables);
    });

    test.skip('watch directory', async () => {
        const subDirURI = URI.join(baseURI, 'subDir');
        const fileURI = URI.join(subDirURI, 'file.txt');

        const disposables: IDisposable[] = [];

        const watcher = new Watcher();
        disposables.push(watcher.watch({
            resource: subDirURI,
            recursive: true, // FIX: seems recursive is not working
        }));

        const blocker = new Blocker<IRawResourceChangeEvents>();
        disposables.push(watcher.onDidChange((e) => blocker.resolve(e)));


        // await fileService.createDir(subDirURI);
        (await fileService.writeFile(fileURI, DataBuffer.fromString('hello world'), { create: true, overwrite: true, }).unwrap());

        const e = await blocker.waiting();
        console.log(e);

        assert.strictEqual(URI.parse(e.events[0]!.resource).scheme, Schemas.FILE);
        assert.strictEqual(e.events[0]!.resource, URI.toString(fileURI));
        
        // match check
        assert.ok(e.wrap().match(fileURI));

        disposeAll(disposables);
    });

});