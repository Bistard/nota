import { IAsyncChildrenProvider } from "src/base/browser/secondary/tree/asyncMultiTree";
import { FileType, IResolvedFileStat } from "src/base/common/file/file";
import { URI } from "src/base/common/file/uri";
import { IFilterOpts, isFiltered } from "src/base/common/fuzzy";
import { ILogService } from "src/base/common/logger";
import { CompareFn, isPromise, Mutable } from "src/base/common/util/type";
import { IFileService } from "src/code/platform/files/common/fileService";

/**
 * An interface only for {@link ClassicItem}.
 */
export interface IClassicItem {

    /** The {@link URI} of the target. */
    readonly uri: URI;

    /** The name of the target. */
    readonly name: string;

    /** The type of the target. */
    readonly type: FileType;

    /** The creation date in milliseconds. */
    readonly createTime: number;

    /** The last modified date in milliseconds.*/
    readonly modifyTime: number;

    /** The parent of the target. Null if current target is the root. */
    readonly parent: ClassicItem | null;

    /** The direct children of the target. */
    readonly children: ClassicItem[];

    /**
     * @description Returns the root of the current target
     * time complexity: O(h) - h: height of the tree.
     */
    root(): ClassicItem;

    /**
     * @description Is the current item a {@link FileType.DIRECTORY}.
	 * time complexity: O(1)
     */
    isDirectory(): boolean;

    /**
     * @description Is the current item a {@link FileType.FILE}.
	 * time complexity: O(1)
     */
    isFile(): boolean;

    /**
     * @description Is the current item has ever update its children before.
	 * time complexity: O(1)
     */
    isChildrenResolved(): boolean;

    /**
     * @description If the current item is capable having children. Note that
     * it does not prove the item must has at least one child.
	 * time complexity: O(1)
     */
    hasChildren(): boolean;

	/**
	 * @description Refreshing (fetching) the basic children stat of the current 
     * item.
	 * @param fileService The given {@link IFileService} for fetching the 
     * children of the current item.
     * @param filters Providing filter options during the resolution process can 
     * prevent unnecessary performance loss compares to we filter the result 
     * after the process.
     * @param cmpFn A compare function to sort the children.
	 */
	refreshChildren(fileService: IFileService, filters?: IFilterOpts, cmpFn?: CompareFn<ClassicItem>): void | Promise<void>;

	/**
	 * @description Forgets all the children of the current item.
	 */
	forgetChildren(): void;
}

/**
 * @class A data structure to be stored as each tree node in a 
 * {@link ClassicTreeService}. The item will build the tree structure 
 * recursively once constructed by the provided stat.
 * 
 * If stat is out of updated, invoking refreshChildren will automatically 
 * rebuild the whole tree structure.
 */
export class ClassicItem implements IClassicItem {

    // [field]

    /** stores all the info about the target. */
    private _stat: IResolvedFileStat;
    // An array to store the children and will be updated during the refresh.
    private _children: ClassicItem[] = [];
    // the parent of the current item.
    private _parent: ClassicItem | null = null;

    // [constructor]

    constructor(
        stat: IResolvedFileStat,
        parent: ClassicItem | null,
        filters?: IFilterOpts,
        cmpFn: CompareFn<ClassicItem> = defaultCompareFn
    ) {
        this._stat = stat;
        this._parent = parent;
        for (const stat of (this._stat.children ?? [])) {
            if (filters && isFiltered(stat.name, filters)) {
                continue;
            }
            this._children.push(new ClassicItem(stat, this));
        }
        if (cmpFn) {
            this._children.sort(cmpFn);
        }
    }

    // [get method]

    get uri(): URI { return this._stat.uri; }

    get name(): string { return this._stat.name; }

    get type(): FileType { return this._stat.type; }

    get createTime(): number { return this._stat.createTime; }

    get modifyTime(): number { return this._stat.modifyTime; }

    get parent(): ClassicItem | null { return this._parent; }

    get children(): ClassicItem[] { return this._children; }

    // [public method]

    public root(): ClassicItem {
        if (!this._parent) {
            return this;
        }
        return this._parent.root();
    }

    public isDirectory(): boolean {
        return this._stat.type === FileType.DIRECTORY;
    }

    public isFile(): boolean {
        return this._stat.type === FileType.FILE;
    }

    public isChildrenResolved(): boolean {
        return !!this._stat.children;
    }

    public hasChildren(): boolean {
        return this.isDirectory();
    }

	public refreshChildren(fileService: IFileService, filters?: IFilterOpts, cmpFn?: CompareFn<ClassicItem>): void | Promise<void> {
        const promise = (async () => {
            try {
                const updatedStat = await fileService.stat(
                    this._stat.uri, { 
                        resolveChildren: true,
                    },
                );
                this._stat = updatedStat;
                
                // update the children stat recursively
                this._children = [];
                for (const childStat of (updatedStat.children ?? [])) {
                    this._children.push(new ClassicItem(childStat, this, filters));
                }
                if (cmpFn) {
                    this._children.sort(cmpFn);
                }
            } 
            catch (err) {
                throw err;
            }
        })();

        return promise;
	}

	public forgetChildren(): void {
        (<Mutable<Iterable<IResolvedFileStat> | undefined>>this._stat.children) = undefined;
	}
}

/**
 * @class A {@link IAsyncChildrenProvider} used in a {@link ClassicTreeService}
 * and to provide children for {@link ClassicItem}.
 */
export class ClassicChildrenProvider implements IAsyncChildrenProvider<ClassicItem> {

	constructor(
        private readonly logService: ILogService,
		private readonly fileService: IFileService,
        private readonly filterOpts?: IFilterOpts,
        private readonly cmpFn: CompareFn<ClassicItem> = defaultCompareFn,
	) {}

    public hasChildren(data: ClassicItem): boolean {
        return data.hasChildren();
    }

    /**
     * @description Returns the children of the given item. If the children of
     * the item is not resolved, wait until they are resolved.
     * @param data The provided {@link ClassicItem}.
     */
    public getChildren(data: ClassicItem): ClassicItem[] | Promise<ClassicItem[]> {
        
        // refresh the children recursively
        const refreshPromise = data.refreshChildren(this.fileService, this.filterOpts, this.cmpFn);

        // the provided item's children are already resolved, we simply return it.
        if (!isPromise(refreshPromise)) {
            return data.children;
        } 
        
        // the provided item's children never resolved, we wait until it resolved.
        const promise = refreshPromise
        .then(() => { 
            return data.children;
        })
        .catch((error: any) => {
            this.logService.error(error);
            return [];
        });

        return promise;
    }

    // public collapseByDefault(data: ClassicItem): boolean {
    //     // TODO
    //     return false;
    // }
}

/**
 * @description Directory goes first, otherwise sorts in ascending, ASCII 
 * character order.
 */
export function defaultCompareFn(a: ClassicItem, b: ClassicItem): number {
    if (a.type === b.type) {
        return (a.name < b.name) ? -1 : 1;
    } else if (a.isDirectory()) {
        return -1;
    } else {
        return 1;
    }
}