import { isParentOf } from "src/base/common/file/glob";
import { URI } from "src/base/common/file/uri";
import { CreateTernarySearchTree, TernarySearchTree } from "src/base/common/util/ternarySearchTree";
import { IResourceChangeEvent, ResourceChangeType } from "src/code/platform/files/node/watcher";
import { IReviverRegistrant } from "src/code/platform/ipc/common/revive";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";
import { IRawResourceChangeEvent } from "src/code/platform/files/node/watcher";
import { type } from "process";

/**
 * @class A wrapper class over the raw {@link IResourceChangeEvent}. It provides 
 * convenient APIs to look up for changes in resources more cheaper.
 */
export class ResourceChangeEvent {

    // [field]
    private readonly _added: TernarySearchTree<URI, IRawResourceChangeEvent> | undefined =  undefined;
    private readonly _deleted: TernarySearchTree<URI, IRawResourceChangeEvent> | undefined = undefined;
    private readonly _updated: TernarySearchTree<URI, IRawResourceChangeEvent> | undefined =  undefined;

    // [constructor]

    constructor(
        private readonly rawEvent: IResourceChangeEvent, ignoreCase?: boolean
    ) {
        const entriesByType = new Map<ResourceChangeType, [URI, IRawResourceChangeEvent][]>();

        for (const change of rawEvent.events) {
            const entry = entriesByType.get(change.type);
            if (entry) {
                entry.push([URI.fromFile(change.resource), change]);
            } else {
                entriesByType.set(change.type, [[URI.fromFile(change.resource), change]]);
            }
        }

        for (const [type, event] of entriesByType) {
            switch(type) {
                case ResourceChangeType.ADDED:
                    this._added = CreateTernarySearchTree.forUriKeys<IRawResourceChangeEvent>(ignoreCase ? ignoreCase : false);
                    this._added.fill(event);
                    break;
                case ResourceChangeType.DELETED:
                    this._deleted = CreateTernarySearchTree.forUriKeys<IRawResourceChangeEvent>(ignoreCase ? ignoreCase : false);
                    this._deleted.fill(event);
                    break;
                case ResourceChangeType.UPDATED:
                    this._updated = CreateTernarySearchTree.forUriKeys<IRawResourceChangeEvent>(ignoreCase ? ignoreCase : false);
                    this._updated.fill(event);
            }
        }
    }

    // [public methods]

    /**
     * @description Check if the given resource finds an exact match in the 
     * changing events.
     * @param resource The given resource.
     * @param typeFilter The desired types for lookup. If not provided it will
     *                   match any types.
     * @param isDirectory A suggestion for faster lookup.
     */
    public match(resource: URI, typeFilter?: ResourceChangeType[], isDirectory?: boolean): boolean {
        return this.__search(resource, false, typeFilter, isDirectory);
    }

    /**
     * @description Check if the given resource finds an exact match or find a 
     * child of the resource in the changing events.
     * @param resource The given resource.
     * @param typeFilter The desired types for lookup. If not provided it will
     *                   match any types.
     * @param isDirectory A suggestion for faster lookup.
     */
    public affect(resource: URI, typeFilter?: ResourceChangeType[], isDirectory?: boolean): boolean {
        return this.__search(resource, true, typeFilter, isDirectory);
    }

    // [static public methods]

    public static revive(obj: any): ResourceChangeEvent {
        if (!obj) {
			return obj;
		}

		if (obj instanceof ResourceChangeEvent) {
			return obj;
		}

		const uri = reviverRegistrant.revive<ResourceChangeEvent>(obj);
		return uri;
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

        // TODO: pref - use TenarySearchTree for optimization
        // if (searchChildren) {
        //     for (const raw of this.rawEvent.events) {
        //         if (isParentOf(raw.resource, URI.toFsPath(resource))) {
        //             return true;
        //         }
        //     }
        // } else {
        //     for (const raw of this.rawEvent.events) {
        //         if (raw.resource === URI.toFsPath(resource)) {
        //             return true;
        //         }
        //     }  
        // }

        if (typeFilter === undefined || addMatch) {
            if (this._added?.has(resource)) {
                return true;
            }
        }

        if (typeFilter === undefined || deleteMatch) {
            if (this._deleted?.has(resource)) {
                return true;
            }
        }

        if (typeFilter === undefined || updateMatch) {
            if (this._updated?.has(resource)) {
                return true;
            }
        }

        return false;
    }

}

const reviverRegistrant = REGISTRANTS.get(IReviverRegistrant);
reviverRegistrant.registerPrototype(ResourceChangeEvent, (obj: Object) => {
    if (obj.hasOwnProperty('rawEvent')) {
        return true;
    }
    return false;
});