import { Abortable } from 'events';
import * as fs from 'fs';
import * as Path from 'path';
import { nameIncludeCheckWithRule, getFileType, pathJoin } from 'src/base/common/string';
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
    public plainText: string;
    
    public readonly type: FileType;

    constructor(baseName: string, plainText?: string) {
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

const defaultReadFileOpt: readMarkdownFileOption = {
    encoding: 'utf-8',
    flag: 'r'
};

/**
 * @description asynchronously reads a single .md file and stores the text into FileNode.
 */
export async function readMarkdownFile(
    nodeInfo: FileNode, 
    opt: readMarkdownFileOption = defaultReadFileOpt): Promise<void | string> 
{
    return new Promise((resolve, reject) => {
        
        if (!nodeInfo || nodeInfo.isFolder) {
            reject('given wrong nodeInfo or it is a folder');
        } else if (!isMarkdownFile(nodeInfo.baseName)) {
            reject('not a markdown file');
        }

        fs.readFile(nodeInfo.path, opt, (err, text: string) => {
            if (err) {
                reject(err);
            }
            nodeInfo.file!.plainText = text;
            resolve();
        });
    });
}

/**
 * @description synchronously reads .md file and stores the text into FileNode.
 * 
 * NOT RECOMMENDED TO USE THIS.
 */
 export function readMarkdownFileSync(
     nodeInfo: FileNode, 
     opt: readMarkdownFileOption): void 
{
    if (!nodeInfo || nodeInfo.isFolder) {
        throw 'given wrong nodeInfo or it is a folder';
    } else if (!isMarkdownFile(nodeInfo.baseName)) {
        // do log here
        return;
    }
    
    nodeInfo.file!.plainText = fs.readFileSync(nodeInfo.path, opt);
}

/**
 * @description asynchronously saves .md file.
 */
export async function saveMarkdownFile(
    nodeInfo: FileNode, 
    newPlainText: string): Promise<void> 
{
    return new Promise((resolve, reject) => {
        if (nodeInfo !== undefined && !nodeInfo.isFolder) {

            let writeOption: fs.WriteFileOptions = {
                encoding: 'utf-8',
                flag: 'w'
            };
    
            fs.writeFile(nodeInfo.path, newPlainText, writeOption, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        } else {
            reject('given wrong nodeInfo or it is a folder');
        }
    });
}

/**
 * @description asynchronously check the existance of given file in the given path.
 * 
 * @param path eg. D:\dev\AllNote
 */
export async function isFileExisted(
    path: string, 
    fileName: string): Promise<boolean>
{
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files: string[]) => {
            if (err) {
                reject(err);
            }

            files.forEach((file: string) => {
                if (file == fileName) {
                    resolve(true);
                }
            });
            resolve(false);
        });
    });
}

/**
 * @description asynchronously creates a file.
 * 
 * @param path eg. D:\dev\AllNote
 * @param fileName eg. log.json
 * @param content plainText ready to be written
 */
export async function createFile(
    path: string, 
    fileName: string, 
    content: string = ''): Promise<void> 
{
    return new Promise((resolve, reject) => {
        fs.writeFile(pathJoin(path, fileName), content, (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

/**
 * @description asynchronously reads the whole text from a general file.
 * 
 * @param path eg. D:\dev\AllNote
 */
 export async function readFromFile(
    path: string, 
    opt: readFileOption = defaultReadFileOpt): Promise<string>
{
    return new Promise((resolve, reject) => {
        fs.readFile(path, opt, (err, text: string) => {
            if (err) {
                reject(err);
            }
            resolve(text);
        });
    });
}

/**
 * @description synchronously reads the whole text from a general file.
 * 
 * @param path eg. D:\dev\AllNote
 */
 export function readFromFileSync(
    path: string, 
    opt: readFileOption = defaultReadFileOpt): string
{
    return fs.readFileSync(path, opt);
}


/**
 * @description asynchronously writes to a file.
 * 
 * @param path eg. D:\dev\AllNote
 * @param fileName eg. log.json
 * @param content plainText ready to be written
 */
export async function writeToFile(
    path: string, 
    fileName: string, 
    content: string): Promise<void> 
{
    return createFile(path, fileName, content);
}

/**
 * @description pass this function to JSON.stringify so that it is able to convert
 * native 'Map' type to JSON file.
 */
export function mapToJsonReplacer(key: any, value: any) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else {
      return value;
    }
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
 export async function createDir(
     path: string, 
     dirName: string): Promise<void> 
{
    return new Promise((resolve, reject) => {
        fs.mkdir(pathJoin(path, dirName), {recursive: true}, (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

/**
 * @description asynchronously check the existance of given directory in the given path.
 * 
 * @param path eg. D:\dev\AllNote
 * @param dirName eg. .mdnote
 */
 export async function isDirExisted(
     path: string, 
     dirName: string): Promise<boolean> 
{
    return isFileExisted(path, dirName);
}

/**
 * @description asynchronously read each noteBook information and returns 
 * them as an array of string.
 * 
 * NoteBookParser currently ONLY detect folder, ignores ALL the files. That is,
 * if you open a rootdir with a bunch of .md files, they won't be treated as
 * noteBook.
 * 
 * @param path the rootdir of all noteBooks, eg. D:\dev\AllNote
 * @param excludes array of folders/files to be excluded
 * @param includes array of folders/files to be included
 * @returns 
 */
export async function directoryNoteBookParser(
    path: string, 
    parserExcludeDir: string[] = [], 
    parserIncludeDir: string[] = []): Promise<string[]> 
{
    let acceptableTarget: string[] = [];
    return new Promise((resolve, reject) => {
        fs.readdir(path, {withFileTypes: true}, (err, dirEntries: fs.Dirent[]) => {
            if (err) {
                reject(err);
            }

            for (let dirEntry of dirEntries) {
                
                if (dirEntry.isDirectory()) {
                    
                    // ignores the excluded directory
                    if (!nameIncludeCheckWithRule(dirEntry.name, parserIncludeDir) && 
                        nameIncludeCheckWithRule(dirEntry.name, parserExcludeDir))
                    {
                        continue;
                    }
                    acceptableTarget.push(dirEntry.name);
                } else {
                    // currently, there is no need to parser file in the rootdir
                }
            };
            
            resolve(acceptableTarget);
        });
    })
} 