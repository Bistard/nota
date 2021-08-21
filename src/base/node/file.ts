import { Abortable } from 'events';
import * as fs from 'fs';
import * as Path from 'path';
import { getFileType } from 'src/base/common/string';
import { FileNode } from 'src/base/node/fileTree';

export const CHAR_DIR_SEPARATOR = '/';

/*******************************************************************************
 *                              file related code
 ******************************************************************************/

export function isMarkdownFile(filename: string): boolean {
    return getFileType(filename) === FileType.MARKDOWN;
}

export enum FileType {
    MARKDOWN,
    OTHERS,
}

export class MarkdownFile {

    public readonly path: string;
    public readonly name: string;
    public readonly baseName: string;
    public plainText: string;
    
    public readonly type: FileType;

    constructor(path: string,
                name: string,
                baseName: string,
                plainText?: string
    ) {
        this.path = path;
        this.name = name;
        this.baseName = baseName;
        this.plainText = plainText || '';

        this.type = getFileType(baseName);
    }

}

export type readFileOption = 
    | ({
        encoding: BufferEncoding;
        flag?: string | undefined;
    } & Abortable)
    | BufferEncoding;

export type readMarkdownFileOption = readFileOption;

/**
 * @description asynchronously reads a single .md file and stores the text into FileNode.
 */
export async function readMarkdownFile(nodeInfo: FileNode, opt: readMarkdownFileOption): Promise<void | NodeJS.ErrnoException | string> {
    return new Promise((resolve, reject) => {
        if (!nodeInfo) {
            reject('wrong given nodeInfo');
        } else if (!isMarkdownFile(nodeInfo.file.baseName)) {
            reject('not markdown file');
        }

        fs.readFile(nodeInfo.file.path, opt, (err, text: string) => {
            if (err) {
                reject(err);
            }
            nodeInfo.file.plainText = text;
            resolve();
        });
    })
}

/**
 * @description synchronously reads .md file and stores the text into FileNode.
 * 
 * NOT RECOMMENDED TO USE THIS.
 */
 export function readMarkdownFileSync(nodeInfo: FileNode, opt: readMarkdownFileOption): void {
    if (!nodeInfo) {
        throw 'read .md file error';
    } else if (!isMarkdownFile(nodeInfo.file.baseName)) {
        // do log here
        return;
    }
    
    nodeInfo.file.plainText = fs.readFileSync(nodeInfo.file.path, opt);
}

/**
 * @description asynchronously saves .md file.
 */
export async function saveMarkdownFile(nodeInfo: FileNode, newPlainText: string): Promise<void | NodeJS.ErrnoException> 
{
    return new Promise((resolve, reject) => {
        if (nodeInfo !== undefined) {

            let writeOption: fs.WriteFileOptions = {
                encoding: 'utf-8',
                flag: 'w'
            };
    
            fs.writeFile(nodeInfo.file.path, newPlainText, writeOption, (err) => {
                if (err) {
                    reject(err);
                }
                console.log('auto saved');
                resolve();
            });
        } else {
            console.log('auto saved but undefined');
            resolve();
        }
    })
}

/**
 * @description asynchronously check the existance of given file in the given path.
 * 
 * @param path eg. D:\dev\AllNote
 */
export async function isFileExisted(path: string, fileName: string): Promise<boolean | NodeJS.ErrnoException> {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files: string[]) => {
            if (err) {
                reject(err);
            }

            files.forEach((file: string) => {
                if (file == fileName) {
                    resolve(true);
                }
            })
            resolve(false);
        })
    })
}

/**
 * @description asynchronously creates a file.
 * 
 * @param path eg. D:\dev\AllNote
 * @param fileName eg. log.json
 * @param content plainText ready to be written
 */
export async function createFile(path: string, fileName: string, content?: string): Promise<void | NodeJS.ErrnoException> {
    return new Promise((resolve, reject) => {
        // write an empty content to the file
        let text = content === undefined ? '' : content;
        fs.writeFile(path + CHAR_DIR_SEPARATOR + fileName, text, (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        })
    })
}

/**
 * @description asynchronously reads the whole text from a general file.
 */
 export function readFromFile(
    path:string, 
    opt: readFileOption, 
    callback: (err: NodeJS.ErrnoException | null, data: string) => void
): void 
{
    fs.readFile(path, opt, callback);
}

/**
 * @description asynchronously writes to a file.
 * 
 * @param path eg. D:\dev\AllNote
 * @param fileName eg. log.json
 * @param content plainText ready to be written
 */
export async function writeToFile(path: string, fileName: string, content: string): Promise<void | NodeJS.ErrnoException> 
{
    return createFile(path, fileName, content);
}

/*******************************************************************************
 *                            directory related code
 ******************************************************************************/

/**
 * @description asynchronously creates a directory.
 * 
 * @param path eg. D:\dev\AllNote
 * @param dirName eg. .mdnote
 */
 export async function createDir(path: string, dirName: string): Promise<void | NodeJS.ErrnoException> {
    return new Promise((resolve, reject) => {
        fs.mkdir(path + CHAR_DIR_SEPARATOR + dirName, {recursive: true}, (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        })
    })
}

/**
 * @description asynchronously check the existance of given directory in the given path.
 * 
 * @param path eg. D:\dev\AllNote
 * @param dirName eg. .mdnote
 */
 export async function isDirExisted(path: string, dirName: string): Promise<boolean | NodeJS.ErrnoException> {
    return isFileExisted(path, dirName);
}
