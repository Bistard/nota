import { ITreeNode } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { IListViewMetadata, RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { FuzzyScore } from "src/base/common/fuzzy";
import { ClassicItem } from "src/code/browser/service/classicTree/classicItem";
import { Icons } from "src/base/browser/icon/icons";
import { getIconClass } from "src/base/browser/icon/iconRegistry";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";

/**
 * The type of metadata returned by {@link ClassicRenderer.render()}.
 */
export interface IClassicMetadata extends IListViewMetadata {
    // nothing here for now
}

/**
 * @class The type of renderer used for {@link ClassicTreeService}.
 */
export class ClassicRenderer implements ITreeListRenderer<ClassicItem, FuzzyScore, IClassicMetadata> {
    
    public readonly type = RendererType.Explorer;

    constructor() {
        
    }

    public render(element: HTMLElement): IClassicMetadata {
        const text = document.createElement('span');
        text.className = 'explorer-item';
        text.style.lineHeight = `${ClassicItemProvider.Size}px`;
        
        element.appendChild(text);

        return {
            container: text
        };
    }

    public update(item: ITreeNode<ClassicItem, void>, index: number, data: IClassicMetadata, size?: number): void {
        
        const text = data.container;
        text.textContent = item.data.name;

    }

    public updateIndent(item: ITreeNode<ClassicItem, FuzzyScore>, indentElement: HTMLElement): void {
        if (item.collapsible) {
            indentElement.classList.add(...getIconClass(Icons.CaretDown));
        } else {
            indentElement.classList.remove(...getIconClass(Icons.CaretDown));
        }
    }
    
    public dispose(data: IClassicMetadata): void {
        // TODO
    }
    
}

/**
 * @class A {@link IListItemProvider} used for {@link ClassicItem}.
 */
export class ClassicItemProvider implements IListItemProvider<ClassicItem> {

    public static readonly Size = 30;

    public getSize(data: ClassicItem): number {
        return ClassicItemProvider.Size;
    }

    public getType(data: ClassicItem): RendererType {
        return RendererType.Explorer;
    }

}