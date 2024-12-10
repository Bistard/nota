import { IDisposable } from "src/base/common/dispose";
import { AsyncResult } from "src/base/common/result";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IService, createService, renameDecorator } from "src/platform/instantiation/common/decorator";
import { FileItem } from "src/workbench/services/fileTree/fileItem";
import { IFileTreeOpenEvent } from "src/workbench/services/fileTree/fileTree";
import { FileSortOrder, FileSortType } from "src/workbench/services/fileTree/fileTreeSorter";
import { FileOperationError } from "src/base/common/files/file";
import { OrderChangeType } from "src/workbench/services/fileTree/fileTreeMetadataController";

export const IFileTreeService = createService<IFileTreeService>('file-tree-service');
export const IFileTreeMetadataService = renameDecorator<IFileTreeService, IFileTreeMetadataService>(IFileTreeService);

/**
 * The interface only for {@link FileTreeService}.
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
     * @note Can be reinitialized after 'close()'. Cannot 'init()' twice in a row.
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
     * @description Freezes the file tree state, preventing any refresh actions. 
     * Any attempts to refresh will be deferred until the next 'resume' action 
     * is invoked.
     */
    freeze(): void;

    /**
     * @description Resumes the file tree state, allowing refresh actions to 
     * proceed. This will execute any refresh actions that were deferred while 
     * the file tree was frozen.
     */
    unfreeze(): void;

    /**
     * @description Expands to the tree node with the given data.
     * @param data The data representation of the node.
     * @param recursive Determines if the operation is recursive (same operation 
     *                  to its descendants). if not provided, sets to false as 
     *                  default.
     * @returns If the operation succeeded. Await to ensure the operation is done.
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
     * @returns If the operation succeeded. Await to ensure the operation is done.
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
     * @description Try to find the item by the given URI. If the item is not
     * shown in the tree, an undefined will return.
     * @param uri The uri for finding item.
     */
    findItem(uri: URI): FileItem | undefined;

    /**
     * @description Returns the rendering index of the item with the given item.
     * @param item The item in the tree.
     */
    getItemIndex(item: FileItem): number;

    /**
     * @description Returns the item at given index.
     * @param index The index of the item.
     * @panic If the index is invalid.
     */
    getItemByIndex(index: number): FileItem;

    /**
     * @description Determines if the given item is visible (is rendered).
     * @param item The item in the tree.
     * @panic If the location is not found.
     */
    isItemVisible(item: FileItem): boolean;

    /**
     * @description Determines if the given item is collapsible.
     * @param item The item in the tree.
     * @panic If the item is not found.
     */
    isCollapsible(item: FileItem): boolean;

    /**
     * @description Determines if the given item is collapsed.
     * @param item The item in the tree.
     * @returns If it is collapsed.
     * @panic If the item is not found or the item is not collapsible.
     */
    isCollapsed(item: FileItem): boolean;

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

    /**
     * @description Sets the given item as focused.
     */
    setFocus(item: FileItem | null): void;
    
    /**
     * @description Sets the given item as anchor.
     */
    setAnchor(item: FileItem): void;

    /**
     * @description Sets the given a series of items as selected.
     */
    setSelections(items: FileItem[]): void;

    /**
     * @description Sets the given item as hovered.
     * @param item The item to be hovered. If null, means to clean all the 
     *             current hovers.
     * @param recursive When sets to true, the visible children of that item 
     *                  will also be hovered.
     */
    setHover(item: null): void;
    setHover(item: FileItem, recursive: boolean): void;

    /**
     * @description Visually highlight the files have been selected for cutting.
     */
    highlightSelectionAsCut(items: FileItem[]): Promise<void>;

    /**
     * @description Visually highlight the files have been selected for copy.
     */
    highlightSelectionAsCopy(items: FileItem[]): Promise<void>;

    /**
     * @description This method will not visually highlight the files, but
     * programmatically set the status as cut or copy.
     * @param isCutOrCopy Is file tree in the state of cut or copy. True means
     *                    cut, false means copy.
     */
    simulateSelectionCutOrCopy(isCutOrCopy: boolean): void;

    /**
     * @description Retrieves the current sorting type applied to the file tree. 
     * This type is used for arranging files.
     */
    getFileSortingType(): FileSortType;
    
    /**
     * @description Fetches the current sorting order of the file tree, whether 
     * files are sorted in ascending or descending order.
     */
    getFileSortingOrder(): FileSortOrder;

    /**
     * @description Apply the new sorting strategy to the file tree.
     * @param type The type of the sorting.
     * @param order The ordering of the sorting.
     * @note This will not trigger rerendering.
     */
    setFileSorting(type: FileSortType, order: FileSortOrder): Promise<boolean>;

    /**
     * Get recent opened file tree folders' paths
     */
    getRecentPaths(): Promise<string[]>;
}

