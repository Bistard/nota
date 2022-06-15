import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { RendererType } from "src/base/browser/secondary/listView/listRenderer";

export const enum EditorItemType {
    
}

interface IEditorItemBase {
    readonly type: EditorItemType;
}

export interface IEditorBlockItem extends IEditorItemBase {

}

export interface IEditorInlineItem extends IEditorItemBase {

}

export type EditorItem = (
    IEditorBlockItem | 
    IEditorInlineItem
);

export class EditorItemProvider implements IListItemProvider<EditorItem> {

    constructor() {

    }

    public getSize(data: EditorItem): number {
        return 20;
    }

    public getType(data: EditorItem): RendererType {
        return RendererType.MarkdownHeading;
    }

}