import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { IAsyncChildrenProvider } from "src/base/browser/secondary/tree/asyncMultiTree";
import { FileType, IResolvedFileStat } from "src/base/common/file/file";
import { URI } from "src/base/common/file/uri";
import { Iterable } from "src/base/common/iterable";
import { isPromise } from "src/base/common/type";
import { IFileService } from "src/code/common/service/fileService/fileService";

/**
 * An interface only for {@link ExplorerItem}.
 */
export interface IExplorerItem {

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
    readonly parent: ExplorerItem | null;

    // TODO: pref - memoize
    /** The direct children of the target. */
    readonly children: ExplorerItem[];

    /**
     * @description Returns the root of the current target
     * time complexity: O(h) - h: height of the tree.
     */
    root(): ExplorerItem;

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
	 * @param fileService The given {@link IFileService} for fetching the children 
     * of the current item.
	 */
	refreshChildren(fileService: IFileService): void | Promise<void>;

	/**
	 * @description Forgets all the children of the current item.
	 */
	forgetChildren(): void;
}

/**
 * @class A data structure used in {@link Notebook} for displaying.
 */
export class ExplorerItem implements IExplorerItem {

    // [field]

    /** stores all the info about the target. */
    private _stat: IResolvedFileStat;

    /** if the item encounters an error. */
    private _inError: boolean = false;

    // [constructor]

    constructor(
        stat: IResolvedFileStat,
    ) {
        this._stat = stat;
    }

    // [get method]

    get uri(): URI { return this._stat.uri; }

    get name(): string { return this._stat.name; }

    get type(): FileType { return this._stat.type; }

    get createTime(): number { return this._stat.createTime; }

    get modifyTime(): number { return this._stat.modifyTime; }

    get parent(): ExplorerItem | null { return this._stat.parent ? new ExplorerItem(this._stat) : null; }

    get children(): ExplorerItem[] { return [...this._stat.children ?? Iterable.empty()].map(childStat => new ExplorerItem(childStat)); }

    // [public method]

    public root(): ExplorerItem {
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

	public refreshChildren(fileService: IFileService): void | Promise<void> {

        // the basic children stats are already resolved
        if (this._stat.children) {
            return;
        }

        // never resolved the children before
        const promise = (async () => {
            try {
                const updatedStat = await fileService.stat(this._stat.uri, { resolveChildren: true });
                this._stat = updatedStat;
            } catch (err) {
                this._inError = true;
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
 * @class A {@link IListItemProvider} used for {@link ExplorerItem}.
 */
export class ExplorerItemProvider implements IListItemProvider<ExplorerItem> {

    public static readonly Size = 30;

    public getSize(data: ExplorerItem): number {
        return ExplorerItemProvider.Size;
    }

    public getType(data: ExplorerItem): RendererType {
        return RendererType.Explorer;
    }

}

/**
 * @class A {@link IAsyncChildrenProvider} used for {@link ExplorerItem}.
 */
export class ExplorerChildrenProvider implements IAsyncChildrenProvider<ExplorerItem> {

	constructor(
		private fileService: IFileService
	) {

    }

    public hasChildren(data: ExplorerItem): boolean | Promise<boolean> {
        return data.hasChildren();
    }

    /**
     * @description Returns the children of the given item. If the children of
     * the item is not resolved, wait until they are resolved.
     * @param data The provided {@link ExplorerItem}.
     */
    public getChildren(data: ExplorerItem): ExplorerItem[] | Promise<ExplorerItem[]> {
        
        const finish = data.refreshChildren(this.fileService);

        // the provided item's children are already resolved, we simply return it.
        if (isPromise(finish) === false) {
            return data.children;
        } 
        
        // the provided item's children never resolved, we wait until it resolved.
        const promise = (finish as Promise<void>)
        .then(() => { 
            return data.children;
        })
        .catch((err) => {
            // logService.trace(err);
            return [];
        });

        return promise;
    }

    public collapseByDefault(data: ExplorerItem): boolean {
        // TODO
        return true;
    }

}