/**
 * The interface only for {@link FileTreeService}.
 */
export interface IFileTreeMetadataService extends IDisposable, IService {

    /**
     * @description If the metadata of the corresponding directory exists in the
     * file system.
     * @param dirUri The directory URI.
     * 
     * @note Make sure the provided URI is indeed a directory.
     */
    isDirectoryMetadataExist(dirUri: URI): AsyncResult<boolean, Error | FileOperationError>;

    /**
     * @description When moving or copying a directory, its corresponding 
     * metadata file must also be updated.
     * @param oldDirUri The directory has changed.
     * @param destination The new destination of the directory.
     * @param cutOrCopy True means cut, false means copy.
     * 
     * @note If oldDirUri has no metadata file before, no operations is taken.
     */
    updateDirectoryMetadata(oldDirUri: URI, destination: URI, cutOrCopy: boolean): AsyncResult<void, Error | FileOperationError>;

    /**
     * @description Modifies the metadata based on the specified change type, 
     * such as adding, removing, updating, or swapping items in the custom order.
     * 
     * @param type The type of change to apply to the order metadata.
     * @param item The file tree item that is subject to the change.
     * @param index1 For 'Add' and 'Update', this is the index where the item is 
     *               added or updated. For 'Remove', it's the index of the item 
     *               to remove, and it's optional. For 'Swap', it's the index of 
     *               the first item to be swapped.
     * @param index2 For 'Swap', this is the index of the second item to be 
     *               swapped with the first. Not used for other change types.
     * 
     * @panic when missing the provided index1 or index2.
     */
    updateCustomSortingMetadata(type: OrderChangeType.Add   , item: FileItem, index1:  number                ): AsyncResult<void, FileOperationError | Error>;
    updateCustomSortingMetadata(type: OrderChangeType.Remove, item: FileItem, index1?: number                ): AsyncResult<void, FileOperationError | Error>;
    updateCustomSortingMetadata(type: OrderChangeType.Update, item: FileItem, index1:  number                ): AsyncResult<void, FileOperationError | Error>;
    updateCustomSortingMetadata(type: OrderChangeType.Swap  , item: FileItem, index1:  number, index2: number): AsyncResult<void, FileOperationError | Error>;

    /**
     * @description This method provides a way to programmatically update the 
     * custom sorting metadata (the rendering order) of the file tree. The 
     * changes can include adding new items, updating existing items, or 
     * removing items to change the rendering orders. 
     * 
     * @note It is only useful when the file tree is set to use custom sorting 
     *       ({@link FileSortType} is 'custom'). 
     * 
     * @note It's important to note that this method:
     *  - operates directly on the metadata that influences the visual order of 
     *      items in the file tree, 
     *  - but DOES NOT move or modify the actual file or folder items on the 
     *      disk.
     *  - this method does not trigger rerendering, the effect will be shown on
     *      the NEXT rendering.
     * 
     * @note This method directly manipulates the in-memory representation of 
     * the custom sorting metadata and then save these changes to disk. 
     *  - It is designed to be efficient by batching updates and minimizing disk 
     *      operations. 
     * 
     * @note For 'Add' and 'Update' operations, the length of 'indice' must 
     *  match the length of the 'items'. 
     * 
     * @param type The type of change to apply to the metadata.
     * @param items For 'Add' and 'Update', an array of items involved in the 
     *              batch change.
     * @param parent For 'Remove' and 'Move' types, specifies the parent 
     *                  metadata from which items are removed or moved.
     * @param indice For 'Add' and 'Update', specifies the indices where items 
     *                  are added or updated.
     *               For 'Remove', specifies the indices of items to remove.
     *               For 'Move', specifies the current indices of items to move.
     * @param destination Only for 'Move' type, specifies the new index within 
     *              the parent metadata where the items should be moved to. 
     *              Items retain their original order during the move.
     */
    updateCustomSortingMetadataLot(type: OrderChangeType.Add   , parent: URI, items: string[], indice:  number[]): AsyncResult<void, FileOperationError | Error>;
    updateCustomSortingMetadataLot(type: OrderChangeType.Update, parent: URI, items: string[], indice:  number[]): AsyncResult<void, FileOperationError | Error>;
    updateCustomSortingMetadataLot(type: OrderChangeType.Remove, parent: URI, items: null,     indice:  number[]): AsyncResult<void, FileOperationError | Error>;
    updateCustomSortingMetadataLot(type: OrderChangeType.Move,   parent: URI, items: null,     indice:  number[], destination: number): AsyncResult<void, FileOperationError | Error>;
}