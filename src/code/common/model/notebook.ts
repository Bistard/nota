import { FileTree } from "src/base/node/fileTree";

/**
 * @class A class for each noteBook.
 */
export class NoteBook {

    public readonly noteBookName: string;
    public readonly noteBookDir: string;

    public readonly fileTree: FileTree;

    /**
     * @param name name of the notebook
     * @param path path to the root of the notebook
     */
    constructor(name: string, path: string) {
        this.noteBookName = name;
        this.noteBookDir = path;
        
        this.fileTree = new FileTree(path);
    }

    /**
     * @description synchronously building the whole notebook folder tree and
     * display it.
     * 
     * @param parent fileTree appends to this parent HTMLElement
     */
    public create(parent: HTMLElement): void {
        this.fileTree.create(parent);
    }

    /**
     * @description converts the whole file tree into JSON format.
     */
    public toJSON(): string {
        return JSON.stringify(this.fileTree.tree, this.__mapToJsonReplacer, 2);
    }

    /**
     * @description destroy the notebook instance.
     */
    public destory(): void {
        
    }

    /**
     * @description pass this function to JSON.stringify so that it is able to convert
     * native 'Map' type to JSON file.
     */
    private __mapToJsonReplacer(key: any, value: any) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else {
      return value;
    }
}

}