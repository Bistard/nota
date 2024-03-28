import { Callable, StringDictionary, isEmptyObject } from "src/base/common/utilities/type";

function forEach<T>(
    target: StringDictionary<T>, 
    callback: Callable<[{ key: string, value: T }, Callable], any>): void 
{
    for (const key in target) {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
            const result = callback(
                { key: key, value: <T>target[key] }, function() {
                    delete target[key];
                }
            );
            if (result === false) {
                return;
            }
        }
    }
}

class Node<T> {
    constructor(
        public data: T, 
        public from: { [key: string]: Node<T> } = Object.create(null), 
        public to: { [key: string]: Node<T> } = Object.create(null),
        ) {
        // empty
    }
}

export class Graph<T> {

    // [fields]

    private _nodes: { [key: string]: Node<T> } = Object.create(null);
    private _getName: (data: T) => string;
    
    // [constructor]

    constructor(_fn: (data: T) => string) {
        this._getName = _fn;
    }

    // [public methods]

    public isEmpty(): boolean {
        for (const _key in this._nodes) {
            return false;
        }
        return true;
    }

    public roots(): Node<T>[] {
        const res: Node<T>[] = [];
        forEach(this._nodes, (node: {key: string, value: Node<T>} ) => {
            if (isEmptyObject(node.value.to)) {
                res.push(node.value);
            }
        });
        return res;
    }

    public getNode(data: T): Node<T> | undefined {
        return this._nodes[this._getName(data)];
    }

    public getOrInsertNode(data: T): Node<T> {
        const key = this._getName(data);
        let val = this._nodes[key];
        if (val === undefined) {
            val = new Node<T>(data);
            this._nodes[key] = val;
        }
        return val;
    }

    public removeNode(data: T): void {
        const key = this._getName(data);
        delete this._nodes[key];
        forEach(this._nodes, (node: {key: string, value: Node<T>} ) => {
            delete node.value.to[key];
            delete node.value.from[key];
        });
    }

    public insertEdge(from: T, to: T): void {
        const fromNode: Node<T> = this.getOrInsertNode(from);
        const toNode: Node<T> = this.getOrInsertNode(to);
        
        fromNode.to[this._getName(to)] = toNode;
        toNode.from[this._getName(from)] = fromNode;
    }

    // debugging purpose
    public toString(): string {
		const data: string[] = [];
		forEach(this._nodes, entry => {
			data.push(`${entry.key}, (from)[${Object.keys(entry.value.from).join(', ')}], (to)[${Object.keys(entry.value.to).join(',')}]`);
		});
		return data.join('\n');
	}
}