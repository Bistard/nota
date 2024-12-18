import { ErrorHandler } from "src/base/common/error";
import { FileType } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { Result } from "src/base/common/result";
import { Arrays } from "src/base/common/utilities/array";
import { Strings } from "src/base/common/utilities/string";
import { IHostService } from "src/platform/host/common/hostService";
import { StatusKey } from "src/platform/status/common/status";

/**
 * Represents an entry in the recently opened list.
 */
export interface IRecentOpenedTarget {
    /**
     * The resource of the recently opened target.
     */
    readonly target: URI;
    /**
     * If the target is a file or directory.
     */
    readonly targetType: FileType;
    /**
     * Specifies whether the target should be pinned in the recently opened list.
     * @default false
     */
    readonly pinned: boolean;
    /**
     * Optional. Specifies the line number to navigate to when reopening the
     * target.
     * @note Only support when the target is a file.
     */
    readonly gotoLine?: number;
}

/**
 * Consist of common utility functions that can be used across different process
 * (main/renderer process).
 */
export namespace RecentOpenUtility {

    export const MAX_SIZE = 100;

    export async function getRecentOpened(hostService: IHostService): Promise<IRecentOpenedTarget | undefined> {
        return (await getRecentOpenedAll(hostService))[0];
    }

    export async function getRecentOpenedDirectory(hostService: IHostService): Promise<IRecentOpenedTarget | undefined> {
        return (await getRecentOpenedAll(hostService)).find(each => each.targetType === FileType.DIRECTORY);
    }

    export async function getRecentOpenedFile(hostService: IHostService): Promise<IRecentOpenedTarget | undefined> {
        return (await getRecentOpenedAll(hostService)).find(each => each.targetType === FileType.FILE);
    }

    export async function getRecentOpenedAll(hostService: IHostService): Promise<IRecentOpenedTarget[]> {
        return Result.fromPromise(
            () => hostService.getApplicationStatus(StatusKey.OpenRecent)
        ).match(
            recentOpened => {
                if (!Array.isArray(recentOpened)) {
                    return [];
                }
                const deserialization = recentOpened.map(raw => __deserialize(raw));
                return Arrays.coalesce(deserialization);
            }, 
            err => {
                ErrorHandler.onUnexpectedError(err);
                return [];
            }
        );
    }

    export async function addToRecentOpened(hostService: IHostService, target: IRecentOpenedTarget): Promise<boolean> {
        let recentOpened = await getRecentOpenedAll(hostService);

        // append to the first then remove duplicate
        recentOpened.unshift(target);
        recentOpened = Arrays.unique(recentOpened, each => URI.toString(each.target));
        recentOpened = recentOpened.slice(0, RecentOpenUtility.MAX_SIZE);

        // write back to disk
        const serialization = recentOpened.map(each => __serialize(each));
        
        return Result.fromPromise(
            () => hostService.setApplicationStatus(StatusKey.OpenRecent, serialization),
        ).match(
            () => true,
            err => {
                ErrorHandler.onUnexpectedError(err);
                return false;
            }
        );
    }

    export async function clearRecentOpened(hostService: IHostService): Promise<boolean> {
        return Result.fromPromise(
            () => hostService.setApplicationStatus(StatusKey.OpenRecent, [])
        ).match(
            () => true, 
            err => {
                ErrorHandler.onUnexpectedError(err);
                return false;
            },
        );
    }
}

function __deserialize(raw: string): IRecentOpenedTarget | undefined {
    const parts = raw.split('|');

    const [target, attributes] = parts;

    // target and target type cannot be undefined or empty.
    if (!target || !attributes) {
        return undefined;
    }

    return Strings.jsonParseSafe<object>(attributes)
        .match<IRecentOpenedTarget | undefined>(
            attribute => {
                const type = attribute['targetType'];
                if (type !== 'directory' && type !== 'file') {
                    return undefined;
                }

                const isDir =  (type === 'directory') ? FileType.DIRECTORY : FileType.UNKNOWN;
                const isFile = (type === 'file')      ? FileType.FILE      : FileType.UNKNOWN;
                const isPinned = attribute['pinned'] === true;

                const lineNumber = attribute['gotoLine'];
                const parsedLine = Number(lineNumber);
                const gotoLine = !isNaN(parsedLine) && parsedLine > 0 ? parsedLine : undefined;

                return {
                    target: URI.fromFile(target),
                    targetType: isDir | isFile,
                    pinned: isPinned,
                    gotoLine: gotoLine,
                };
            }, 
            error => {
                ErrorHandler.onUnexpectedError(error);
                return undefined;
            }
        );
}

function __serialize(target: IRecentOpenedTarget): string {
    const type = target.targetType === FileType.DIRECTORY 
        ? 'directory' 
        : target.targetType === FileType.FILE 
            ? 'file' 
            : 'unknown';
    
    const attributes = {
        targetType: type,
        pinned: target.pinned,
        gotoLine: target.gotoLine,
    };

    const attributesRaw = Strings.stringifySafe(attributes, err => ErrorHandler.onUnexpectedError(err), undefined, '');
    const serialized = `${URI.toFsPath(target.target)}|${attributesRaw}`;

    return serialized;
}