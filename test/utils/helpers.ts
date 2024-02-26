import * as assert from 'assert';
import { DataBuffer } from 'src/base/common/files/buffer';
import { FileType, IResolvedFileStat } from 'src/base/common/files/file';
import { URI } from 'src/base/common/files/uri';
import { AsyncResult } from "src/base/common/result";
import { panic } from "src/base/common/utilities/panic";
import { repeat } from "src/base/common/utilities/async";
import { Random } from "src/base/common/utilities/random";
import { NestedArray, TreeLike } from "src/base/common/utilities/type";
import { IFileService } from 'src/platform/files/common/fileService';
import { FileItem, IFileItemResolveOptions } from 'src/workbench/services/fileTree/fileItem';

let _hitCount = 0;

/**
 * @description Simple printing debug strategy.
 */
export function hit(): number {
    console.log(_hitCount++);
    return _hitCount;
}

export function resetHit(): void {
    _hitCount = 0;
}

export namespace Context {

    const _context = new Set<number>();

    export function toggleContext(id: number): void {
        const exist = _context.has(id);
        if (exist) {
            _context.delete(id);
        } else {
            _context.add(id);
        }
    }

    export function ifExist(id: number): boolean {
        return _context.has(id);
    }
    
    export function print(id: number, message: any): void {
        if (_context.has(id)) {
            console.log(message);
        }
    }
}

/**
 * @deprecated This function acts exactly like `.unwrap()` method.
 */
export async function assertAsyncResult<T, E>(result: AsyncResult<T, E>): Promise<T> {
    const res = await result;
    if (res.isErr()) {
        // eslint-disable-next-line local/code-no-throw
        throw res.error;
    }
    return res.data;
}

/**
 * @description Returns a useless but simple object except that whatever you do 
 * to it will not throw any errors.
 */
export function nullObject<T = any>(): T {
    return <T>new Proxy({}, {
        get: () => nullObject,
		set: () => true,
    });
}

/**
 * @description Executes a function and throws an error if the function does not 
 * throw an exception.
 * @param fn - The function to be tested for exception throwing.
 * @throws Will throw an error if the function does not throw an exception.
 * 
 * @deprecated Use {@link assert.throws} instead.
 */
export function shouldThrow(fn: () => void): void {
    let noThrow = false;
    
    try {
        fn();
        noThrow = true;
    } catch (err) {
        // noop
    }

    if (noThrow) {
        panic(`The function "${fn}" should throws an exception.`);
    }
}

/**
 * @description Iterate the given node using DFS.
 * @param node The root node.
 * @param childProp The children property name in string.
 * @param visitor A visitor function applies to each children node.
 */
export function dfs<T>(node: T, childProp: string, visitor: (node: T) => void): void {
    visitor(node);
    for (const child of node[childProp]) {
        visitor(child);
    }
}

/**
 * @description Iterate the given node using BFS.
 * @param node The root node.
 * @param childProp The children property name in string.
 * @param visitor A visitor function applies to each children node.
 */
export function bfs<T>(node: T, childProp: string, visitor: (node: T) => void): void {
    const queue: T[] = [node];

    while (queue.length) {
        const node = queue.shift()!;
        visitor(node);
        for (const child of node[childProp]) {
            queue.push(child);
        }
    }
}

/**
 * @description Able to generate a random tree like structure with each tree 
 * leaf has a type TLeaf. A node represented by an array of TLeaf.
 * @param createLeaf A function to generate a leaf.
 * @param size A coefficient determines the size of the tree. Defaults to 50 and
 *             the corresponding tree size is arround 25k. 100 could results to
 *             around 1500k.
 * @returns The generated random tree and the actual size of the tree (node count).
 * 
 * @note The actual size of the tree may vary a lot.
 */
