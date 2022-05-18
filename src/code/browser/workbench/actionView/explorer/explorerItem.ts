import { FileType, IResolvedFileStat } from "src/base/common/file/file";
import { URI } from "src/base/common/file/uri";
import { Iterable } from "src/base/common/iterable";
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
     * Returns the root of the current target (recursive calling).
     */
    root(): ExplorerItem;
}

/**
 * @class // TODO
 */
export class ExplorerItem implements IExplorerItem {

    // [field]

    /** stores all the info about the target. */
    private _stat: IResolvedFileStat;

    // [constructor]

    constructor(
        stat: IResolvedFileStat,
        private fileService: IFileService,
    ) {
        this._stat = stat;
    }

    // [get method]

    get uri(): URI { return this._stat.uri; }

    get name(): string { return this._stat.name; }

    get type(): FileType { return this._stat.type; }
    
    get createTime(): number { return this._stat.createTime; }

    get modifyTime(): number { return this._stat.modifyTime; }

    get parent(): ExplorerItem | null { return this._stat.parent ? new ExplorerItem(this._stat, this.fileService) : null; }

    get children(): ExplorerItem[] { return [...this._stat.children ?? Iterable.empty()].map(childStat => new ExplorerItem(childStat, this.fileService)); }

    // [public method]

    public root(): ExplorerItem {
        if (this.parent === null) {
            return this;
        }
        return this.parent.root();
    }

    // [private method]

}