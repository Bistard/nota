import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";

export const enum TreeMode {
    Classic = 'classic',
    Notebook = 'notebook',
}

/**
 * The base interface for any tree services.
 */
export interface ITreeService<T> extends IDisposable {
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
     * Fires when a file / page is clicked (not opened yet).
     */
    onDidClick: Register<any>; // TODO

    /**
     * // TODO
     */
    init(container: HTMLElement, root: URI, mode?: TreeMode): Promise<void>;

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