export function generateTreeLike<TLeaf>(
    createLeaf: () => TLeaf, 
    size: number = 50,
): [NestedArray<TLeaf>, number] {
    let nodeCount = 0;

    const dfs = (parent: NestedArray<TLeaf>, depth: number): NestedArray<TLeaf> => {
        // the deeper the node, the less likely the children can have.
        const childrenCnt = 1 + Random.int(size / depth);

        repeat(childrenCnt, () => {
            // the deeper the node, the more likely the node is a leaf.
            if (Random.maybe(1 / depth)) {
                parent.push(dfs([], depth + 1));
            } else {
                parent.push(createLeaf());
            }
            nodeCount++;
        });

        return parent;
    };
    
    return [
        dfs([], 1),
        nodeCount,
    ];
}

/**
 * @description Prints the given n-ary tree.
 * @param root The given root of the n-ary tree.
 * @param getContent A function gets the content of the current node for printing.
 * @param hasChildren A function determines if the the current node has children.
 * @param getChildren A function returns the children of the current node.
 * 
 * @example
 * ```
 * root
 * ├─base
 * |  ├─browser
 * |  |  └─secondary
 * |  |     └─tree
 * |  └─common
 * |     ├─file
 * |     └─util
 * ├─code
 * |  ├─browser
 * |  |  └─service
 * |  ├─platform
 * |  └─service
 * |     └─temp
 * ├─editor
 * |  └─model
 * |     ├─markdown
 * |     └─pieceTable
 * └─util
 * ```
 */
export function printNaryTreeLike<TNode>(
    root: TNode,
    getContent: (node: TNode) => string,
    hasChildren: (node: TNode) => boolean,
    getChildren: (node: TNode) => TNode[],
): void {
    
    // in-order
    const __print = (node: TNode, prefix: string, isParentTheLast: boolean): void => {
        console.log(prefix + getContent(node));
        
        if (!hasChildren(node)) {
            return;
        }

        if (prefix) {
            prefix = prefix.substring(0, prefix.length - 2);
            if (!isParentTheLast) {
                prefix += '|  ';
            } else {
                prefix += '   ';
            }
        }

        const children = getChildren(node);
        const len = children.length;
        
        for (let i = 0; i < len; i++) {
            const child = children[i]!;

            if (i + 1 !== len) {
                __print(child, prefix + '├─', false);
            } else {
                __print(child, prefix + '└─', true);
            }
        }
    };

    __print(root, '', false);
}

/**
 * @description Prints the resolved stat structure starting from the given 
 * 'stat'. This is a specialized usage of {@link printNaryTreeLike} function 
 * tailored for printing {@link IResolvedFileStat}.
 * @param root The root of the file stat to be printed.
 */
export function printFileStat(stat: IResolvedFileStat): void {
    printNaryTreeLike(
        stat,
        stat => stat.name,
        stat => [...(stat.children ?? [])].length > 0,
        stat => [...(stat.children ?? [])],
    );
}

export interface IBuildFileTreeOptions {
    /**
     * If clean all the existing files/folders before build.
     */
    readonly cleanRoot?: boolean;

    /**
     * When creating file, if allow to overwrite the existing file.
     */
    readonly overwrite?: boolean;
}

export type FileTreeNode = {
    readonly name: string;
    readonly type: FileType;
    readonly data?: string | DataBuffer;
};

/**
 * Do not modify this sample since there are unit tests are based on this.
 *  - basic files without extension name
 *  - basic folders
 */
