import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { IAsyncChildrenProvider } from "src/base/browser/secondary/tree/asyncMultiTree";
import { FileType, IResolvedFileStat } from "src/base/common/file/file";
import { URI } from "src/base/common/file/uri";
import { IFilterOpts, isFiltered } from "src/base/common/fuzzy";
import { ILogService } from "src/base/common/logger";
import { Strings } from "src/base/common/util/string";
import { isPromise } from "src/base/common/util/type";
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

    // TODO: pref - memoize
    /** The parent of the target. Null if current target is the root. */
    readonly parent: ClassicItem | null;

    // TODO: pref - memoize
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
	 */
	refreshChildren(fileService: IFileService, filters?: IFilterOpts): void | Promise<void>;

	/**
	 * @description Forgets all the children of the current item.
	 */
	forgetChildren(): void;
}

/**
 * @class // TODO
 */
export class ClassicItem implements IClassicItem {

    // [field]

    /** stores all the info about the target. */
    private _stat: IResolvedFileStat;
    // An array to store the children and will be updated during the refresh.
    private _children: ClassicItem[] = [];
    private _parent: ClassicItem | null = null; // TODO

    // [constructor]

    constructor(
        stat: IResolvedFileStat,
        filters?: IFilterOpts,
    ) {
        this._stat = stat;
        for (const stat of (this._stat.children ?? [])) {
            if (filters && isFiltered(stat.name, filters)) {
                continue;
            }
            
            this._children.push(new ClassicItem(stat));
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
        if (this.parent === null) {
            return this;
        }
        return this.parent.root();
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

	public refreshChildren(fileService: IFileService, filters?: IFilterOpts): void | Promise<void> {

        // the basic children stats are already resolved
        if (this._stat.children) {
            return;
        }

        // never resolved the children before
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
                    this._children.push(new ClassicItem(childStat, filters));
                }
            } 
            catch (err) {
                throw err;
            }
        })();

        return promise;
	}

	public forgetChildren(): void {
        this._stat.children = undefined;
	}

    // [private method]

}

/**
 * @class A {@link IListItemProvider} used for {@link ClassicItem}.
 */
export class ClassicItemProvider implements IListItemProvider<ClassicItem> {

    public static readonly Size = 30;

    public getSize(data: ClassicItem): number {
        return ClassicItemProvider.Size;
    }

    public getType(data: ClassicItem): RendererType {
        return RendererType.Explorer;
    }

}

/**
 * @class A {@link IAsyncChildrenProvider} used for {@link ClassicItem}.
 */
export class ClassicChildrenProvider implements IAsyncChildrenProvider<ClassicItem> {

	constructor(
        private readonly logService: ILogService,
		private readonly fileService: IFileService,
        private readonly filterOpts?: IFilterOpts,
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
        const refreshPromise = data.refreshChildren(this.fileService, this.filterOpts);

        // the provided item's children are already resolved, we simply return it.
        if (isPromise(refreshPromise) === false) {
            return data.children;
        } 
        
        // the provided item's children never resolved, we wait until it resolved.
        const promise = (refreshPromise as Promise<void>)
        .then(() => { 
            return data.children;
        })
        .catch((error: any) => {
            this.logService.error(error);
            return [];
        });

        return promise;
    }

    public collapseByDefault(data: ClassicItem): boolean {
        // TODO
        return false;
    }

}