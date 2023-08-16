import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ITreeService, TreeMode } from "src/workbench/services/explorerTree/treeService";

export interface INotebookTreeService extends ITreeService<any> {

}

/**
 * // TODO
 */
export class NotebookTreeService extends Disposable implements INotebookTreeService {

    declare _serviceMarker: undefined;

    // [event]

    get onSelect(): Register<any> {
        return undefined!;
    }

    // [field]

    get container(): HTMLElement | undefined {
        return undefined;
    }
    get root(): URI | undefined {
        return undefined;
    }

    get isOpened(): boolean {
        return false;
    }

    // [constructor]

    constructor() {
        super();
    }

    // [public methods]

    public async init(container: HTMLElement, root: URI, mode?: TreeMode | undefined): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public layout(height?: number | undefined): void {
        throw new Error("Method not implemented.");
    }
    public async refresh(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public async close(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}