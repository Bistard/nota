import { IChildrenProvider } from "src/base/browser/secondary/tree/asyncTree";
import { AsyncResult, Result, err, errorToMessage, ok } from "src/base/common/error";
import { FileOperationError, FileType, IResolvedFileStat } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { IFilterOpts, isFiltered } from "src/base/common/fuzzy";
import { ILogService } from "src/base/common/logger";
import { CompareFn, isPromise, Mutable } from "src/base/common/utilities/type";
import { IFileService } from "src/platform/files/common/fileService";

/**
 * An interface only for {@link FileItem}.
 */
export interface IFileItem {

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
    readonly parent: FileItem | null;

    /** The direct children of the target. */
    readonly children: FileItem[];

    /**
     * @description Returns the root of the current target
     * @complexity O(h) - h: height of the tree.
     */
    root(): FileItem;

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
     * @param onError Make sure the error is provided to outside.
     * @param filters Providing filter options during the resolution process can 
     * prevent unnecessary performance loss compares to we filter the result 
     * after the process.
     * @param cmpFn A compare function to sort the children.
     * @cimplexity 
     * - O(1): if already resolved.
     * - O(n): number of children is the file system.
     */
    refreshChildren(fileService: IFileService, onError: (error: Error) => void, filters?: IFilterOpts, cmpFn?: CompareFn<FileItem>): Result<void, FileOperationError> | AsyncResult<void, FileOperationError>;

    /**
     * @description Forgets all the children of the current item.
     */
    forgetChildren(): void;
}

/**
 * @class A data structure to be stored as each tree node in a 
 * {@link FileTreeService}. The item will build the tree structure 
 * recursively once constructed by the provided stat.
 * 
 * If stat is out of updated, invoking refreshChildren will automatically 
 * rebuild the whole tree structure.
 */
export class FileItem implements IFileItem {

    // [field]

    /** stores all the info about the target. */
    private _stat: IResolvedFileStat;
    /** An array to store the children and will be updated during the refresh. */
    private _children: FileItem[] = [];
    /** the parent of the current item. */
    private _parent: FileItem | null = null;

    /**
     * An indicator tells if the directory is fully resolved. This is used to
     * prevent excessive readings from the disk.
     */
    private _isResolved = false;

    // [constructor]

    constructor(
        stat: IResolvedFileStat,
        parent: FileItem | null,
        onError: (error: Error) => void,
        filters?: IFilterOpts,
        cmpFn?: CompareFn<FileItem>
    ) {
        this._stat = stat;
        this._parent = parent;
        if (!cmpFn) {
            cmpFn = defaultFileItemCompareFn;
        }

        if (stat.children) {
            this._isResolved = true;

            for (const child of stat.children) {
                if (filters && isFiltered(child.name, filters)) {
                    continue;
                }
                this._children.push(new FileItem(child, this, onError, filters, cmpFn));
            }
        }

        if (cmpFn) {
            try {
                this._children.sort(cmpFn);
            } catch (error: any) {
                this._children.sort();
                onError(error);
            }
        }
    }

    // [get method]

    get uri(): URI { return this._stat.uri; }

    get name(): string { return this._stat.name; }

    get type(): FileType { return this._stat.type; }

    get createTime(): number { return this._stat.createTime; }

    get modifyTime(): number { return this._stat.modifyTime; }

    get parent(): FileItem | null { return this._parent; }

    get children(): FileItem[] { return this._children; }

    // [public method]

    public root(): FileItem {
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
        return this._isResolved;
    }

    public hasChildren(): boolean {
        return this.isDirectory();
    }

    public refreshChildren(fileService: IFileService, onError: (error: Error) => void, filters?: IFilterOpts, cmpFn?: CompareFn<FileItem>): AsyncResult<void, FileOperationError> {
        const promise = (async () => {

            /**
             * Only refresh the children from the disk if this is not resolved
             * before.
             */
            if (this._isResolved === false) {
                console.log('[item] resolving children'); // TEST
                
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
                this._children.push(new FileItem(childStat, this, onError, filters, cmpFn));
            }

            if (cmpFn) {
                this._children.sort(cmpFn);
            }

            return ok<void, FileOperationError>();
        })();

        return new AsyncResult(promise);
    }

    public forgetChildren(): void {
        this._children = [];
        this._isResolved = false;
        (<Mutable<typeof this._stat.children>>this._stat.children) = undefined;
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
        private readonly filterOpts?: IFilterOpts,
        private readonly cmpFn: CompareFn<FileItem> = defaultFileItemCompareFn,
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
            this.logService.error(errorToMessage(error));
            return <FileItem[]>[];
        };

        // refresh the children recursively
        const refreshPromise = data.refreshChildren(this.fileService, onError, this.filterOpts, this.cmpFn);

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
                    error => onError(error)
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

/**
 * @description Directory goes first, otherwise sorts in ascending, ASCII 
 * character order.
 */
export function defaultFileItemCompareFn(a: FileItem, b: FileItem): number {
    if (a.type === b.type) {
        return (a.name < b.name) ? -1 : 1;
    } else if (a.isDirectory()) {
        return -1;
    } else {
        return 1;
    }
}