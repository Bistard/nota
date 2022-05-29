import { FileType } from "src/base/common/file/file";
import { Iterable } from "src/base/common/util/iterable";

export const CHAR_DIR_SEPARATOR = '/';

/** @deprecated */
export function pathJoin(root: string, ...paths: string[]): string {
    let absolutePath = root;
    for (let path of paths) {
        if (path === '') {
            continue;
        }
        absolutePath += CHAR_DIR_SEPARATOR + path;
    }
    return absolutePath;
}

/** @deprecated */
export function isAbsolutePath(path: string): boolean {
    return !!path && path[0] === '/';
}

/** @deprecated */
export const enum SvgType {
    base = '',
    toolBar = 'toolBar',
}

/** @deprecated */
const BASE_PATH = './src/assets/svg/';

/** @deprecated */
export function getSvgPathByName(type: SvgType, name: string): string {
    return pathJoin(BASE_PATH, type, name + '.svg');
}

/** @deprecated */
/**
 * @description determines the type of the file given a name.
 * 
 * @param fileFullName such as 'markdown.md'
 */
export function getFileType(fileFullName: string): FileType {
    const index = fileFullName.lastIndexOf('.');
    if (index === undefined) {
        return FileType.UNKNOWN;
    } else if (fileFullName.slice(index) === '.md') {
        return FileType.FILE;
    }
    return FileType.DIRECTORY;
}

/**
 * @namespace String A collection of functions that relates to {@link string}.
 */
export namespace String {

    /**
     * @description Check if any of the given {@link RegExp} is applied to the
     * provided string.
     * @param str The provided string.
     * @param rules An array of {@link RegExp}.
     * @returns If any rules is applied.
     */
    export function regExp(str: string, rules: RegExp[]): boolean {
        return Iterable.reduce<RegExp, boolean>(rules, false, (tot, rule) => tot ? true : rule.test(str));
    }

}
