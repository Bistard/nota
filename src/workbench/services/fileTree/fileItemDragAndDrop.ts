import { IDragOverResult, IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { URI } from "src/base/common/files/uri";
import { FuzzyScore } from "src/base/common/fuzzy";
import { Scheduler, delayFor } from "src/base/common/utilities/async";
import { Mutable } from "src/base/common/utilities/type";
import { FileItem } from "src/workbench/services/fileTree/fileItem";
import { IFileTree } from "src/workbench/services/fileTree/fileTree";
import { IFileService } from "src/platform/files/common/fileService";
import { ILogService } from "src/base/common/logger";
import { panic } from "src/base/common/result";
import { FileOperationErrorType } from "src/base/common/files/file";
import { Time } from "src/base/common/date";
import { IExplorerTreeService } from "src/workbench/services/explorerTree/treeService";
import { Disposable, IDisposable, toDisposable } from "src/base/common/dispose";
import { INotificationService } from "src/workbench/services/notification/notificationService";
import { DomUtility } from "src/base/browser/basic/dom";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { SideViewConfiguration } from "src/workbench/parts/sideView/configuration.register";
import { FileSortType } from "src/workbench/services/fileTree/fileTreeSorter";
import { Reactivator } from "src/base/common/utilities/function";
import { ICoordinate } from "src/base/common/utilities/size";

/**
 * @class A type of {@link IListDragAndDropProvider} to support drag and drop
 * for {@link FileTree}.
 */
export class FileItemDragAndDropProvider extends Disposable implements IListDragAndDropProvider<FileItem> {

    // [field]

    private readonly _tree!: IFileTree<FileItem, FuzzyScore>;

    private static readonly EXPAND_DELAY = Time.ms(500);
    private readonly _delayExpand: Scheduler<{ item: FileItem, index: number; }>;

    /**
     * Used to detect if 'onDragOver' is hovering on the same position, to avoid
     * duplicate calculations.
     */
    private readonly _prevDragOverState: ICoordinate & { handleByRowInsertion: boolean, isDroppable: boolean };

    private readonly _hoverHandler: Reactivator;
    private _insertionIndicator?: RowInsertionIndicator;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IExplorerTreeService private readonly explorerTreeService: IExplorerTreeService,
        @INotificationService private readonly notificationService: INotificationService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
    ) {
        super();

        this._prevDragOverState = { x: -1, y: -1, handleByRowInsertion: false, isDroppable: true };
        this._hoverHandler = new Reactivator();
        this.__initRowInsertion();

        this._delayExpand = this.__register(
            new Scheduler(FileItemDragAndDropProvider.EXPAND_DELAY, async event => {
                const { item } = event[0]!;
                await this._tree.expand(item);
                
                /**
                 * @hack A brief pause to ensure the rendering triggered by the 
                 * `expand` operation has fully completed.
                 */
                await delayFor(Time.ms(10), () => this._tree.setHover(item, true));
            })
        );
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
        this._hoverHandler.reactivate();
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

    public onDragOver(event: DragEvent, currentDragItems: FileItem[], targetOver?: FileItem | undefined, targetIndex?: number | undefined): IDragOverResult {

        // good perf
        const prevResult = this.__isDragOverUnchanged(event);
        if (prevResult !== undefined) {
            return { allowDrop: prevResult };
        }
        
        const isDroppable = this.__isDroppable(event, currentDragItems, targetOver);
        this._prevDragOverState.isDroppable = isDroppable;
        
        // derender every single time
        this._insertionIndicator?.derender();
        this.__derenderDropOnRootEffect();

        if (!isDroppable) {
            return { allowDrop: false };
        }

        /**
         * Row insertion need to be checked on every single 'onDragOver'.
         */
        const isHandled = this._insertionIndicator?.handleRowInsertion(event, targetIndex);
        if (isHandled) {
            this._prevDragOverState.handleByRowInsertion = true;

            /**
             * Clean the possible hovering effect which remained by the previous
             * 'onDragOver'. Avoid having 'row insertion' and 'hover' effect at
             * the same time.
             */
            this._delayExpand.cancel(true);
            if (this._tree.getHover().length > 0) {
                this._tree.setHover(null);
            }

            return { allowDrop: true };
        }

        /**
         * Reactivates the hover handler if drag over is no longer handled by 
         * row insertion, ensuring hover effects can be applied again based on 
         * the new context.
         * 
         * Especially after a transition from a row insertion operation back to 
         * a standard drag over state where the item is not being inserted 
         * between rows.
         */
        if (this._prevDragOverState.handleByRowInsertion) {
            this._hoverHandler.reactivate();
        }
        this._prevDragOverState.handleByRowInsertion = false;

        // special case: drop on root
        const dropOnRoot = this.__isDropOnRoot(targetOver);
        if (dropOnRoot) {
            return { allowDrop: true };
        }

        // Since not dropping on the root, it is not allow to drop on no targets.
        if (!targetOver || targetIndex === undefined) {
            this._prevDragOverState.isDroppable = false;
            return { allowDrop: false };
        }

        /**
         * Hovering check do not need to be checked on every single 'onDragOver'. 
         * Only needed after every `onDragEnter`.
         */
        this._hoverHandler.execute(() => {

            // the target is not collapsible (file)
            if (!this._tree.isCollapsible(targetOver)) {
                this._delayExpand.cancel(true);
    
                if (targetOver.parent && !targetOver.parent.isRoot()) {
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
            this._tree.setHover(targetOver, true);
        });

        return { allowDrop: true };
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
        
        // expand folder immediately when drops
        this._delayExpand.cancel(true);
        if (!target.isRoot() && this._tree.isCollapsible(target)) {
            await this._tree.expand(target);
        }

        /**
         * Iterate every selecting items and try to move to the destination. If 
         * any existing files or folders found at the destination, a window will 
         * pop up and ask for user permission if to overwrite.
         */
        for (const dragItem of currentDragItems) {
            const destination = URI.join(targetOver.uri, dragItem.name);
            await this.fileService.moveTo(dragItem.uri, destination)
                .map(() => {})
                .orElse(async error => {
                    
                    // only expect `FILE_EXISTS` error
                    if (error.code !== FileOperationErrorType.FILE_EXISTS) {
                        panic(error); // TODO: pop up an error window
                    }

                    // ask permission for the user
                    const shouldOverwrite = await this.notificationService.confirm(
                        'Overwrite Warning',
                        `An item named ${dragItem.name} already exists in this location. Do you want to replace it with the one you're moving?`
                    );

                    if (shouldOverwrite) {
                        await this.fileService.moveTo(dragItem.uri, destination, true).unwrap();
                    }
                })
                .unwrap();
        }
    }

    public onDragEnd(event: DragEvent): void {
        this._delayExpand.cancel(true);
        
        this._dragOnRootDisposable.dispose();
        this._hoverHandler.deactivate();
        this._insertionIndicator?.derender();
    }

    public override dispose(): void {
        super.dispose();
        this._insertionIndicator?.dispose();
    }

    // [public helper methods]

    public bindWithTree(tree: IFileTree<FileItem, FuzzyScore>): void {
        (<Mutable<typeof tree>>this._tree) = tree;
        this._insertionIndicator?.bindWithTree(tree);
    }

    // [private helper methods]

    private __initRowInsertion(): void {
        
        // only enable insertion indicator during custom sortering
        const setIndicatorBy = (order: FileSortType) => {
            if (order === FileSortType.Custom) {
                this._insertionIndicator ??= new RowInsertionIndicator();
            } else {
                this._insertionIndicator?.dispose();
                this._insertionIndicator = undefined;
            }
        };

        // init
        const sortOrder = this.configurationService.get<FileSortType>(SideViewConfiguration.ExplorerFileSortType);
        setIndicatorBy(sortOrder);

        // configuration self update
        this.configurationService.onDidConfigurationChange(e => {
            if (!e.match(SideViewConfiguration.ExplorerFileSortType)) {
                return;
            }
            const newSortOrder = this.configurationService.get<FileSortType>(SideViewConfiguration.ExplorerFileSortType);
            setIndicatorBy(newSortOrder);
        });
    }

    private __isDragOverUnchanged(event: DragEvent): boolean | undefined {
        if (this._prevDragOverState?.x === event.clientX &&
            this._prevDragOverState?.y === event.clientY
        ) {
            return this._prevDragOverState.isDroppable;
        }
        
        this._prevDragOverState.x = event.clientX;
        this._prevDragOverState.y = event.clientY;

        return undefined;
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
    private _dragOnRootDisposable: IDisposable = Disposable.NONE;
    
    private __derenderDropOnRootEffect(): void {
        this._dragOnRootDisposable.dispose();
    }
    
    private __isDropOnRoot(targetOver?: FileItem): boolean {
        this.__derenderDropOnRootEffect();

        const dropAtEmpty = !targetOver;
        const dropAtRootDirectChild = targetOver && targetOver.parent?.isRoot();
        const ensureTargetIsNotDir = targetOver && !this._tree.isCollapsible(targetOver);

        if (dropAtEmpty || (dropAtRootDirectChild && ensureTargetIsNotDir)) {
            this._tree.DOMElement.classList.add('on-drop-target');
            this._dragOnRootDisposable = toDisposable(() => {
                this._tree.DOMElement.classList.remove('on-drop-target');
            });
            return true;
        }

        return false;   
    }
}

interface IInsertionResult {
    
    /** 
     * Where should the insertion be rendered. 
     */
    readonly renderTop: number;
}

class RowInsertionIndicator extends Disposable {

    // [fields]

    private readonly _tree!: IFileTree<FileItem, FuzzyScore>;
    private _rowDisposable: IDisposable;
        
    // [constructor]

    constructor() {
        super();
        this._rowDisposable = Disposable.NONE;
    }

    public bindWithTree(tree: IFileTree<FileItem, FuzzyScore>): void {
        (<Mutable<typeof tree>>this._tree) = tree;
    }

    public override dispose(): void {
        super.dispose();
        this._rowDisposable.dispose();
    }

    // [public methods]

    public derender(): void {
        this.__derender();
    }
    
    public handleRowInsertion(event: DragEvent, targetIndex: number | undefined): boolean {
        this.__derender();

        const result = this.__isInsertionApplicable(event, targetIndex);
        if (result) {
            this.__renderInsertionAt(result);
            return true;
        }

        return false;
    }

    // [private helper methods]

    private __derender(): void {
        this._rowDisposable.dispose();
    }

    private __isInsertionApplicable(event: DragEvent, targetIndex: number | undefined): IInsertionResult | undefined {
        if (targetIndex === undefined) {
            return undefined;
        }

        const index = targetIndex;

        const currentItemTop = this._tree.getItemRenderTop(index);        
        const currentItemBottom = currentItemTop + this._tree.getItemHeight(index);

        const mouseY = event.clientY - DomUtility.Attrs.getViewportTop(this._tree.DOMElement);
        
        const thershold = 10;
        const isNearTop = Math.abs(mouseY - currentItemTop) <= thershold;
        const isNearBot = Math.abs(mouseY - currentItemBottom) <= thershold;

        if (!isNearTop && !isNearBot) {
            return undefined;
        }

        const renderTop = isNearTop ? currentItemTop : currentItemBottom;
        return {
            renderTop: renderTop - 2,
        };
    }

    private __renderInsertionAt(result: IInsertionResult | undefined): void {
        if (!result) {
            return;
        }
        
        // rendering
        const insertionElement = document.createElement('div');
        insertionElement.className = 'row-insertion';
        insertionElement.style.top = `${result.renderTop}px`;
        this._tree.DOMElement.appendChild(insertionElement);

        this._rowDisposable = toDisposable(() => {
            insertionElement.remove();
        });
    }
}