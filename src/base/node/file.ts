import { Abortable } from 'events';
import * as fs from 'fs';
import * as Path from 'path';
import { getFileType } from 'src/base/common/string';
import { TreeNode } from 'src/base/node/foldertree';

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
 * @description asynchronously reads the whole text from a general file.
 */
export function readFile(
    path:string, 
    opt: readFileOption, 
    callback: (err: NodeJS.ErrnoException | null, data: string) => void
): void 
{
    fs.readFile(path, opt, callback);
}

/**
 * @description asynchronously reads a single .md file and stores the text into TreeNode.
 */
export async function readMarkdownFile(nodeInfo: TreeNode, opt: readMarkdownFileOption): Promise<void> {
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
 * @description synchronously reads .md file and stores the text into TreeNode.
 * 
 * NOT RECOMMENDED TO USE THIS.
 */
 export function readMarkdownFileSync(nodeInfo: TreeNode, opt: readMarkdownFileOption): void {
    if (!nodeInfo) {
        throw 'read .md file error';
    } else if (!isMarkdownFile(nodeInfo.file.baseName)) {
        // do log here
        return;
    }
    
    nodeInfo.file.plainText = fs.readFileSync(nodeInfo.file.path, opt);
}