import { panic } from "src/base/common/utilities/panic";
import { Callable } from "src/base/common/utilities/type";

/**
 * @description Wraps the 'fn' to ensure it can only be executed once. 
 * @panic
 */
export function executeOnce<T extends Callable<any[], any>>(fn: T): T {
    let executed = false;
    return <any>(function (this: any, ...args: any[]) {
        if (executed) {
            panic(`The function '${fn.name}' can only be executed once.`);
        }
        executed = true;
        return fn.apply(this, args);
    });
}

/**
 * @class Manages conditional execution of callback functions. Execution through 
 * `execute()` is only allowed after a `reactivate()` call, ensuring a 
 * controlled, one-time execution for each activation cycle.
 * 
 * @note By default, it is deactivated.
 * 
 * @example
 * const reactivator = new Reactivator(() => console.log('Default action'));
 * reactivator.execute(); // No action, since `reactivate` hasn't been invoked.
 * reactivator.reactivate(); // Sets the reactivator for a single execution.
 * reactivator.execute(); // Executes the default action.
 * reactivator.execute(() => console.log('Custom action')); // No action, `reactivate` needed again.
 */
export class Reactivator {

    private _isActivated: boolean;
    private _defaultFn?: () => void;

    constructor(defaultCallback?: () => void) {
        this._isActivated = false;
        this._defaultFn = defaultCallback;
    }

    public reactivate(): void {
        this._isActivated = true;
    }

    public deactivate(): void {
        this._isActivated = false;
    }

    public execute(fn?: () => void): void {
        if (!this._isActivated) {
            return;
        }

        const executable = fn ?? this._defaultFn;
        executable?.();

        this._isActivated = false;
    }
}

/**
 * @description Function version of a ternary operator.
 */
export function cond<T>(condition: boolean, onTrue: T, onFalse: T): T {
    return condition ? onTrue : onFalse;
}

/**
 * @description Convert a value to '1' if truthy, '0' if falsy.
 */
export function to01(value: any): 1 | 0 {
    return value ? 1 : 0;
}

/**
 * @description Performs a depth-first search (DFS) on a tree.
 * @param node The starting node for the DFS.
 * @param visit A function to visit on each node.
 * @param getChildren A function that returns an array of child nodes for the 
 *                    given node.
 */
export function dfs<T>(node: T, visit: (node: T) => void, getChildren: (node: T) => T[]): void {
    visit(node);
    for (const child of getChildren(node)) {
        dfs(child, visit, getChildren);
    }
}

/**
 * @description An async version of {@link dfs}.
 */
export async function dfsAsync<T>(node: T, visit: (node: T) => Promise<void>, getChildren: (node: T) => Promise<T[]>): Promise<void> {
    await visit(node);
    for (const child of await getChildren(node)) {
        await dfsAsync(child, visit, getChildren);
    }
}

/**
 * @description Performs a breadth-first search (BFS) on a tree.
 * @param node The starting node for the BFS.
 * @param visit A function to visit on each node.
 * @param getChildren A function that returns an array of child nodes for the 
 *                    given node.
 */
export function bfs<T>(node: T, visit: (node: T) => void, getChildren: (node: T) => T[]): void {
    const queue = [node];

    while (queue.length > 0) {
        const currentNode = queue.shift()!;
        visit(currentNode);

        const children = getChildren(currentNode);
        for (const child of children) {
            queue.push(child);
        }
    }
}

/**
 * @description An async version of {@link bfs}.
 */
export async function bfsAsync<T>(node: T, visit: (node: T) => Promise<void>, getChildren: (node: T) => Promise<T[]>): Promise<void> {
    const queue = [node];

    while (queue.length > 0) {
        const currentNode = queue.shift()!;
        await visit(currentNode);

        const children = await getChildren(currentNode);
        for (const child of children) {
            queue.push(child);
        }
    }
}
