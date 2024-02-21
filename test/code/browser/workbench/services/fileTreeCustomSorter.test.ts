import * as assert from 'assert';
import { after, before, beforeEach } from 'mocha';
import { DataBuffer } from 'src/base/common/files/buffer';
import { FileType } from 'src/base/common/files/file';
import { URI } from 'src/base/common/files/uri';
import { Arrays } from 'src/base/common/utilities/array';
import { generateMD5Hash } from 'src/base/common/utilities/hash';
import { TreeLike } from 'src/base/common/utilities/type';
import { FileService } from 'src/platform/files/common/fileService';
import { DiskFileSystemProvider } from 'src/platform/files/node/diskFileSystemProvider';
import { FileItem } from 'src/workbench/services/fileTree/fileItem';
import { FileTreeCustomSorter, OrderChangeType } from 'src/workbench/services/fileTree/fileTreeCustomSorter';
import { FileTreeNode, buildFileTree, findFileItemByPath, printFileItem, printFileStat } from 'test/utils/helpers';
import { NullLogger, TestURI } from 'test/utils/testService';

suite('fileTreeCustomSorter-test', () => {

    const hash = (input: string) => generateMD5Hash(input);
    const fileService = new FileService(new NullLogger());
    const rootURI = URI.join(TestURI, 'fileTreeCustomSorterTest');
    let sorter!: FileTreeCustomSorter<FileItem>;

    async function init() {
        const provider = new DiskFileSystemProvider();
        fileService.registerProvider('file', provider);
        await fileService.createDir(rootURI).unwrap();
    }

    // Always refresh the tree structure to the file system hierarchy
    async function refreshFileSystem() {
        const tree: TreeLike<FileTreeNode> = {
            value: {
                name: 'root',
                type: FileType.DIRECTORY,
            },
            children: [
                { value: { name: 'file1', type: FileType.FILE, data: 'Data for file1' } },
                { value: { name: 'file2', type: FileType.FILE, data: 'Data for file2' } },
                { value: { name: 'file3', type: FileType.FILE, data: 'Data for file3' } },
                {
                    value: { name: 'folder1', type: FileType.DIRECTORY },
                    children: [
                        { value: { name: 'folder1_file1', type: FileType.FILE, data: 'Data for folder1_file1' } },
                        { value: { name: 'folder1_file2', type: FileType.FILE, data: 'Data for folder1_file2' } },
                        { value: { name: 'folder1_file3', type: FileType.FILE, data: 'Data for folder1_file3' } },
                    ],
                },
                { value: { name: 'folder2', type: FileType.DIRECTORY } },
            ],
        };

        // build the file tree hierarchy first
        sorter?.dispose();
        sorter = new FileTreeCustomSorter(rootURI, hash, fileService, new NullLogger());
        await buildFileTree(fileService, rootURI, { cleanRoot: true, overwrite: true }, tree);
    }

    async function cleanCache(): Promise<void> {
        await fileService.delete(rootURI, { recursive: true }).unwrap();
    }

    /**
     * @description A helper function to build a {@link FileItem} hierarchy 
     * based on the provided URI in the file system hierarchy.
     */
    async function buildFileItem(uri: URI): Promise<FileItem> {
        
        // stat
        const resolvedStat = await fileService.stat(URI.join(uri, 'root'), {
            resolveChildren: true,
            resolveChildrenRecursive: true,
        }).unwrap();

        // resolve FileItem
        const root = await FileItem.resolve(resolvedStat, null, {
            onError: error => console.log(error),
            beforeCmp: async folder => await sorter.syncMetadataInCacheWithDisk(folder).unwrap(),
            cmp: sorter.compare.bind(sorter),
        });

        // for test purpose if needed
        // printFileItem(root);

        return root;
    }

    function __getHashMetadata(folder: URI): URI {
        const root = rootURI;
        const rawHash = hash(URI.toString(folder));

        const subDir = rawHash.slice(0, 2);
        const metadataName = rawHash.slice(2);

        const metadataURI = URI.join(root, subDir, `${metadataName}.json`);

        return metadataURI;
    }

    /**
     * @description Check if the given folder has its corresponding metadata 
     * file in the disk. Not just checking the existance, but also checking the 
     * actual data in that metadata file.
     * @param folder The metadata corresponding folder name.
     * @param exist If the folder should has corresponding metadata.
     * @param order The actual data in the metadata.
     */
    async function assertMetadataInDisk(folder: URI, exist: false): Promise<void>;
    async function assertMetadataInDisk(folder: URI, exist: true, order: string[]): Promise<void>;
    async function assertMetadataInDisk(folder: URI, exist: boolean, order?: string[]): Promise<void> {
        const metadataURI = __getHashMetadata(folder);

        // check metadata existance first
        assert.strictEqual(exist, await fileService.exist(metadataURI).unwrap(), `'${URI.toString(folder)}' metadata does not match existance. Expect '${exist}'`);

        if (!order) {
            return;
        }

        // read its data
        const rawData = (await fileService.readFile(metadataURI).unwrap()).toString();
        const actualOrders = <string[]>JSON.parse(rawData);
        const expectOrders = order;
        
        // check the actual metadata are exactly same to the expected metadata
        assert.ok(Arrays.exactEquals(actualOrders, expectOrders), `'${URI.toString(folder)}' orders are not exactly equal`);
    }

    async function updateMetadataManually(folder: URI, order: string[]): Promise<void> {
        const metadataURI = __getHashMetadata(folder);
        const buffer = DataBuffer.fromString(JSON.stringify(order));
        await fileService.writeFile(metadataURI, buffer, { overwrite: true, create: true }).unwrap();
    }

    suite('Disk to Cache (syncMetadataInCacheWithDisk)', () => {

        before(() => init());
        beforeEach(async () => refreshFileSystem());
        after(async () => cleanCache());

        test('default order (directory goes first, then alphabet)', async () => {
            await buildFileItem(rootURI);

            await assertMetadataInDisk(
                URI.join(rootURI, 'root'), 
                true,
                ['folder1', 'folder2', 'file1', 'file2', 'file3'],
            );
            await assertMetadataInDisk(
                URI.join(rootURI, 'root', 'folder1'), 
                true,
                ['folder1_file1', 'folder1_file2', 'folder1_file3'], 
            );
        });

        test('empty folder will not have corresponding metadata', async () => {
            await buildFileItem(rootURI);
            await assertMetadataInDisk(
                URI.join(rootURI, 'root', 'folder2'), 
                false,
            );
        });

        test('manually update the metadata to achieve "file goes first"', async () => {
            // update manually
            await updateMetadataManually(
                URI.join(rootURI, 'root'),
                ['file1', 'file2', 'file3', 'folder1', 'folder2', ],
            );

            // build the actual FileItem
            await buildFileItem(rootURI);

            // file should goes first
            await assertMetadataInDisk(
                URI.join(rootURI, 'root'), 
                true,
                ['file1', 'file2', 'file3', 'folder1', 'folder2'],
            );
        });
    });

});