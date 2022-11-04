import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { URI } from "src/base/common/file/uri";
import { FuzzyScore } from "src/base/common/fuzzy";
import { Scheduler } from "src/base/common/util/async";
import { Mutable } from "src/base/common/util/type";
import { ClassicItem } from "src/code/browser/service/classicTree/classicItem";
import { IClassicTree } from "src/code/browser/service/classicTree/classicTree";

/**
 * @class A type of {@link IListDragAndDropProvider} to support drag and drop
 * for {@link ClassicTree}.
 */
export class ClassicDragAndDropProvider implements IListDragAndDropProvider<ClassicItem> {

    // [field]

    private readonly _tree!: IClassicTree<ClassicItem, FuzzyScore>;
    
    private static readonly EXPAND_DELAY = 500;
    private readonly _delayExpand: Scheduler<ClassicItem>;

    // [constructor]

    constructor() {
        this._delayExpand = new Scheduler(ClassicDragAndDropProvider.EXPAND_DELAY, (item) => {
            const toExpandItem = item[0]!;
            this._tree.expand(toExpandItem, false);
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
        console.log('drop start'); // TEST
    }

    public onDragEnter(event: DragEvent, currentDragItems: ClassicItem[], targetOver?: ClassicItem, targetIndex?: number): void {
        if (!targetOver) {
            return;
        }

        this._delayExpand.schedule(targetOver, true);
    }

    public onDragLeave(event: DragEvent, currentDragItems: ClassicItem[], targetOver?: ClassicItem, targetIndex?: number): void {
        if (!targetOver) {
            this._delayExpand.cancel(true);
            return;
        }
        
        console.log('leave item: ', targetOver?.name); // TEST
    }

    public onDragOver(event: DragEvent, currentDragItems: ClassicItem[], targetOver?: ClassicItem | undefined, targetIndex?: number | undefined): boolean {
        return true;
    }

    public onDragDrop(event: DragEvent, currentDragItems: ClassicItem[], targetOver?: ClassicItem | undefined, targetIndex?: number | undefined): void {
        console.log('drop item: ', targetOver?.name); // TEST
    }

    public onDragEnd(event: DragEvent): void {
        console.log('drop end'); // TEST
    }

    // [public helper methods]

    public bindWithTree(tree: IClassicTree<ClassicItem, FuzzyScore>): void {
        (<Mutable<typeof tree>>this._tree) = tree;
    }
}
