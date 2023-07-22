import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { URI } from "src/base/common/file/uri";
import { FuzzyScore } from "src/base/common/fuzzy";
import { Arrays } from "src/base/common/util/array";
import { Scheduler } from "src/base/common/util/async";
import { Mutable } from "src/base/common/util/type";
import { ClassicItem } from "src/workbench/services/classicTree/classicItem";
import { IClassicTree } from "src/workbench/services/classicTree/classicTree";
import { IFileService } from "src/platform/files/common/fileService";

/**
 * @class A type of {@link IListDragAndDropProvider} to support drag and drop
 * for {@link ClassicTree}.
 */
export class ClassicDragAndDropProvider implements IListDragAndDropProvider<ClassicItem> {

    // [field]

    private readonly _tree!: IClassicTree<ClassicItem, FuzzyScore>;

    private static readonly EXPAND_DELAY = 300;
    private readonly _delayExpand: Scheduler<{ item: ClassicItem, index: number; }>;
    /**
     * When dragging over an item, this array is a temporary place to store the 
     * hoving subtree items. Used for unselecting them when the drag is over.
     */
    private _dragSelections: ClassicItem[] = [];

    // [constructor]

    constructor(
        private readonly fileService: IFileService,
    ) {

        this._delayExpand = new Scheduler(ClassicDragAndDropProvider.EXPAND_DELAY, async (event) => {
            const { item, index } = event[0]!;
            await this._tree.expand(item);
            this._dragSelections = this._tree.selectRecursive(item, index);
        });
    }

    // [public methods]

    public getDragData(item: ClassicItem): string | null {
        return URI.toString(item.uri);
    }

    public getDragTag(items: ClassicItem[]): string {
        if (items.length === 1) {
            return items[0]!.name;
        }
        return String(`${items.length} selections`);
    }

    public onDragStart(event: DragEvent): void {

    }

    public onDragEnter(event: DragEvent, currentDragItems: ClassicItem[], targetOver?: ClassicItem, targetIndex?: number): void {
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

    public onDragLeave(event: DragEvent, currentDragItems: ClassicItem[], targetOver?: ClassicItem, targetIndex?: number): void {

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

    public onDragOver(event: DragEvent, currentDragItems: ClassicItem[], targetOver?: ClassicItem | undefined, targetIndex?: number | undefined): boolean {
        if (!targetOver || !targetIndex) {
            this.__removeDragSelections();
            this._delayExpand.cancel(true);
            return false;
        }
        return true;
    }

    public onDragDrop(event: DragEvent, currentDragItems: ClassicItem[], targetOver?: ClassicItem | undefined, targetIndex?: number | undefined): void {

        // dropping target is invalid
        if (!targetOver || !targetIndex) {
            return;
        }

        // expand immediately
        this._delayExpand.cancel(true);
        this._tree.expand(targetOver);

        this.__removeDragSelections();
    }

    public onDragEnd(event: DragEvent): void {
        this._delayExpand.cancel(true);
        this.__removeDragSelections();
    }

    // [public helper methods]

    public bindWithTree(tree: IClassicTree<ClassicItem, FuzzyScore>): void {
        (<Mutable<typeof tree>>this._tree) = tree;
    }

    // [private helper methods]

    private __removeDragSelections(): void {
        if (this._dragSelections.length === 0) {
            return;
        }

        console.log('[removed drag selections]');

        const currSelections = this._tree.getSelections();
        const updatedSelections = Arrays.relativeComplement(this._dragSelections, currSelections);

        this._tree.setSelections(updatedSelections);
        this._dragSelections = [];
    }
}
