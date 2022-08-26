import { ITreeNode } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { IListViewMetadata, RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { FuzzyScore } from "src/base/common/fuzzy";
import { ExplorerItem, ExplorerItemProvider } from "src/code/browser/service/explorerTree/explorerItem";
import { Icons } from "src/base/browser/icon/icons";
import { getIconClass } from "src/base/browser/icon/iconRegistry";

/**
 * The type of metadata returned by {@link ExplorerRenderer.render()}.
 */
export interface IExplorerMetadata extends IListViewMetadata {
    // nothing here for now
}

/**
 * @class The type of renderer used for {@link ExplorerViewComponent}.
 */
export class ExplorerRenderer implements ITreeListRenderer<ExplorerItem, FuzzyScore, IExplorerMetadata> {
    
    public readonly type = RendererType.Explorer;

    constructor() {
        
    }

    public render(element: HTMLElement): IExplorerMetadata {
        const text = document.createElement('span');
        text.className = 'explorer-item';
        text.style.lineHeight = `${ExplorerItemProvider.Size}px`;
        
        element.appendChild(text);

        return {
            container: text
        };
    }

    public update(item: ITreeNode<ExplorerItem, void>, index: number, data: IExplorerMetadata, size?: number): void {
        
        const text = data.container;
        text.textContent = item.data.name;

    }

    public updateIndent(item: ITreeNode<ExplorerItem, FuzzyScore>, indentElement: HTMLElement): void {
        if (item.collapsible) {
            indentElement.classList.add(...getIconClass(Icons.CaretDown));
        } else {
            indentElement.classList.remove(...getIconClass(Icons.CaretDown));
        }
    }
    
    public dispose(data: IExplorerMetadata): void {
        // TODO
    }
    
}