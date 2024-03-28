import * as assert from 'assert';
import { after, before, beforeEach } from 'mocha';
import { FileType } from 'src/base/common/files/file';
import { Schemas, URI } from 'src/base/common/files/uri';
import { IS_MAC, OS_CASE_SENSITIVE } from 'src/base/common/platform';
import { FileService, IFileService } from 'src/platform/files/common/fileService';
import { DiskFileSystemProvider } from 'src/platform/files/node/diskFileSystemProvider';
import { FileItem } from 'src/workbench/services/fileTree/fileItem';
import { SAMPLE_TREE_LIKE, SAMPLE_TREE_LIKE3, buildFileItem, buildFileTree, findFileItemByPath } from 'test/utils/helpers';
import { NullLogger, TestURI } from 'test/utils/testService';

suite('FileItem-test', () => {
    let fileService!: IFileService;

    const rootURI = URI.join(TestURI, 'fileItem');
    let root!: FileItem;

    before(async () => {
        fileService = new FileService(new NullLogger());
        fileService.registerProvider(Schemas.FILE, new DiskFileSystemProvider());
        await fileService.createDir(rootURI).unwrap();
    });

    after(async () => {
        await fileService.delete(rootURI, { recursive: true }).unwrap();
    });

    // refreah the tree hierarchy every test
    beforeEach(async () => {
        await buildFileTree(fileService, rootURI, { cleanRoot: true, overwrite: true }, SAMPLE_TREE_LIKE3);
        root = await buildFileItem(fileService, rootURI);
    });

    suite('property-test', () => {
        
        test('property check: uri / id / parent', async () => {
            const expectRootURI = URI.join(rootURI, 'root');
            assert.strictEqual(root.parent, null);
            assert.ok(URI.equals(root.uri, expectRootURI));
            assert.strictEqual(root.id, URI.toString(expectRootURI));

            const fFirstChild = findFileItemByPath(root, [0]);
            assert.strictEqual(fFirstChild?.parent, root);
        });

        test('property check: name / basename / extname / type', async () => {
            assert.strictEqual(root.name, 'root');
            assert.strictEqual(root.basename, 'root');
            assert.strictEqual(root.extname, '');
            assert.strictEqual(root.type, FileType.DIRECTORY);

            const file1 = findFileItemByPath(root, [0]);
            assert.ok(file1);

            assert.strictEqual(file1.name, 'FILE1.js');
            assert.strictEqual(file1.basename, 'FILE1');
            assert.strictEqual(file1.extname, '.js');
            assert.strictEqual(file1.type, FileType.FILE);
        });
        
        test('property check: children', async () => {
            assert.strictEqual(root.children.length, 5);

            // first child ref check
            const firstChild = root.children[0]!;
            const actualFirstChild = findFileItemByPath(root, [0]);
            assert.strictEqual(firstChild, actualFirstChild);
        });

        test('property check: mapChildren (lazy loading)', async function () {
            // make sure it is lazy loading
            assert.strictEqual(root['_mapChildrenCache'], undefined);
            assert.strictEqual(root.mapChildren.size, 5);
            assert.notStrictEqual(root['_mapChildrenCache'], undefined);
        });
        
        test('property check: mapChildren (CaseIgnore)', async function () {
            if (OS_CASE_SENSITIVE) {
                this.skip();
            }
            assert.strictEqual(root.mapChildren.size, 5);
            
            if (IS_MAC) {
                /**
                 * macOS still keep the cases when reading from the disk, so
                 * they are ordered by default like they are case sensitive. But
                 * still doesn't distinguish between 'file1.js' and 'FILE1.js'.
                 */
                assert.ok(root.mapChildren.get('file1.js') === findFileItemByPath(root, [0]));
                assert.ok(root.mapChildren.get('file3.txt') === findFileItemByPath(root, [1]));
                assert.ok(root.mapChildren.get('file2.js') === findFileItemByPath(root, [2]));
                assert.ok(root.mapChildren.get('folder1') === findFileItemByPath(root, [3]));
                assert.ok(root.mapChildren.get('folder2') === findFileItemByPath(root, [4]));
            }
            else {
                // Windows doesn't give a shit about order, ordered by default.
                assert.ok(root.mapChildren.get('file1.js') === findFileItemByPath(root, [0]));
                assert.ok(root.mapChildren.get('file2.js') === findFileItemByPath(root, [1]));
                assert.ok(root.mapChildren.get('file3.txt') === findFileItemByPath(root, [2]));
                assert.ok(root.mapChildren.get('folder1') === findFileItemByPath(root, [3]));
                assert.ok(root.mapChildren.get('folder2') === findFileItemByPath(root, [4]));
            }
        });
        
        test('property check: mapChildren (CaseSensitive)', async function () {
            if (!OS_CASE_SENSITIVE) {
                this.skip();
            }
            assert.strictEqual(root.mapChildren.size, 5);
            /**
             * Since the order does matter, file name are case-sensitive, they 
             * are ordered differently.
             */
            assert.ok(root.mapChildren.get('FILE1.js') === findFileItemByPath(root, [0]));
            assert.ok(root.mapChildren.get('File3.txt') === findFileItemByPath(root, [1]));
            assert.ok(root.mapChildren.get('file2.JS') === findFileItemByPath(root, [2]));
            assert.ok(root.mapChildren.get('folder1') === findFileItemByPath(root, [3]));
            assert.ok(root.mapChildren.get('folder2') === findFileItemByPath(root, [4]));
        });
    });

    suite('method-test', () => {
        test('root() / isDirectory() / isFile() / hasChildren()', async () => {
            assert.strictEqual(root.root(), root);
            assert.ok(root.isRoot());
            
            assert.ok(root.isDirectory());

            const file1 = findFileItemByPath(root, [0])!;
            assert.ok(file1.isFile());
            assert.ok(!file1.isRoot());
            assert.ok(root === file1.root());

            assert.ok(root.hasChildren());
            assert.ok(!file1.hasChildren());
        });

        test('FileItem.resolve()', async () => {
            // noop: already tested in `buildFileItem` helper utility
        });
        
        test('forgetChildren() / isChildrenResolved()', async () => {
            assert.ok(root.isChildrenResolved());
            root.forgetChildren();
            assert.strictEqual(root.children.length, 0);
            assert.strictEqual(root.mapChildren.size, 0);
            assert.ok(!root.isChildrenResolved());
        });

        test('refreshChildren()', async () => {
            await buildFileTree(fileService, rootURI, { cleanRoot: true, overwrite: true }, SAMPLE_TREE_LIKE);

            root.forgetChildren();
            await root.refreshChildren(fileService, { onError: error => { throw error; } }).unwrap();
            
            assert.strictEqual(root.mapChildren.get('file1')?.name, 'file1');
            assert.strictEqual(root.mapChildren.get('file2')?.name, 'file2');
            assert.strictEqual(root.mapChildren.get('file3')?.name, 'file3');
            assert.strictEqual(root.mapChildren.get('folder1')?.name, 'folder1');
            assert.strictEqual(root.mapChildren.get('folder2')?.name, 'folder2');
        });
        
        test('refreshChildren() will not refresh if the chilren is not forget', async () => {
            await buildFileTree(fileService, rootURI, { cleanRoot: true, overwrite: true }, SAMPLE_TREE_LIKE);

            await root.refreshChildren(fileService, { onError: error => { throw error; } }).unwrap();
            
            assert.strictEqual(root.mapChildren.get('file1'), undefined);
            assert.strictEqual(root.mapChildren.get('file2'), undefined);
            assert.strictEqual(root.mapChildren.get('file3'), undefined);
        });
        
        const baseURI = URI.join(rootURI, 'root');

        test('findDescendant() (IgnoreCase)', async function() {
            if (OS_CASE_SENSITIVE) {
                this.skip();
            }
            assert.ok(root.findDescendant(URI.join(baseURI, 'FILE1.js')));
            assert.ok(root.findDescendant(URI.join(baseURI, 'file1.js')));
            
            assert.ok(root.findDescendant(URI.join(baseURI, 'file2.JS')));
            assert.ok(root.findDescendant(URI.join(baseURI, 'file2.js')));
            
            assert.ok(root.findDescendant(URI.join(baseURI, 'file3.txt')));
            assert.ok(root.findDescendant(URI.join(baseURI, 'File3.txt')));
            assert.ok(root.findDescendant(URI.join(baseURI, 'FILE3.TXT')));
            
            assert.ok(root.findDescendant(URI.join(baseURI, 'folder1')));
            assert.ok(root.findDescendant(URI.join(baseURI, 'FOLDER1')));
            assert.ok(root.findDescendant(URI.join(baseURI, 'folder2')));
            assert.ok(root.findDescendant(URI.join(baseURI, 'FOLDER2')));
            
            // descendant
            assert.ok(root.findDescendant(URI.join(baseURI, 'folder1', 'folder1_file1.ts')));
            assert.ok(root.findDescendant(URI.join(baseURI, 'folder1', 'folder1_file2.TS')));
            assert.ok(root.findDescendant(URI.join(baseURI, 'folder1', 'FOLDER1_file3.TXT')));
            
            assert.ok(root.findDescendant(URI.join(baseURI, 'FOLDER1', 'folder1_file1.ts')));
            assert.ok(root.findDescendant(URI.join(baseURI, 'FOLDER1', 'folder1_file2.ts')));
            assert.ok(root.findDescendant(URI.join(baseURI, 'FOLDER1', 'folder1_file3.txt')));
        });
        
        test('findDescendant() (CaseSensitive)', async function() {
            if (!OS_CASE_SENSITIVE) {
                this.skip();
            }
            assert.ok(root.findDescendant(URI.join(baseURI, 'FILE1.js')), 'FILE1.js fails');
            assert.ok(!root.findDescendant(URI.join(baseURI, 'file1.js')), 'file1.js fails');
            
            assert.ok(root.findDescendant(URI.join(baseURI, 'file2.JS')), 'file2.JS fails');
            assert.ok(!root.findDescendant(URI.join(baseURI, 'file2.js')), 'file2.js fails');
            
            assert.ok(root.findDescendant(URI.join(baseURI, 'File3.txt')), 'File3.txt fails');
            assert.ok(!root.findDescendant(URI.join(baseURI, 'file3.txt')), 'file3.txt fails');
            assert.ok(!root.findDescendant(URI.join(baseURI, 'FILE3.TXT')), 'FILE3.TXT fails');
            
            assert.ok(root.findDescendant(URI.join(baseURI, 'folder1')),  'folder1 fails');
            assert.ok(!root.findDescendant(URI.join(baseURI, 'FOLDER1')),  'FOLDER1 fails');
            assert.ok(root.findDescendant(URI.join(baseURI, 'folder2')),  'folder2 fails');
            assert.ok(!root.findDescendant(URI.join(baseURI, 'FOLDER2')),  'FOLDER2 fails');
            
            // descendant
            assert.ok(root.findDescendant(URI.join(baseURI, 'folder1', 'folder1_file1.ts')), 'folder1_file1.ts fails');
            assert.ok(root.findDescendant(URI.join(baseURI, 'folder1', 'folder1_file2.TS')), 'folder1_file2.TS fails');
            assert.ok(root.findDescendant(URI.join(baseURI, 'folder1', 'FOLDER1_file3.TXT')), 'FOLDER1_file3.TXT fails');
            
            assert.ok(!root.findDescendant(URI.join(baseURI, 'FOLDER1', 'folder1_file1.ts')), 'folder1_file1.ts fails');
            assert.ok(!root.findDescendant(URI.join(baseURI, 'FOLDER1', 'folder1_file2.ts')), 'folder1_file2.ts fails');
            assert.ok(!root.findDescendant(URI.join(baseURI, 'FOLDER1', 'folder1_file3.txt')), 'folder1_file3.txt fails');
        });
    });
});