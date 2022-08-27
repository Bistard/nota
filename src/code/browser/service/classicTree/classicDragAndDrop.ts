import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { ClassicItem } from "src/code/browser/service/classicTree/classicItem";

/**
 * @class A type of {@link IListDragAndDropProvider} to support drag and drop
 * for {@link Notebook}.
 */
export class ClassicDragAndDropProvider implements IListDragAndDropProvider<ClassicItem> {

    constructor() {

    }

    public getDragData(item: ClassicItem): string | null {
        return item.uri.toString();
    }

    public getDragTag(items: ClassicItem[]): string {
        if (items.length === 1) {
            return items[0]!.name;
        }
        return String(`${items.length} selections`);
    }

    public onDragStart(): void {
        // TODO
    }

}
