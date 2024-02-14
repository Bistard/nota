import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { URI } from "src/base/common/files/uri";
import { FuzzyScore } from "src/base/common/fuzzy";
import { Arrays } from "src/base/common/utilities/array";
import { Scheduler, delayFor } from "src/base/common/utilities/async";
import { Mutable } from "src/base/common/utilities/type";
import { FileItem } from "src/workbench/services/fileTree/fileItem";
import { IFileTree } from "src/workbench/services/fileTree/fileTree";
import { IFileService } from "src/platform/files/common/fileService";
import { ILogService } from "src/base/common/logger";
import { err, ok } from "src/base/common/result";
import { FileOperationErrorType } from "src/base/common/files/file";
import { Time } from "src/base/common/date";
import { IExplorerTreeService } from "src/workbench/services/explorerTree/treeService";
import { Disposable, IDisposable, toDisposable } from "src/base/common/dispose";

/**
 * @class A type of {@link IListDragAndDropProvider} to support drag and drop
 * for {@link FileTree}.
 */
export class FileItemDragAndDropProvider implements IListDragAndDropProvider<FileItem> {

    // [field]

    private readonly _tree!: IFileTree<FileItem, FuzzyScore>;

    private static readonly EXPAND_DELAY = Time.ms(500);
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
    ) {
        this._delayExpand = new Scheduler(FileItemDragAndDropProvider.EXPAND_DELAY, async event => {
            const { item } = event[0]!;
            await this._tree.expand(item);
            
            /**
             * @hack A brief pause to ensure the rendering triggered by the 
             * `expand` operation has fully completed.
             */
            await delayFor(Time.ms(10), () => this._tree.setHover(item, true));
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
        const isDroppable = this.__isDroppable(currentDragItems, targetOver);

        if (isDroppable) {
            this.__checkIfDropOnEntireTree(targetOver);
        }

        if (!targetOver || targetIndex === undefined) {
            return;
        }

        // the target is not collapsible (file)
        if (!this._tree.isCollapsible(targetOver)) {
            this._delayExpand.cancel(true);

            if (targetOver.parent && !targetOver.parent.isRoot() && isDroppable) {
                this._tree.setHover(targetOver.parent, true);
            }

            return;
        }

        // the target is collapsed thus it requies a delay of expanding
        if (this._tree.isCollapsed(targetOver) && isDroppable) {
            this._tree.setHover(targetOver, false);
            this._delayExpand.schedule({ item: targetOver, index: targetIndex }, true);
            return;
        }

        // the target is already expanded
        this._delayExpand.cancel(true);
        if (isDroppable) {
            this._tree.setHover(targetOver, true);
        }
    }

    public onDragLeave(event: DragEvent, currentDragItems: FileItem[], targetOver?: FileItem, targetIndex?: number): void {

        /**
         * Since the leaving target is not the tree. That means the user is 
         * dragging from outside.
         */
        if (event.target !== this._tree.DOMElement) {
            return;
        }

        if (!targetOver || targetIndex === undefined) {
            this._delayExpand.cancel(true);
            return;
        }
    }

    public onDragOver(event: DragEvent, currentDragItems: FileItem[], targetOver?: FileItem | undefined, targetIndex?: number | undefined): boolean {
        if (!targetOver || targetIndex === undefined) {
            this._delayExpand.cancel(true);
        }
        return true;
    }

    public async onDragDrop(event: DragEvent, currentDragItems: FileItem[], targetOver?: FileItem | undefined, targetIndex?: number | undefined): Promise<void> {
        if (!targetOver) {
            targetOver = this.explorerTreeService.rootItem!;
        }

        if (targetOver.isFile()) {
            targetOver = targetOver.parent!;
        }

        // TODO: var can be removed at TS 5.4 which has better TCFA
        const target = targetOver;
        const isDroppable = this.__isDroppable(currentDragItems, target);
        if (!isDroppable) {
            return;
        }

        // expand folder immediately when drops
        this._delayExpand.cancel(true);
        if (!target.isRoot()) {
            await this._tree.expand(target);
        }

        /**
         * Iterate every selecting items and try to move to the destination. If 
         * any existing files or folders found at the destination, a window will 
         * pop up and ask for user permission if to overwrite.
         */
        for (const dragItem of currentDragItems) {
            const destination = URI.join(target.uri, dragItem.name);
            await this.fileService.moveTo(dragItem.uri, destination)
                .map(() => {})
                .orElse(error => {
                    
                    if (error.code === FileOperationErrorType.FILE_EXISTS) {
                        // TODO: pop up a window for confirm about should we overwrite
                        this.logService.warn('target already exists at', URI.toString(destination));
                        return ok();
                    }
                    
                    return err(error);
                })
                .unwrap();
        }
        
        this.__removeDragSelections();
    }

    public onDragEnd(event: DragEvent): void {
        this._delayExpand.cancel(true);
        this._dragFeedbackDisposable.dispose();
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

    private __isDroppable(currentDragItems: FileItem[], targetOver?: FileItem): boolean {

        // dropping on no targets, meanning we are dropping at the parent.
        if (!targetOver) {
            targetOver = this.explorerTreeService.rootItem!;
        }

        /**
         * Since we are dropping to a file, it can be treated as essentially 
         * dropping at its parent directory.
         */
        if (targetOver.isFile()) {
            return this.__isDroppable(currentDragItems, targetOver.parent ?? undefined);
        }

        const targetDir = targetOver;

        // TODO: ctrl + win can drop at the parent
        // TODO: alt + mac can drop at the parent

        /**
         * Either following case cannot perform drop operation if one of the 
         * selecting item is:
         *  - dropping to itself.
         *  - dropping to its direct parent.
         *  - dropping to its child folder.
         */
        const anyCannotDrop = currentDragItems.some(dragItem => {
            const destination = URI.join(targetDir.uri, dragItem.name);
            return dragItem === targetDir
                || URI.equals(dragItem.uri, destination)
                || URI.isParentOf(targetDir.uri, dragItem.uri)
            ;
        });

        return !anyCannotDrop;
    }

    
    /**
     * @description Special handling: drop entire tree animation
     */
    private _dragFeedbackDisposable: IDisposable = Disposable.NONE;
    private __checkIfDropOnEntireTree(targetOver?: FileItem): boolean {
        this._dragFeedbackDisposable.dispose();

        const dropAtEmpty = !targetOver;
        const dropAtRootDirectChild = targetOver && targetOver.parent?.isRoot();
        const ensureTargetIsNotDir = targetOver && !this._tree.isCollapsible(targetOver);

        if (dropAtEmpty || (dropAtRootDirectChild && ensureTargetIsNotDir)) {
            this._tree.DOMElement.classList.add('on-drop-target');
            this._dragFeedbackDisposable = toDisposable(() => {
                this._tree.DOMElement.classList.remove('on-drop-target');
            });
            return true;
        }

        return false;   
    }
}
