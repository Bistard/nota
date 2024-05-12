import { ITreeNode } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { IListViewMetadata, RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { FuzzyScore } from "src/base/common/fuzzy";
import { Icons } from "src/base/browser/icon/icons";
import { getIconClass } from "src/base/browser/icon/iconRegistry";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { OutlineItem } from "src/workbench/services/outline/outlineService";

export const OutlineItemRendererType = 'outline';

/**
 * The type of metadata returned by {@link OutlineItemRenderer.render()}.
 */
export interface IOutlineItemMetadata extends IListViewMetadata {
    // Additional metadata can be added here
}

/**
 * @class The type of renderer used for {@link OutlineService}.
 */
export class OutlineItemRenderer implements ITreeListRenderer<OutlineItem, FuzzyScore, IOutlineItemMetadata> {

    public readonly type: RendererType = OutlineItemRendererType;

    constructor() {}

    public render(element: HTMLElement): IOutlineItemMetadata {
        const text = document.createElement('span');
        text.className = 'outline-item';
        text.style.lineHeight = `${OutlineItemProvider.Size}px`;

        element.appendChild(text);

        return {
            container: text
        };
    }

    public update(item: ITreeNode<OutlineItem, void>, index: number, data: IOutlineItemMetadata, size?: number): void {
        const text = data.container;
        text.textContent = item.data.name;
    }

    public updateIndent(item: ITreeNode<OutlineItem, FuzzyScore>, indentElement: HTMLElement): void {
        if (item.collapsible) {
            indentElement.classList.add(...getIconClass(Icons.ArrowRight));
        } else {
            indentElement.classList.remove(...getIconClass(Icons.ArrowRight));
        }
    }

    public dispose(data: IOutlineItemMetadata): void {
        // Dispose logic can be added here if necessary
    }
}

/**
 * @class A {@link IListItemProvider} used for {@link OutlineItem}.
 */
export class OutlineItemProvider implements IListItemProvider<OutlineItem> {

    /**
     * The height in pixels for every outline item.
     */
    public static readonly Size = 22;

    public getSize(data: OutlineItem): number {
        return OutlineItemProvider.Size;
    }

    public getType(data: OutlineItem): RendererType {
        return OutlineItemRendererType;
    }

}
