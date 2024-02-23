import * as fs from 'fs';
import { panic } from "src/base/common/result";
import { IS_WINDOWS } from 'src/base/common/platform';
 
export const FileMode = {
 
    /** @readonly Corresponds to octal: 0o400 */
    readable: fs.constants.S_IRUSR,
 
    /** @readonly Corresponds to octal: 0o200 */
    writable: fs.constants.S_IWUSR,

    /** @readonly Corresponds to octal: 0o100 */
    executable: fs.constants.S_IXUSR,
 
    /** @readonly Constant for fs.access(). File is visible to the calling process. */
    visible: fs.constants.F_OK,
};

/**
 * @description Figures out if the `path` exists and is a file with support for 
 * symlinks.
 *
 * Note: this will return `false` for a symlink that exists on disk but is 
 * dangling (pointing to a nonexistent path).
 */
export async function fileExists(path: string): Promise<boolean> {
    try {
        const { stat, symbolicLink } = await statWithSymbolink(path);
        return stat.isFile() && symbolicLink?.dangling !== true;
    } catch {
        return false;
    }
}

/**
 * @description Figures out if the `path` exists and is a directory with support 
 * for symlinks.
 *
 * Note: this will return `false` for a symlink that exists on disk but is 
 * dangling (pointing to a nonexistent path).
 */
export async function directoryExists(path: string): Promise<boolean> {
    try {
        const { stat, symbolicLink } = await statWithSymbolink(path);
        return stat.isDirectory() && symbolicLink?.dangling !== true;
    } catch {
        return false;
    }
}

export interface IStatsWithSymbolink {

    /**
     * The stats of the file. If the file is a symbolic link, the stats will be 
     * of that target file and not the link itself. If the file is a symbolic 
     * link pointing to a non existing file, the stat will be of the link and
     * the `dangling` flag will indicate this.
     */
    stat: fs.Stats;

    /**
     * Will be provided if the resource is a symbolic link on disk. Use the 
     * `dangling` flag to find out if it points to a resource that does not 
     * exist on disk.
     */
    symbolicLink?: { dangling: boolean };
}

/**
 * @description Resolves the `fs.Stats` of the provided path. If the path is a
 * symbolic link, the `fs.Stats` will be from the target it points
 * to. If the target does not exist, `dangling: true` will be returned
 * as `symbolicLink` value.
 */
export async function statWithSymbolink(path: string): Promise<IStatsWithSymbolink> {

    // First stat the link
    let lstats: fs.Stats | undefined;
    try {
        lstats = await fs.promises.lstat(path);

        // Return early if the stat is not a symbolic link at all
        if (!lstats.isSymbolicLink()) {
            return { stat: lstats };
        }
    } catch (error) { /** ignore - use stat() instead */ }

    /**
     * If the stat is a symbolic link or failed to stat, use fs.stat() which for 
     * symbolic links will stat the target they point to.
     */
    try {
        const stats = await fs.promises.stat(path);
        return { 
            stat: stats, 
            symbolicLink: lstats?.isSymbolicLink() ? { dangling: false } : undefined,
        };
    } catch (error: any) {

        /**
         * If the link points to a nonexistent file we still want to return it 
         * as result while setting dangling: true flag.
         */
        if (error.code === 'ENOENT' && lstats) {
            return { stat: lstats, symbolicLink: { dangling: true } };
        }

        /**
         * Windows: workaround a node.js bug where reparse points are not 
         * supported (https://github.com/nodejs/node/issues/36790)
         */
        if (IS_WINDOWS && error.code === 'EACCES') {
            try {
                const stats = await fs.promises.stat(await fs.promises.readlink(path));
                return { stat: stats, symbolicLink: { dangling: false } };
            } 
            catch (error: any) {

                /**
                 * If the link points to a nonexistent file we still want to 
                 * return it as result while setting dangling: true flag.
                 */
                if (error.code === 'ENOENT' && lstats) {
                    return { stat: lstats, symbolicLink: { dangling: true } };
                }

                panic(error);
            }
        }

        panic(error);
    }
}