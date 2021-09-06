import { FileType } from "src/base/node/io";

export const CHAR_DIR_SEPARATOR = '/';

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

export enum SvgType {
    base = '',
    toolBar = 'toolBar',
}

const BASE_PATH = './src/assets/svg/';

export function getSvgPathByName(type: SvgType, name: string): string {
    return pathJoin(BASE_PATH, type, name + '.svg');
}

/**
 * @description determines the type of the file given a name.
 * 
 * @param fileFullName such as 'markdown.md'
 */
export function getFileType(fileFullName: string): FileType {
    const index = fileFullName.lastIndexOf('.');
    if (index === undefined) {
        return FileType.OTHERS;
    } else if (fileFullName.slice(index) === '.md') {
        return FileType.MARKDOWN;
    }
    return FileType.OTHERS;
}

/**
 * @description check if the given name is included in the given array of rules.
 * These are the different types of rules:
 *  - exact name                         eg. '.vscode'
 *  - name starts with given strings     eg. '.*' means any name starts with '.'
 *  - name ends with given strings       eg. '*-module' means any name ends '-module'
 * 
 * @param name directory or file to be checked (filename could have format type)
 * @param rules rules to be applied to 'name'
 */
export function nameIncludeCheckWithRule(name: string, rules: string[]): boolean {
    
    for (let rule of rules) {
        
        let asteriskFound = false;
        let prefix = '';
        let postfix = '';

        for (let i = 0; i < rule.length; i++) {
            const char = rule[i];
            if (char !== '*') {
                if (!asteriskFound) {
                    prefix += char;
                } else {
                    postfix += char;
                }
            } else {
                asteriskFound = true;
                if (i + 1 !== rule.length && i !== 0) {
                    throw 'wrong rules is applied to be included';
                }
            }
        }

        if (!asteriskFound) {
            if (name == rule) {
                return true;
            }
        } else {
            if (prefix != '' && name.startsWith(prefix)) {
                return true;
            } else if (postfix != '' && name.endsWith(postfix)) {
                return true;
            }
        }
    }
    return false;
}

