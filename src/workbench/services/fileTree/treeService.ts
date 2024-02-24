import { IDisposable } from "src/base/common/dispose";
import { AsyncResult } from "src/base/common/result";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { FileItem } from "src/workbench/services/fileTree/fileItem";
import { IFileTreeOpenEvent } from "src/workbench/services/fileTree/fileTree";

export const IFileTreeService = createService<IFileTreeService>('file-tree-service');

/**
 * The base interface for any tree services.
 */
export interface IFileTreeService extends IDisposable, IService {
    
    /**
     * The parent container of the current tree view.
     * `undefined` if the tree is not opened yet.
     */
    readonly container: HTMLElement | undefined;

    /**
     * The root URI of directory of the current tree. 
     * `undefined` if the tree is not opened yet.
     */
    readonly root: URI | undefined;

    /**
     * The root directory of the current tree.
     * `undefined` if the tree is not opened yet.
     */
    readonly rootItem: FileItem | undefined;

    /**
     * Determine if the explorer tree is opened right now.
     */
    readonly isOpened: boolean;

    /**
     * Event fires when the file tree is focused (true) or blurred (false).
     */
    readonly onDidChangeFocus: Register<boolean>;

    /**
     * Event fires when the file tree is initialized (true) or closed (false).
     */
    readonly onDidInitOrClose: Register<boolean>;

    /**
     * Fires when a file / folder is selected (not opened yet).
     */
    onSelect: Register<IFileTreeOpenEvent<FileItem>>;

    /**
     * @description Initialize the file tree and render it by the given root.
     * @param container The root container to render the file tree.
     * @param root The root URI for the file tree to render.
     * 
     * @note Can be reintialized after 'close()'. Cannot 'init()' twice in a row.
     */
    init(container: HTMLElement, root: URI): AsyncResult<void, Error>;

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
    refresh(data?: FileItem): Promise<void>;

    /**
     * @description Expands to the tree node with the given data.
     * @param data The data representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     * @returns If the operation successed. Await to ensure the operation is done.
     * 
     * @note Since expanding meaning potential refreshing to the latest children 
     * nodes, thus asynchronous is required.
     */
    expand(data: FileItem, recursive?: boolean): Promise<void>;

    /**
     * @description Toggles the state of collapse or expand to the tree node with
     * the given data.
     * @param data The data representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     * @returns If the operation successed. Await to ensure the operation is done.
     * 
     * @note Since expanding meaning refreshing to the updated children nodes,
     * asynchronous is required.
     */
    toggleCollapseOrExpand(data: FileItem, recursive?: boolean): Promise<void>;

    /**
     * @description Expands all the tree nodes.
     */
    expandAll(): Promise<void>;

    /**
     * @description Collapses all the tree nodes.
     */
    collapseAll(): Promise<void>;

    /**
     * @description Visually highlight the files have been selected for cutting.
     */
    highlightSelectionAsCut(items: FileItem[]): Promise<void>;

    /**
     * @description Visually highlight the files have been selected for copy.
     */
    highlightSelectionAsCopy(items: FileItem[]): Promise<void>;

    /**
     * @description Unrendering and disposing all the tree data. Does not mean
     * the service is disposed. The service may be reinitialized again after
     * closed.
     */
    close(): Promise<void>;

    /**
     * @description Returns the focused item in the view perspective.
     * @note The traits that is invisible will not be counted.
     */
    getFocus(): FileItem | null;
    
    /**
     * @description Returns the anchor item in the view perspective.
     * @note The traits that is invisible will not be counted.
     */
    getAnchor(): FileItem | null;
    
    /**
     * @description Returns the selected items in the view perspective.
     * @note The traits that is invisible will not be counted.
     */
    getSelections(): FileItem[];
    
    /**
     * @description Returns the hovered items in the view perspective.
     * @note The traits that is invisible will not be counted.
     */
    getHover(): FileItem[];
}
