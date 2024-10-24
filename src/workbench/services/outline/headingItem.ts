/**
 * An interface only for {@link HeadingItem}.
 */
export interface IHeadingItem<TItem extends IHeadingItem<TItem>> {

    /**
     * The unique representation of the target.
     * @note The number is essentially the line number of the heading in the
     *       original file.
     * @example `123`
     */
    readonly id: number;

    /**
     * The name of the target.
     * @example `This is a Heading name`
     */
    readonly name: string;

    /**
     * The heading level of the target. The largest heading has depth 1, the
     * smallest heading has depth 6.
     * @range [1, 6]
     */
    readonly depth: number;

    /**
     * The direct parent of the current item, if the current item is the root,
     * return `null`.
     */
    readonly parent: HeadingItem | null;

    /**
     * Returns the root of the entire tree.
     */
    readonly root: HeadingItem;
}

/**
 * @class Every item represents a heading in a Markdown file.
 */
export class HeadingItem implements IHeadingItem<HeadingItem> {

    public static readonly ROOT_ID = 'outline-root';

    // [field]
    private readonly _id: number;
    private readonly _name: string;
    private readonly _depth: number;

    private _parent: HeadingItem | null;
    private _children: HeadingItem[];

    // [constructor]
    constructor(id: number, name: string, depth: number) {
        this._id = id;
        this._name = name;
        this._depth = depth;
        this._parent = null;
        this._children = [];
    }

    get id(): number {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get depth(): number {
        return this._depth;
    }

    get children(): HeadingItem[] {
        return this._children;
    }

    get parent(): HeadingItem | null {
        return this._parent;
    }

    get root(): HeadingItem {
        if (this._parent === null) {
            return this;
        }
        return this._parent.root;
    }

    public addChild(child: HeadingItem): void {
        this._children.push(child);
        child._parent = this;
    }

    public addChildren(children: HeadingItem[]): void {
        this._children = this._children.concat(children);
        children.forEach(child => child._parent = this);
    }
}
