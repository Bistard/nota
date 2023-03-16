import { URI } from "src/base/common/file/uri";
import { CreateTernarySearchTree, TernarySearchTree } from "src/base/common/util/ternarySearchTree";
import { IRawResourceChangeEvent, IRawResourceChangeEvents, ResourceChangeType } from "src/code/platform/files/common/watcher";

/**
 * An interface only for {@link ResourceChangeEvent}.
 */
export interface IResourceChangeEvent {

    /**
     * @description Check if the given resource finds an exact match in the 
     * changing events.
     * @param resource The given resource.
     * @param typeFilter The desired types for lookup. If not provided it will
     *                   match any types.
     * @param isDirectory A suggestion for faster lookup.
     */
    match(resource: URI, typeFilter?: ResourceChangeType[], isDirectory?: boolean): boolean;

    /**
     * @description Check if the given resource finds an exact match or find a 
     * child of the resource in the changing events.
     * @param resource The given resource.
     * @param typeFilter The desired types for lookup. If not provided it will
     *                   match any types.
     * @param isDirectory A suggestion for faster lookup.
     */
    affect(resource: URI, typeFilter?: ResourceChangeType[], isDirectory?: boolean): boolean;
}

/**
 * @class A wrapper class over the raw {@link IRawResourceChangeEvents}. It 
 * provides convenient APIs to look up for changes in resources more cheaper.
 * 
 * @note Using ternary search tree to speed up the lookup time.
 */
export class ResourceChangeEvent implements IResourceChangeEvent {

    // [field]
    
    private readonly _added?: TernarySearchTree<URI, IRawResourceChangeEvent>;
    private readonly _deleted?: TernarySearchTree<URI, IRawResourceChangeEvent>;
    private readonly _updated?: TernarySearchTree<URI, IRawResourceChangeEvent>;

    // [constructor]

    constructor(
        private readonly rawEvent: IRawResourceChangeEvents, 
        ignoreCase?: boolean,
    ) {
        const entriesByType = new Map<ResourceChangeType, [URI, IRawResourceChangeEvent][]>();

        // put all the raw events into categories using map
        for (const change of rawEvent.events) {
            
            let entry = entriesByType.get(change.type);
            if (!entry) {
                entry = [];
                entriesByType.set(change.type, entry);
            }

            entry.push([URI.fromFile(change.resource), change]);
        }

        // building ternary search tree by different categories
        for (const [type, events] of entriesByType) {
            switch(type) {
                case ResourceChangeType.ADDED:
                    this._added = CreateTernarySearchTree.forUriKeys<IRawResourceChangeEvent>(ignoreCase ?? false);
                    this._added.fill(events);
                    break;
                case ResourceChangeType.DELETED:
                    this._deleted = CreateTernarySearchTree.forUriKeys<IRawResourceChangeEvent>(ignoreCase ?? false);
                    this._deleted.fill(events);
                    break;
                case ResourceChangeType.UPDATED:
                    this._updated = CreateTernarySearchTree.forUriKeys<IRawResourceChangeEvent>(ignoreCase ?? false);
                    this._updated.fill(events);
            }
        }
    }

    // [public methods]

    public match(resource: URI, typeFilter?: ResourceChangeType[], isDirectory?: boolean): boolean {
        return this.__search(resource, false, typeFilter, isDirectory);
    }

    public affect(resource: URI, typeFilter?: ResourceChangeType[], isDirectory?: boolean): boolean {
        return this.__search(resource, true, typeFilter, isDirectory);
    }

    // [private helper methods]

    private __search(resource: URI, searchChildren: boolean, typeFilter?: ResourceChangeType[], isDirectory?: boolean): boolean {

        // look up for directory but no directories changes
        if (isDirectory === true && !this.rawEvent.anyDirectory) {
            return false;
        }

        // look up for file but no files changes
        if (isDirectory === false && !this.rawEvent.anyFile) {
            return false;
        }

        let addMatch = false;
        let deleteMatch = false;
        let updateMatch = false;

        if (typeFilter && typeFilter.length) {  
            for (const type of typeFilter) {
                if (type === ResourceChangeType.ADDED && this.rawEvent.anyAdded) {
                    addMatch = true;
                } else if (type === ResourceChangeType.DELETED && this.rawEvent.anyDeleted) {
                    deleteMatch = true;
                } else if (type === ResourceChangeType.UPDATED && this.rawEvent.anyUpdated) {
                    updateMatch = true;
                }
            }
            if (!(addMatch || deleteMatch || updateMatch)) {
                return false;
            }
        }
        
        if (!typeFilter || updateMatch) {
            if (this._updated?.has(resource)) {
                return true;
            }
            if (searchChildren && this._updated?.findSuperStrOf(resource)) {
                return true;
            }
        }

        if (!typeFilter || addMatch) {
            if (this._added?.has(resource)) {
                return true;
            }
            if (searchChildren && this._added?.findSuperStrOf(resource)) {
                return true;
            }
        }

        if (!typeFilter || deleteMatch) {
            if (this._deleted?.findSubStrOf(resource)) {
                return true;
            }
            if (searchChildren && this._deleted?.findSuperStrOf(resource)) {
                return true;
            }
        }

        return false;
    }

}
