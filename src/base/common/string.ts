import { FileType } from "src/base/node/file";

// TODO: this 'BASE_PATH' could be auto defined using 'Path' nodeJS API;
const BASE_PATH = './src/assets/svg/';

export function getSvgPathByName(name: string): string {
    return BASE_PATH + name + '.svg';
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