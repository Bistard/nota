import { Random } from "src/base/common/util/random";
import { repeat } from "src/base/common/util/timer";
import { NestedArray } from "src/base/common/util/type";

let _hitCount = 0;
const _context = new Set<number>();

/**
 * @description Simple printing debug strategy.
 */
export function hit(): void {
    console.log(_hitCount++);
}

export function toggleContext(id: number): void {
    const exist = _context.has(id);
    if (exist) {
        _context.delete(id);
    } else {
        _context.add(id);
    }
}

export function print(id: number, message: any): void {
    if (_context.has(id)) {
        console.log(message);
    }
}

/**
 * @description Returns a useless but simple object except that whatever you do 
 * to it will not throw any errors.
 */
export function nullObject(): any {
    return new Proxy({}, {
        get: () => nullObject,
		set: () => true,
    });
}

/**
 * @description Executes a function and throws an error if the function does not 
 * throw an exception.
 * @param fn - The function to be tested for exception throwing.
 * @throws Will throw an error if the function does not throw an exception.
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
        throw new Error(`The function "${fn}" should throws an exception.`);
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

    const __aux = (parent: NestedArray<TLeaf>, depth: number): NestedArray<TLeaf> => {
        // the deeper the node, the less likely the children can have.
        const childrenCnt = 1 + Random.int(size / depth);

        repeat(childrenCnt, () => {
            // the deeper the node, the more likely the node is a leaf.
            if (Random.maybe(1 / depth)) {
                parent.push(__aux([], depth + 1));
            } else {
                parent.push(createLeaf());
            }
            nodeCount++;
        });

        return parent;
    };
    
    return [
        __aux([], 1),
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

            if (i + 1 != len) {
                __print(child, prefix + '├─', false);
            } else {
                __print(child, prefix + '└─', true);
            }
        }
    };

    __print(root, '', false);
}