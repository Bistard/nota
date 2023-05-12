import * as fs from 'fs';
 
export const FileMode = {
 
    /** @readonly Corresponds to octal: 0o400 */
    readable: fs.constants.S_IRUSR,
 
    /** @readonly Corresponds to octal: 0o200 */
    writable: fs.constants.S_IWUSR,

    /** @readonly Corresponds to octal: 0o100 */
    executable: fs.constants.S_IXUSR,
 
    /** @readonly Constant for fs.access(). File is visible to the calling process. */
    visible: fs.constants.F_OK,
 }

/**
 * @description Check the existance of the file in the given path.
 */
export function fileExists(path: string): boolean {
    try {
        fs.accessSync(path, FileMode.visible);
        return true;
    } catch {
        return false;
    }
}
