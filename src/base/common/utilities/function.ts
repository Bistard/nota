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
 * Represents a flag with an identifiable state that can only be toggled once.
 */
export class Flag {
    
    // [field]
    
    private readonly _name: string;
    private _triggered: boolean;

    // [constructor]

    constructor(name: string) {
        this._name = name;
        this._triggered = false;
    }

    // [public methods]

    public triggered(): boolean {
        return this._triggered;
    }

    /**
     * @description Sets the flag's state to true.
     */
    public turnOn(): void {
        this.assert(true);
        this._triggered = true;
    }

    /**
     * @description Ensures the flag's current state matches the expected state. 
     * Panic if not.
     * @param state The expected state of the flag.
     * @param errorToMessage Optional. Custom error message.
     */
    public assert(state: boolean, errorToMessage?: string): void {
        if (this._triggered === state) {
            panic(`Flag (${this._name}) ` + errorToMessage ?? 'is already turned on.');
        }
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
 * @param visit A function to visit on each node. When a boolean is returned, it
 *              indicates if the dfs should continue to visit.
 * @param getChildren A function that returns an array of child nodes for the 
 *                    given node.
 */
export function dfs<T>(node: T, visit: (node: T) => void | boolean, getChildren: (node: T) => T[]): void {
    const cont = visit(node);
    if (cont === false) {
        return;
    }

    for (const child of getChildren(node)) {
        dfs(child, visit, getChildren);
    }
}

/**
 * @description An async version of {@link dfs}.
 */
export async function dfsAsync<T>(node: T, visit: (node: T) => Promise<void | boolean>, getChildren: (node: T) => Promise<T[]>): Promise<void> {
    const cont = await visit(node);
    if (cont === false) {
        return;
    }

    for (const child of await getChildren(node)) {
        await dfsAsync(child, visit, getChildren);
    }
}

/**
 * @description Performs a breadth-first search (BFS) on a tree.
 * @param node The starting node for the BFS.
 * @param visit A function to visit on each node. When a boolean is returned, it
 *              indicates if the bfs should continue to visit.
 * @param getChildren A function that returns an array of child nodes for the 
 *                    given node.
 */
export function bfs<T>(node: T, visit: (node: T) => void | boolean, getChildren: (node: T) => T[]): void {
    const queue = [node];

    while (queue.length > 0) {
        const currentNode = queue.shift()!;
        const cont = visit(currentNode);
        if (cont === false) {
            return;
        }

        const children = getChildren(currentNode);
        for (const child of children) {
            queue.push(child);
        }
    }
}

/**
 * @description An async version of {@link bfs}.
 */
export async function bfsAsync<T>(node: T, visit: (node: T) => Promise<void | boolean>, getChildren: (node: T) => Promise<T[]>): Promise<void> {
    const queue = [node];

    while (queue.length > 0) {
        const currentNode = queue.shift()!;
        const cont = await visit(currentNode);
        if (cont === false) {
            return;
        }

        const children = await getChildren(currentNode);
        for (const child of children) {
            queue.push(child);
        }
    }
}
