import { isParentOf } from "src/base/common/file/glob";
import { URI } from "src/base/common/file/uri";
import { IResourceChangeEvent, ResourceChangeType } from "src/code/platform/files/node/watcher";
import { IReviverRegistrant } from "src/code/platform/ipc/common/revive";
import { Registrants } from "src/code/platform/registrant/common/registrant";

/**
 * @class A wrapper class over the raw {@link IResourceChangeEvent}. It provides 
 * convenient APIs to look up for changes in resources more cheaper.
 */
export class ResourceChangeEvent {

    // [constructor]

    constructor(
        private readonly rawEvent: IResourceChangeEvent,
    ) {

    }

    // [public methods]

    /**
     * @description Check if the given resource find a exact match in the 
     * changed events.
     * @param resource The given resource.
     * @param typeFilter The desired types for lookup. If not provided it will
     *                   match any types.
     * @param isDirectory A suggestion for faster lookup.
     */
    public match(resource: URI, typeFilter?: ResourceChangeType[], isDirectory?: boolean): boolean {
        return this.__search(resource, false, typeFilter, isDirectory);
    }

    /**
     * @description Check if the given resource find a exact match or find a 
     * children of the resource in the changed events.
     * @param resource The given resource.
     * @param typeFilter The desired types for lookup. If not provided it will
     *                   match any types.
     * @param isDirectory A suggestion for faster lookup.
     */
    public contains(resource: URI, typeFilter?: ResourceChangeType[], isDirectory?: boolean): boolean {
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

        let anyMatchType = false;
        if (!typeFilter || !typeFilter.length) {
            anyMatchType = true;
        } 
        else {
            for (const type of typeFilter) {
                if (type === ResourceChangeType.ADDED && this.rawEvent.anyAdded) {
                    anyMatchType = true;
                } else if (type === ResourceChangeType.DELETED && this.rawEvent.anyDeleted) {
                    anyMatchType = true;
                } else if (type === ResourceChangeType.UPDATED && this.rawEvent.anyUpdated) {
                    anyMatchType = true;
                }
            }
        }

        // no matching types
        if (!anyMatchType) {
            return false;
        }

        // TODO: pref - use TenarySearchTree for optimization
        if (searchChildren) {
            for (const raw of this.rawEvent.events) {
                if (isParentOf(raw.resource, URI.toFsPath(resource))) {
                    return true;
                }
            }
        } else {
            for (const raw of this.rawEvent.events) {
                if (raw.resource === URI.toFsPath(resource)) {
                    return true;
                }
            }
        }

        return false;
    }

}

const reviverRegistrant = Registrants.get(IReviverRegistrant);
reviverRegistrant.registerPrototype(ResourceChangeEvent, (obj: Object) => {
    if (obj.hasOwnProperty('rawEvent')) {
        return true;
    }
    return false;
});