export const SAMPLE_TREE_LIKE: TreeLike<FileTreeNode> = {
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

/**
 * Do not modify this sample since there are unit tests are based on this.
 *  - basic files with extension name
 *  - basic folders
 */
export const SAMPLE_TREE_LIKE2: TreeLike<FileTreeNode> = {
    value: {
        name: 'root',
        type: FileType.DIRECTORY,
    },
    children: [
        { value: { name: 'file1.js', type: FileType.FILE, data: 'Data for file1.js' } },
        { value: { name: 'file2.js', type: FileType.FILE, data: 'Data for file2.js' } },
        { value: { name: 'file3.txt', type: FileType.FILE, data: 'Data for file3.txt' } },
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

/**
 * Do not modify this sample since there are unit tests are based on this.
 *  - basic files with extension
 *  - basic folders
 *  - case sensitive
 */
export const SAMPLE_TREE_LIKE3: TreeLike<FileTreeNode> = {
    value: {
        name: 'root',
        type: FileType.DIRECTORY,
    },
    children: [
        { value: { name: 'FILE1.js', type: FileType.FILE, data: 'Data for FILE1.js' } },
        { value: { name: 'file2.JS', type: FileType.FILE, data: 'Data for file2.JS' } },
        { value: { name: 'File3.txt', type: FileType.FILE, data: 'Data for File3.txt' } },
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

/**
 * @description Asynchronously builds a file tree starting from a given root URI 
 * using the provided file service. Each node in the tree represents either a 
 * file or a directory.
 * @param fileService The file service.
 * @param rootURI The base URI representing the root directory where the tree 
 *                will be built.
 * @param opts Options for the file tree building process.
 * @param tree The tree structure representing the file system to build.
 */
export async function buildFileTree<T extends FileTreeNode>(fileService: IFileService, rootURI: URI, opts: IBuildFileTreeOptions, tree: TreeLike<T>): Promise<void> {
    
    // clean the entire root if needed
    if (opts.cleanRoot) {
        await fileService.delete(rootURI, { recursive: true }).unwrap();
    }

    // Helper function to create a file or directory based on the node type
    async function createNode(baseURI: URI, node: T): Promise<void> {
        const target = URI.join(baseURI, node.name);
        
        // dir
        if (node.type === FileType.DIRECTORY) {
            await fileService.createDir(target).unwrap();
            return;
        }

        // file
        const data = node.data;
        const buffer = typeof data === 'string' ? DataBuffer.fromString(data) : data;
        await fileService.createFile(target, buffer, { overwrite: opts.overwrite }).unwrap();
    }

    // dfs
    async function dfs(baseURI: URI, treeNode: TreeLike<T>): Promise<void> {
        await createNode(baseURI, treeNode.value);
        baseURI = URI.join(baseURI, treeNode.value.name);

        if (!treeNode.children || !treeNode.children.length || treeNode.value.type !== FileType.DIRECTORY) {
            return;
        }

        for (const child of treeNode.children) {
            await dfs(baseURI, child);
        }
    }

    // Start building the tree from the root
    await dfs(rootURI, tree);
}

/**
 * @description A helper function to build a {@link FileItem} hierarchy 
 * based on the provided URI in the file system hierarchy.
 * @note Make sure the file system hierarchy is already built.
 */
export async function buildFileItem(fileService: IFileService, uri: URI, opts?: IFileItemResolveOptions<FileItem>): Promise<FileItem> {
    
    // stat
    const resolvedStat = await fileService.stat(URI.join(uri, 'root'), {
        resolveChildren: true,
        resolveChildrenRecursive: true,
    }).unwrap();

    // resolve FileItem
    const root = await FileItem.resolve(resolvedStat, null, opts ?? {
        onError: error => console.log(error),
    });

    // for test purpose if needed
    // printFileItem(root);

    return root;
}

/**
 * @description Prints the file structure starting from the given 'root' 
 * FileItem. This is a specialized usage of {@link printNaryTreeLike} function 
 * tailored for printing file items.
 * @param root The root of the file structure to be printed.
 */
export function printFileItem(root: FileItem): void {
    printNaryTreeLike(
        root,
        node => node.name,
        node => node.children.length > 0,
        node => node.children,
    );
}

/**
 * @description Finds a nested FileItem within a hierarchical structure based on 
 * a given path of indices.
 * 
 * This function traverses the hierarchy of FileItem objects, navigating down 
 * through children at each level according to the provided `path`. If any level 
 * does not exist, the function returns `undefined`.
 * 
 * @param item The root item from which to start the search.
 * @param path An array of indices representing the path to the desired FileItem.
 * @returns The FileItem at the specified path, or `undefined` if not found.
 */
export function findFileItemByPath(item: FileItem, location: number[]): FileItem | undefined {

    for (const index of location) {
        const child = item.children[index];
        if (!child) {
            return undefined;
        }
        item = child;
    }

    return item;
}