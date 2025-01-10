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
import { assert } from "src/base/common/utilities/panic";
import { Lazy } from "src/base/common/lazy";
import { safeDisposable } from "src/base/common/dispose";

export interface IFileTarget {
    readonly name: string;
    readonly type: FileType;
}

/**
 * An interface only for {@link FileItem}.
 */
export interface IFileItem<TItem extends IFileItem<TItem>> extends IFileTarget {

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
     * @note If the current operating system is case sensitive, the keys are 
     * all lowercased here.
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
     * @description Is the current item is updated. If the item has ever update 
     * its children before, this returns false.
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
     * @param opts Options for building {@link FileItem} when refreshing.
     * @complexity 
     * - O(1): if already resolved.
     * - O(n): number of children is the file system.
     */
    refreshChildren(fileService: IFileService, opts: IFileItemResolveOptions<TItem>): Result<void, FileOperationError> | AsyncResult<void, FileOperationError>;

    /**
     * @description Simply mark the item as unresolved. This does not clean its
     * children.
     */
    markAsUnresolved(): void;

    /**
     * @description Forgets all the children of the current item. Will also mark
     * the item as unresolved.
     */
    forgetChildren(): void;

    /**
     * @description Try to find a child item if it is under the parent of the 
     * current item (recursive).
     * @param uri The uri of the child.
     * 
     * @note Some string comparison happens here. Might raise perf issue is 
     * calling too frequently.
     */
    findDescendant(uri: URI): FileItem | undefined;

    /**
     * @description Returns an index of the current item within the children of 
     * its parent.
     * @panic make sure the parent exists.
     */
    getSelfIndexInParent(): number;
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
     * @note Do not access this directly, use 'this.mapChildren' instead.
     * @note The keys (name of the child) is smartly adjusted by the case 
     *       sensitive.
     */
    private readonly _mapChildren: Lazy<Map<string, FileItem>>;

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

        this._mapChildren = safeDisposable(new Lazy(() => {
            const cache = new Map();
            for (const child of this._children) {
                const resolvedName = Strings.Smart.adjust(child.name);
                cache.set(resolvedName, child);
            }
            return cache;
        }));
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

    get mapChildren(): Map<string, FileItem> { return this._mapChildren.value(); }

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

    public refreshChildren(fileService: IFileService, opts: IFileItemResolveOptions<FileItem>): Result<void, FileOperationError> | AsyncResult<void, FileOperationError> {
        if (this._isResolved) {
            return ok();
        }

        return new AsyncResult((async () => {

            /**
             * Only refresh the children from the disk if this is not resolved
             * before.
             */
            if (this._isResolved === false) {
                const resolving = await fileService.stat(this._stat.uri, { resolveChildren: true });

                if (resolving.isErr()) {
                    return err(resolving.error);
                }

                const updatedStat = resolving.data;
                this._stat = updatedStat;
            }

            // resolve FileItem recursively based on the stat
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

            this._isResolved = true;
            return ok<void, FileOperationError>();
        })());
    }

    public markAsUnresolved(): void {
        this._isResolved = false;
    }

    public forgetChildren(): void {
        this._children = [];
        this._mapChildren.dispose();
        this._isResolved = false;
        (<any>this._stat.children) = undefined;
    }   

    public findDescendant(uri: URI): FileItem | undefined {
        
        /**
         * For perf reason, try to do some comparison first to see it needs to 
         * go deeper.
         */
        if (this.uri.scheme !== uri.scheme) {
            return undefined;
        }

        if (!Strings.Smart.equals(this.uri.authority, uri.authority)) {
            return undefined;
        }

        if (!Strings.Smart.startsWith(uri.path, this.uri.path)) {
            return undefined;
        }

        return this.__findChildByPath(uri.path, this.uri.path.length);
    }

    public getSelfIndexInParent(): number {
        const resolvedParent = assert(this.parent);
        return resolvedParent.children.indexOf(this);
    }

    // [private helper methods]

    private __findChildByPath(path: string, index: number): FileItem | undefined {
		if (Strings.Smart.equals(Strings.rtrim(this.uri.path, posix.sep), path)) {
			return this;
		}

		if (this.isFile()) {
			return undefined;
		}

        // Ignore separator to more easily deduct the next name to search
        while (index < path.length && path[index] === posix.sep) {
            index++;
        }

        let indexOfNextSep = path.indexOf(posix.sep, index);
        if (indexOfNextSep === -1) {
            // If there is no separator take the remainder of the path
            indexOfNextSep = path.length;
        }

        // The name to search is between two separators
        const name = Strings.Smart.adjust(path.substring(index, indexOfNextSep));
        const child = this.mapChildren.get(name);

        if (child) {
            // We found a child with the given name, continue search deeper
            return child.__findChildByPath(path, indexOfNextSep);
        }

        return undefined;
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

    public markAsUnresolved(data: FileItem): void {
        data.markAsUnresolved();
    }

    public forgetChildren(data: FileItem): void {
        data.forgetChildren();
    }

    public collapseByDefault(data: FileItem): boolean {
        return true;
    }
}
