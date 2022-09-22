import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { URI } from "src/base/common/file/uri";
import { ClassicItem } from "src/code/browser/service/classicTree/classicItem";

/**
 * @class A type of {@link IListDragAndDropProvider} to support drag and drop
 * for {@link ClassicTree}.
 */
export class ClassicDragAndDropProvider implements IListDragAndDropProvider<ClassicItem> {

    constructor() {}

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
        // TODO
    }

    public onDragEnter(event: DragEvent, currentDragItems: ClassicItem[], targetOver?: ClassicItem, targetIndex?: number): void {
        console.log('enter item: ', targetOver?.name);
    }

    public onDragLeave(event: DragEvent, currentDragItems: ClassicItem[], targetOver?: ClassicItem, targetIndex?: number): void {
        console.log('leave item: ', targetOver?.name);
    }
}
