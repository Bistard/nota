import { ITreeNode } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { IListViewMetadata, RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { FuzzyScore } from "src/base/common/fuzzy";
import { Icons } from "src/base/browser/icon/icons";
import { getIconClass } from "src/base/browser/icon/iconRegistry";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { HeadingItem } from "src/workbench/contrib/outline/headingItem";

const HeadingItemRendererType = 'heading-item';

/**
 * The type of metadata returned by {@link HeadingItemRenderer.render()}.
 */
interface IHeadingItemMetadata extends IListViewMetadata {}

/**
 * @class The type of renderer used for {@link OutlineService}.
 */
export class HeadingItemRenderer implements ITreeListRenderer<HeadingItem, FuzzyScore, IHeadingItemMetadata> {

    public readonly type: RendererType = HeadingItemRendererType;

    constructor() {}

    public render(element: HTMLElement): IHeadingItemMetadata {
        const text = document.createElement('span');
        text.className = 'outline-item';
        text.style.lineHeight = `${HeadingItemProvider.Size}px`;

        element.appendChild(text);

        return {
            container: text
        };
    }

    public update(item: ITreeNode<HeadingItem, void>, index: number, data: IHeadingItemMetadata, size?: number): void {
        const text = data.container;
        text.textContent = item.data.name;

        // mark level
        const heading = item.data;
        text.setAttribute('level', heading.depth.toString());
    }

    public updateIndent(item: ITreeNode<HeadingItem, FuzzyScore>, indentElement: HTMLElement): void {
        if (item.collapsible) {
            indentElement.classList.add(...getIconClass(Icons.ArrowRight));
        } else {
            indentElement.classList.remove(...getIconClass(Icons.ArrowRight));
        }
    }

    public dispose(data: IHeadingItemMetadata): void {
        // Dispose logic can be added here if necessary
    }
}

/**
 * @class A {@link IListItemProvider} used for {@link HeadingItem}.
 */
export class HeadingItemProvider implements IListItemProvider<HeadingItem> {

    /**
     * The height in pixels for every outline item.
     */
    public static readonly Size = 22;

    public getSize(data: HeadingItem): number {
        return HeadingItemProvider.Size;
    }

    public getType(data: HeadingItem): RendererType {
        return HeadingItemRendererType;
    }

}
