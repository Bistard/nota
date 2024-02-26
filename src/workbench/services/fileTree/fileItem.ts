import { IChildrenProvider } from "src/base/browser/secondary/tree/asyncTree";
import { AsyncResult, Result, err, ok } from "src/base/common/result";
import { FileOperationError, FileType, IResolvedFileStat } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { IFilterOpts, isFiltered } from "src/base/common/fuzzy";
import { ILogService } from "src/base/common/logger";
import { memoize } from "src/base/common/memoization";
import { Comparator } from "src/base/common/utilities/type";
import { IFileService } from "src/platform/files/common/fileService";
import { tryOrDefault } from "src/base/common/error";
import { parse, posix } from "src/base/common/files/path";
import { Strings } from "src/base/common/utilities/string";

/**
 * An interface only for {@link FileItem}.
 */
export interface IFileItem<TItem extends IFileItem<TItem>> {

    /** 
     * The unique representation of the target. 
     */
    readonly id: string;

    /** 
     * The {@link URI} of the target. 
     */
    readonly uri: URI;

    /** 
     * The name of the target. 
     * @example file.js
     */
    readonly name: string;
    
    /** 
     * The basename of the target without the extension name. 
     * @example file.js -> file
     */
    readonly basename: string;
    
    /** 
     * The extension name of the target. 
     * @example file.js -> .js
     */
    readonly extname: string;

    /** 
     * The type of the target. 
     */
    readonly type: FileType;

    /** 
     * The creation date in milliseconds. 
     */
    readonly createTime: number;

    /** 
     * The last modified date in milliseconds.
     */
    readonly modifyTime: number;

    /** 
     * The parent of the target. Null if current target is the root. 
     */
    readonly parent: TItem | null;

    /** 
     * The direct children of the target. 
     */
    readonly children: TItem[];
    
    /** 
     * A mapping of the direct children of the target. Lazy loading mechanism. 
     */
    readonly mapChildren: Map<string, FileItem>;

    /**
     * @description Returns the root of the current target
     * @complexity O(h) - h: height of the tree.
     */
    root(): TItem;

    /**
     * @description Determines if the current item is root.
     * @complexity O(1)
     */
    isRoot(): boolean;

    /**
     * @description Is the current item a {@link FileType.DIRECTORY}.
     * @complexity O(1)
     */
    isDirectory(): boolean;

    /**
     * @description Is the current item a {@link FileType.FILE}.
     * @complexity O(1)
     */
    isFile(): boolean;

    /**
     * @description Is the current item has ever update its children before.
     * @complexity O(1)
     */
    isChildrenResolved(): boolean;

    /**
     * @description If the current item is capable having children. Note that
     * it does not prove the item must has at least one child.
     * @complexity O(1)
     */
    hasChildren(): boolean;

    /**
     * @description Refreshing (fetching) the basic children stat of the current 
     * item.
     * @param fileService The given {@link IFileService} for fetching the 
     * children of the current item.
     * @param opts Options for building {@link FiteItem} when refreshing.
     * @cimplexity 
     * - O(1): if already resolved.
     * - O(n): number of children is the file system.
     */
    refreshChildren(fileService: IFileService, opts: IFileItemResolveOptions<TItem>): Result<void, FileOperationError> | AsyncResult<void, FileOperationError>;

    /**
     * @description Forgets all the children of the current item.
     */
    forgetChildren(): void;
}

export interface IFileItemResolveOptions<TItem extends IFileItem<TItem>> {

    /**
     * @description What happens when error encounters.
     */
    onError: (error: unknown) => void;
    
    /**
     * @description A filter options that provides ability to filter out unwanted
     * file items.
     */
    readonly filters?: IFilterOpts;

    /**
     * @description Provide a compare function that provides ability to decide
     * the order of every folder children.
     */
    cmp?: Comparator<FileItem>;

    /**
     * @description Provide a chance that client can be notified before every
     * compare.
     * @param folder The folder which children is about to sort.
     */
    beforeCmp?: (folder: TItem) => void | Promise<void>;
}

/**
 * @class A tree-like data structure. The item will build the tree structure 
 * recursively by the provided stat.
 * 
 * If stat is out of updated, invoking refreshChildren will automatically 
 * rebuild the whole tree structure.
 * 
 * @note Use {@link FileItem.resolve} to build the hierarchy.
 */
export class FileItem implements IFileItem<FileItem> {

    // [field]

    /** stores all the info about the target. */
    private _stat: IResolvedFileStat;
    /** An array to store the children and will be updated during the refresh. */
    private _children: FileItem[];
    /** the parent of the current item. */
    private _parent: FileItem | null = null;

    /**
     * An indicator tells if the directory is fully resolved. This is used to
     * prevent excessive readings from the disk.
     */
    private _isResolved = false;

    /**
     * Perf reason: for fast lookup, lazy loading mechanism. 
     * Do not access this directly, use 'this.mapChildren' instead.
     * @note The keys (name of the child) is smartly adjusted by the case 
     *       sensitive.
     */
    private _mapChildrenCache?: Map<string, FileItem>;

    // [constructor]

    /**
     * Use {@link FileItem.build} instead. Do not construct 
     */
    constructor(
        stat: IResolvedFileStat,
        parent: FileItem | null,
        children: FileItem[],
    ) {
        this._stat = stat;
        this._parent = parent;
        this._children = children;
        if (stat.children) {
            this._isResolved = true;
        }
    }

    // [get method]

    @memoize
    get id(): string { return URI.toString(this.uri); }

