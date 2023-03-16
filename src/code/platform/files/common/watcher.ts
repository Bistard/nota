import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";

/**
 * A watch request for {@link Watcher}.
 */
export interface IWatchRequest {
    /**
     * The URI of the resource to be watched.
     */
    readonly resource: URI;
    
    /**
     * In non-recursive mode, if the resource is a file, it is the only resource 
     * to be watched. If the resource is a directory, its direct children will 
     * only be watched.
     */
    readonly recursive?: boolean;
    
    /**
     * Rules to exclude the specific resources.
     */
    readonly exclude?: RegExp[];
}

/**
 * An interface only for {@link Watcher}.
 */
export interface IWatcher {
    
    /**
     * Fires when the resources are either added, deleted or updated.
     */
    readonly onDidChange: Register<IRawResourceChangeEvents>;

    /**
     * Fires when the watcher is closed.
     */
    readonly onDidClose: Register<URI>;

    /**
     * @description Watch the provided resources and fires the event once these
     * resources are either added, deleted or updated.
     * @param request The provided request for watching.
     * @returns A disposable to close the current watch request.
     */
    watch(request: IWatchRequest): IDisposable;
    
    /**
     * @description Closes all the current watchings asynchronously.
     */
    close(): Promise<any>;

    /**
     * @description Disposes all the registered listeners and closes all the
     * current watchings asynchronously.
     */
    dispose(): void;
}

export interface IRawResourceChangeEvents {
    
    /**
     * The raw changed event array.
     */
    readonly events: readonly IRawResourceChangeEvent[];

    /**
     * If any event added.
     */
    readonly anyAdded: boolean;

    /**
     * If any event deleted.
     */
    readonly anyDeleted: boolean;

    /**
     * If any event updated.
     */
    readonly anyUpdated: boolean;

    /**
     * If any added or updated events is directory.
     */
    readonly anyDirectory: boolean;

    /**
     * If any added or updated events is file.
     */
    readonly anyFile: boolean;
}

/**
 * Possible changes that can occur to resource (directory / file).
 */
export const enum ResourceChangeType {
	UPDATED,
	ADDED,
	DELETED
}

export interface IRawResourceChangeEvent {
	
    /**
	 * The changed resource path.
	 */
	readonly resource: string;

	/**
	 * If the changed resource is directory. Undefined when the resource is 
	 * deleted.
	 */
	readonly isDirectory?: boolean;

	/**
	 * The type of change that occurred to the resource.
	 */
	readonly type: ResourceChangeType;
}

/**
 * An interface only for {@link WatchInstance}.
 */
export interface IWatchInstance {
    
    readonly request: IWatchRequest;
    watch(): void;
    close(): Promise<URI | undefined>;
}