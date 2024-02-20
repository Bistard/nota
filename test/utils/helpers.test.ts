import * as assert from 'assert';
import { suite, test, before, beforeEach } from 'mocha';
import { DataBuffer } from 'src/base/common/files/buffer';
import { FileType } from 'src/base/common/files/file';
import { URI } from 'src/base/common/files/uri';
import { AsyncResult } from 'src/base/common/result';
import { TreeLike, isNullable } from 'src/base/common/utilities/type';
import { IFileService } from 'src/platform/files/common/fileService';
import { FileTreeNode, buildFileTree } from 'test/utils/helpers';

suite('buildFileTree-test', () => {

    let fileService: IFileService;
    const createdDirs: Set<string> = new Set();
    const createdFiles = new Map<string, string>();

    const rootURI = URI.fromFile('/root');

    before(() => {
        fileService = <any>{
            createDir: (uri: URI) => {
                createdDirs.add(URI.toString(uri));
                return AsyncResult.ok();
            },
            createFile: (uri: URI, buffer: DataBuffer) => {
                const strURI = URI.toString(uri);
                createdFiles.set(strURI, buffer.toString());
                return AsyncResult.ok();
            },
        };
    });

    beforeEach(() => {
        createdDirs.clear();
        createdFiles.clear();
    });

    function assertDir(uri: URI): void {
        const strURI = URI.toString(uri);
        assert.ok(createdDirs.has(strURI), `Directory '${strURI}' should exist`);
    }
    
    async function assertFile(uri: URI, data?: string): Promise<void> {
        const strURI = URI.toString(uri);
        assert.ok(createdFiles.has(strURI), `File '${strURI}' should exist`);
        if (!isNullable(data)) {
            assert.strictEqual(createdFiles.get(strURI), data, `File content for '${strURI}' does not match`);
        }
    }

    test('Should create a single file at root level', async () => {
        const tree: TreeLike<FileTreeNode> = {
            value: { name: 'testFile.txt', type: FileType.FILE, data: 'Test content' }
        };

        await buildFileTree(fileService, rootURI, {}, tree);
        await assertFile(URI.join(rootURI, 'testFile.txt'), 'Test content');
    });

    test('Should handle empty tree', async () => {
        const tree: TreeLike<FileTreeNode> = {
            value: { name: 'emptyDir', type: FileType.DIRECTORY }
        };

        await buildFileTree(fileService, rootURI, {}, tree);
        assertDir(URI.join(rootURI, 'emptyDir'));
    });

    test('Should create nested directories and files', async () => {
        const tree: TreeLike<FileTreeNode> = {
            value: { name: 'dir', type: FileType.DIRECTORY },
            children: [
                {
                    value: { name: 'subdir', type: FileType.DIRECTORY },
                    children: [
                        { value: { name: 'file.txt', type: FileType.FILE, data: 'File content' } }
                    ]
                }
            ]
        };

        await buildFileTree(fileService, rootURI, {}, tree);
        assertDir(URI.join(rootURI, 'dir'));
        assertDir(URI.join(rootURI, 'dir', 'subdir'));
        await assertFile(URI.join(rootURI, 'dir', 'subdir', 'file.txt'), 'File content');
    });

    test('Should handle tree with multiple siblings', async () => {
        const tree: TreeLike<FileTreeNode> = {
            value: { name: 'parentDir', type: FileType.DIRECTORY },
            children: [
                { value: { name: 'file1.txt', type: FileType.FILE, data: 'Content 1' } },
                { value: { name: 'file2.txt', type: FileType.FILE, data: 'Content 2' } }
            ]
        };

        await buildFileTree(fileService, rootURI, {}, tree);
        assertDir(URI.join(rootURI, 'parentDir'));
        await assertFile(URI.join(rootURI, 'parentDir', 'file1.txt'), 'Content 1');
        await assertFile(URI.join(rootURI, 'parentDir', 'file2.txt'), 'Content 2');
    });
});