    get uri(): URI { return this._stat.uri; }

    get name(): string { return this._stat.name; }
    
    @memoize
    get basename(): string { return parse(this._stat.name).name; }

    @memoize
    get extname(): string { return parse(this._stat.name).ext; }

    get type(): FileType { return this._stat.type; }

    get createTime(): number { return this._stat.createTime; }

    get modifyTime(): number { return this._stat.modifyTime; }

    get parent(): FileItem | null { return this._parent; }

    get children(): FileItem[] { return this._children; }

    @memoize
    get mapChildren(): Map<string, FileItem> {
        if (this._mapChildrenCache) {
            return this._mapChildrenCache;
        }
        
        this._mapChildrenCache = new Map();
        for (const child of this._children) {
            const resolvedName = Strings.Smart.adjust(child.name);
            this._mapChildrenCache.set(resolvedName, child);
        }
        
        return this._mapChildrenCache;
    }

    // [public static method]

    /**
     * @description Resolving a tree-like structure of {@link FileItem} based on
     * the given {@link IResolvedFileStat}.
     * @returns A resolved {@link FileItem} that corresponds to the provided 
     *          resolved stat.
     */
    public static async resolve(
        stat: IResolvedFileStat, 
        parent: FileItem | null,
        opts: IFileItemResolveOptions<FileItem>,
    ): Promise<FileItem> 
    {
        const filters = opts.filters;
        const cmp = opts.cmp;
        
        const children: FileItem[] = [];
        const root = new FileItem(stat, parent, children);

        if (stat.children) {
            for (const childStat of stat.children) {
                if (filters && isFiltered(childStat.name, filters)) {
                    continue;
                }

                const child = await FileItem.resolve(childStat, root, opts);
                children.push(child);
            }
        }

        // empty folder will not be notified
        if (children.length && cmp) {
            await tryOrDefault(null, () => opts.beforeCmp?.(root), opts.onError);
            children.sort(cmp);
        }
        
        return root;
    }

    // [public method]

    public root(): FileItem {
        if (!this._parent) {
            return this;
        }
        return this._parent.root();
    }

    public isRoot(): boolean {
        return !this._parent;
    }

    public isDirectory(): boolean {
        return this._stat.type === FileType.DIRECTORY;
    }

    public isFile(): boolean {
        return this._stat.type === FileType.FILE;
    }

    public isChildrenResolved(): boolean {
        return this._isResolved;
    }

    public hasChildren(): boolean {
        return this.isDirectory();
    }

    public refreshChildren(fileService: IFileService, opts: IFileItemResolveOptions<FileItem>): AsyncResult<void, FileOperationError> {
        const promise = (async () => {

            /**
             * Only refresh the children from the disk if this is not resolved
             * before.
             */
            if (this._isResolved === false) {
                const resolving = await fileService.stat(this._stat.uri, { resolveChildren: true });

                if (resolving.isErr()) {
                    return err<void, FileOperationError>(resolving.error);
                }

                const updatedStat = resolving.data;
                this._stat = updatedStat;
                this._isResolved = true;
            }

            // update the children stat recursively
            this._children = [];
            for (const childStat of (this._stat.children ?? [])) {
                if (opts.filters && isFiltered(childStat.name, opts.filters)) {
                    continue;
                }

                const child = await FileItem.resolve(childStat, this, opts);
                this._children.push(child);
            }

            if (this._children.length && opts.cmp) {
                await tryOrDefault(null, () => opts.beforeCmp?.(this), opts.onError);
                this._children.sort(opts.cmp);
            }

            return ok<void, FileOperationError>();
        })();

        return new AsyncResult(promise);
    }

    public forgetChildren(): void {
        this._children = [];
        this._mapChildrenCache = undefined;
        this._isResolved = false;
        (<any>this._stat.children) = undefined;
    }   

}

/**
 * @class A {@link IChildrenProvider} used in a {@link FileTreeService}
 * and to provide children for {@link FileItem}.
 */
export class FileItemChildrenProvider implements IChildrenProvider<FileItem> {

    // [constructor]

    constructor(
        private readonly logService: ILogService,
        private readonly fileService: IFileService,
        private readonly opts: IFileItemResolveOptions<FileItem>,
    ) { }

    // [public methods]

    public hasChildren(data: FileItem): boolean {
        return data.hasChildren();
    }

    /**
     * @description Returns the children of the given item. If the children of
     * the item is not resolved, wait until they are resolved.
     * @param data The provided {@link FileItem}.
     */
    public getChildren(data: FileItem): FileItem[] | Promise<FileItem[]> {

        const onError = (error: any) => {
            this.logService.error('FileItemChildrenProvider', 'Refreshing FileItem children failed.', error);
            return <FileItem[]>[];
        };

        // refresh the children recursively
        const refreshPromise = data.refreshChildren(this.fileService, this.opts);

        // the provided item's children are already resolved, we simply return it.
        if (!AsyncResult.is(refreshPromise)) {
            return data.children;
        }

        // the provided item's children never resolved, we wait until it resolved.
        
        const promise = refreshPromise
        .then(
            (result) => {
                return result.match(
                    () => data.children,
                    error => onError(error),
                );
            },
            (error) => onError(error),
        );

        return promise;
    }

    public isChildrenResolved(data: FileItem): boolean {
        return data.isChildrenResolved();
    }

    public forgetChildren(data: FileItem): void {
        data.forgetChildren();
    }

    public collapseByDefault(data: FileItem): boolean {
        return true;
    }
}
