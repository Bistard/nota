import * as assert from 'assert';
import { suite, test, before, beforeEach } from 'mocha';
import { DataBuffer } from 'src/base/common/files/buffer';
import { FileType } from 'src/base/common/files/file';
import { URI } from 'src/base/common/files/uri';
import { AsyncResult } from 'src/base/common/result';
import { TreeLike, isNullable } from 'src/base/common/utilities/type';
import { IFileService } from 'src/platform/files/common/fileService';
import { FileTreeNode, buildFileTree, isEqualTreeLike } from 'test/utils/helpers';

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
            delete: (uri: URI) => {
                const strURI = URI.toString(uri);
                
                // delete dir
                for (const existDir of createdDirs) {
                    if (existDir.startsWith(strURI)) {
                        createdDirs.delete(existDir);
                    }
                }

                // delete file
                for (const [file, content] of createdFiles) {
                    if (file.startsWith(strURI)) {
                        createdFiles.delete(file);
                    }
                }

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

    test('Should accurately create complex nested file and directory structure', async () => {
        const tree: TreeLike<FileTreeNode> = {
            value: {
                name: 'root',
                type: FileType.DIRECTORY,
            },
            children: [
                { value: { name: 'file1', type: FileType.FILE, data: 'Data for file1' } },
                { value: { name: 'file2', type: FileType.FILE, data: 'Data for file2' } },
                {
                    value: { name: 'folder1', type: FileType.DIRECTORY },
                    children: [
                        { value: { name: 'folder1_file1', type: FileType.FILE, data: 'Data for folder1_file1' } },
                        { value: { name: 'folder1_file2', type: FileType.FILE, data: 'Data for folder1_file2' } },
                        { value: { name: 'folder1_file3', type: FileType.FILE, data: 'Data for folder1_file3' } },
                    ],
                },
                { value: { name: 'file3', type: FileType.FILE, data: 'Data for file3' } },
                { value: { name: 'folder2', type: FileType.DIRECTORY } },
            ],
        };

        await buildFileTree(fileService, rootURI, {}, tree);
        const root = URI.join(rootURI, 'root');

        // Assert root directory and immediate children (files and folders)
        assertDir(URI.join(root));
        await assertFile(URI.join(root, 'file1'), 'Data for file1');
        await assertFile(URI.join(root, 'file2'), 'Data for file2');
        assertDir(URI.join(root, 'folder1'));
        await assertFile(URI.join(root, 'file3'), 'Data for file3');
        assertDir(URI.join(root, 'folder2'));

        // Assert contents of folder1
        assertDir(URI.join(root, 'folder1'));
        await assertFile(URI.join(root, 'folder1', 'folder1_file1'), 'Data for folder1_file1');
        await assertFile(URI.join(root, 'folder1', 'folder1_file2'), 'Data for folder1_file2');
        await assertFile(URI.join(root, 'folder1', 'folder1_file3'), 'Data for folder1_file3');

        // folder2 should be empty but exist
        assertDir(URI.join(rootURI, 'root', 'folder2'));
    });

    test('Should clean root before building tree if cleanRoot is true', async () => {
        
        // Pre-populate with some files and directories
        createdDirs.add(URI.toString(URI.join(rootURI, 'preExistingDir')));
        createdFiles.set(URI.toString(URI.join(rootURI, 'preExistingFile.txt')), 'Pre-existing content');

        const tree: TreeLike<FileTreeNode> = {
            value: {
                name: 'root',
                type: FileType.DIRECTORY,
            },
            children: [
                { value: { name: 'newFile.txt', type: FileType.FILE, data: 'New file content' } },
            ],
        };

        await buildFileTree(fileService, rootURI, { cleanRoot: true }, tree);

        // Assert pre-existing files and directories are removed
        assert.ok(!createdDirs.has(URI.toString(URI.join(rootURI, 'preExistingDir'))), 'Pre-existing directory should be removed');
        assert.ok(!createdFiles.has(URI.toString(URI.join(rootURI, 'preExistingFile.txt'))), 'Pre-existing file should be removed');

        // Assert new file is created
        await assertFile(URI.join(rootURI, 'root', 'newFile.txt'), 'New file content');
    });
});


suite('isEqualTreeLike-test', () => {
    const isNodeEqual = (node1: any, node2: any) => node1.value === node2.value;
    const hasChildren1 = (node: any) => node.children && node.children.length > 0;
    const getChildren1 = (node: any) => node.children || [];
    const hasChildren2 = (node: any) => node.children && node.children.length > 0;
    const getChildren2 = (node: any) => node.children || [];

    test('should return true for identical trees', () => {
        const tree1 = { value: 1, children: [{ value: 2, children: [] }, { value: 3, children: [] }] };
        const tree2 = { value: 1, children: [{ value: 2, children: [] }, { value: 3, children: [] }] };

        const result = isEqualTreeLike(tree1, tree2, isNodeEqual, hasChildren1, getChildren1, hasChildren2, getChildren2);
        assert.strictEqual(result, true);
    });

    test('should return false for trees with different root values', () => {
        const tree1 = { value: 1, children: [] };
        const tree2 = { value: 2, children: [] };

        const result = isEqualTreeLike(tree1, tree2, isNodeEqual, hasChildren1, getChildren1, hasChildren2, getChildren2);
        assert.strictEqual(result, false);
    });

    test('should return false for trees with different structures', () => {
        const tree1 = { value: 1, children: [{ value: 2, children: [] }] };
        const tree2 = { value: 1, children: [{ value: 2, children: [{ value: 3, children: [] }] }] };

        const result = isEqualTreeLike(tree1, tree2, isNodeEqual, hasChildren1, getChildren1, hasChildren2, getChildren2);
        assert.strictEqual(result, false);
    });

    test('should return false for trees with different number of children', () => {
        const tree1 = { value: 1, children: [{ value: 2, children: [] }] };
        const tree2 = { value: 1, children: [{ value: 2, children: [] }, { value: 3, children: [] }] };

        const result = isEqualTreeLike(tree1, tree2, isNodeEqual, hasChildren1, getChildren1, hasChildren2, getChildren2);
        assert.strictEqual(result, false);
    });

    test('should return true for deeply nested identical trees', () => {
        const tree1 = {
            value: 1,
            children: [
                {
                    value: 2, children: [
                        { value: 3, children: [] }
                    ]
                }
            ]
        };
        const tree2 = {
            value: 1,
            children: [
                {
                    value: 2, children: [
                        { value: 3, children: [] }
                    ]
                }
            ]
        };

        const result = isEqualTreeLike(tree1, tree2, isNodeEqual, hasChildren1, getChildren1, hasChildren2, getChildren2);
        assert.strictEqual(result, true);
    });
});





