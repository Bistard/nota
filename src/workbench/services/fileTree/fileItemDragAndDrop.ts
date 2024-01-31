import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { URI } from "src/base/common/files/uri";
import { FuzzyScore } from "src/base/common/fuzzy";
import { Arrays } from "src/base/common/utilities/array";
import { Scheduler } from "src/base/common/utilities/async";
import { Mutable } from "src/base/common/utilities/type";
import { FileItem } from "src/workbench/services/fileTree/fileItem";
import { IFileTree } from "src/workbench/services/fileTree/fileTree";
import { IFileService } from "src/platform/files/common/fileService";
import { ILogService } from "src/base/common/logger";
import { err, ok } from "src/base/common/error";
import { FileOperationErrorType } from "src/base/common/files/file";
import { Time, TimeUnit } from "src/base/common/date";
import { IExplorerTreeService } from "src/workbench/services/explorerTree/treeService";
import { INotificationService } from "../notification/notificationService";

/**
 * @class A type of {@link IListDragAndDropProvider} to support drag and drop
 * for {@link FileTree}.
 */
export class FileItemDragAndDropProvider implements IListDragAndDropProvider<FileItem> {

    // [field]

    private readonly _tree!: IFileTree<FileItem, FuzzyScore>;

    private static readonly EXPAND_DELAY = new Time(TimeUnit.Milliseconds, 600);
    private readonly _delayExpand: Scheduler<{ item: FileItem, index: number; }>;
    /**
     * When dragging over an item, this array is a temporary place to store the 
     * hoving subtree items. Used for unselecting them when the drag is over.
     */
    private _dragSelections: FileItem[] = [];

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IExplorerTreeService private readonly explorerTreeService: IExplorerTreeService,
        @INotificationService private readonly notificationService: INotificationService,
    ) {
        this.notificationService = notificationService; 
        this._delayExpand = new Scheduler(FileItemDragAndDropProvider.EXPAND_DELAY, async event => {
            const { item, index } = event[0]!;
            await this._tree.expand(item);
            this._dragSelections = this._tree.selectRecursive(item, index);
        });
    }

    // [public methods]

    public getDragData(item: FileItem): string | null {
        return URI.toString(item.uri);
    }

    public getDragTag(items: FileItem[]): string {
        if (items.length === 1) {
            return items[0]!.name;
        }
        return String(`${items.length} selections`);
    }

    public onDragStart(event: DragEvent): void {

    }

    public onDragEnter(event: DragEvent, currentDragItems: FileItem[], targetOver?: FileItem, targetIndex?: number): void {
        if (!targetOver || !targetIndex) {
            return;
        }

        // simulate hover effect
        this._tree.setSelections([targetOver]);

        // the target is not collapsible
        if (!this._tree.isCollapsible(targetOver)) {
            this._delayExpand.cancel(true);
            return;
        }

        // the target is collapsed thus it requies a delay of expanding
        if (this._tree.isCollapsed(targetOver)) {
            this._delayExpand.schedule({ item: targetOver, index: targetIndex }, true);
            return;
        }

        // the target is already expanded, select it immediately.
        this._delayExpand.cancel(true);
        this._dragSelections = this._tree.selectRecursive(targetOver, targetIndex);
    }

    public onDragLeave(event: DragEvent, currentDragItems: FileItem[], targetOver?: FileItem, targetIndex?: number): void {

        /**
         * Since the leaving target is not the tree. That means the user is 
         * dragging from outside.
         */
        if (event.target !== this._tree.DOMElement) {
            return;
        }

        if (!targetOver || !targetIndex) {
            this.__removeDragSelections();
            this._delayExpand.cancel(true);
            return;
        }
    }

    public onDragOver(event: DragEvent, currentDragItems: FileItem[], targetOver?: FileItem | undefined, targetIndex?: number | undefined): boolean {
        if (!targetOver || !targetIndex) {
            this.__removeDragSelections();
            this._delayExpand.cancel(true);
        }
        return true;
    }

    public async onDragDrop(event: DragEvent, currentDragItems: FileItem[], targetOver?: FileItem | undefined, targetIndex?: number | undefined): Promise<void> {

        // dropping on no targets, meanning we are dropping at the parent.
        if (!targetOver) {
            targetOver = this.explorerTreeService.rootItem!;
        }

        // dropping on files does nothing for now
        if (targetOver.isFile()) {
            return;
        }

        const target = targetOver;

        /**
         * Either following case cannot perform drop operation if one of the 
         * selecting item is:
         *  - dropping to itself.
         *  - dropping to its direct parent.
         *  - dropping to its child folder.
         */
        const anyCannotDrop = currentDragItems.some(dragItem => {
            const destination = URI.join(target.uri, dragItem.name);
            return dragItem === target
                || URI.equals(dragItem.uri, destination)
                || URI.isParentOf(target.uri, dragItem.uri)
            ;
        });

        if (anyCannotDrop) {
            return;
        }

        // expand folder immediately when drops
        this._delayExpand.cancel(true);
        await this._tree.expand(target);

        /**
         * Iterate every selecting items and try to move to the destination. If 
         * any existing files or folders found at the destination, a window will 
         * pop up and ask for user permission if to overwrite.
         */
        for (const dragItem of currentDragItems) {
            console.log("loop", dragItem.id);
            const destination = URI.join(targetOver.uri, dragItem.name);
            await this.fileService.moveTo(dragItem.uri, destination)
                .map(() => {})
                .orElse(async (error) => {
                    if (error.code === FileOperationErrorType.FILE_EXISTS) {
                        this.logService.warn('target already exists at', URI.toString(destination));
                        const shouldOverwrite = await this.notificationService.confirm(
                            'Overwrite Warning',
                            `An item named ${dragItem.name} already exists in this location. Do you want to replace it with the one you're moving?`
                        );
                        if (shouldOverwrite) {
                            // Use moveTo with overwrite set to true to overwrite the file
                            await this.fileService.moveTo(dragItem.uri, destination, true)
                                .then(() => ok(), (moveError) => err(moveError)); // Handle the result of moveTo
                            return;
                        } else {
                            throw new Error('Overwrite cancelled by user');
                        }
                    }
                    throw error;
                })
                .unwrap();
        }
        
        this.__removeDragSelections();
    }

    public onDragEnd(event: DragEvent): void {
        this._delayExpand.cancel(true);
        this.__removeDragSelections();
    }

    // [public helper methods]

    public bindWithTree(tree: IFileTree<FileItem, FuzzyScore>): void {
        (<Mutable<typeof tree>>this._tree) = tree;
    }

    // [private helper methods]

    private __removeDragSelections(): void {
        if (this._dragSelections.length === 0) {
            return;
        }

        const currSelections = this._tree.getSelections();
        const updatedSelections = Arrays.relativeComplement(this._dragSelections, currSelections);

        this._tree.setSelections(updatedSelections);
        this._dragSelections = [];
    }
}
