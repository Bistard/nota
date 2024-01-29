import { IDisposable } from "src/base/common/dispose";
import { AsyncResult } from "src/base/common/error";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IService } from "src/platform/instantiation/common/decorator";
import { FileItem } from "src/workbench/services/fileTree/fileItem";
import { IFileTreeOpenEvent } from "src/workbench/services/fileTree/fileTree";

export const enum TreeMode {
    Classic = 'classic',
}

/**
 * The base interface for any tree services.
 */
export interface ITreeService<T extends FileItem> extends IDisposable, IService {
    /**
     * The parent container of the current tree view. `undefined` if the tree is 
     * not opened yet.
     */
    readonly container: HTMLElement | undefined;

    /**
     * The root directory of the current tree. `undefined` if the tree is not 
     * opened yet.
     */
    readonly root: URI | undefined;

    /**
     * Determine if the explorer tree is opened right now.
     */
    readonly isOpened: boolean;

    /**
     * Fires when a file / folder is selected (not opened yet).
     */
    onSelect: Register<IFileTreeOpenEvent<T>>;

    /**
     * // TODO
     */
    init(container: HTMLElement, root: URI, mode?: TreeMode): AsyncResult<void, Error>;

    /**
     * @description Given the height, re-layouts the height of the whole tree.
     * @param height The given height.
     * @note If no values are provided, it will sets to the height of the 
     * corresponding DOM element of the parent view.
     */
    layout(height?: number): void;
 
    /**
     * @description Refresh the current tree view.
     */
    refresh(data?: T): Promise<void>;

    /**
     * // TODO
     */
    close(): Promise<void>;
}