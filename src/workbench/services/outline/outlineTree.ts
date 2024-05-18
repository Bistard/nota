import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IMultiTree, IMultiTreeOptions, MultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeNodeItem } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { Stack } from "src/base/common/structures/stack";
import { assert } from "src/base/common/utilities/panic";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { HeadingItem } from "src/workbench/services/outline/headingItem";

/**
 * An interface only for {@link OutlineTree}.
 */
export interface IOutlineTree extends IMultiTree<HeadingItem, void> {

    /**
     * The corresponding file.
     */
    readonly fileURI: URI;

    /**
     * Fires when the item has been hovered.
     */
    readonly onDidHover: Register<IOutlineHoverEvent>;
}

export interface IOutlineHoverEvent {
    
    /** 
     * The hovered heading. 
     */
    readonly heading: HeadingItem;

    /**
     * The index of the heading relative to the tree view.
     */
    readonly index: number;

    /**
     * Determines if the heading is overflowing (the text is too long).
     */
    readonly isOverflow: boolean;
}

/**
 * Construction options for {@link OutlineTree}.
 */
export interface IOutlineTreeOptions extends IMultiTreeOptions<HeadingItem, void> {

}

/**
 * @class
 */
export class OutlineTree extends MultiTree<HeadingItem, void> implements IOutlineTree {

    // [event]

    private readonly _onDidHover = this.__register(new Emitter<IOutlineHoverEvent>());
    public readonly onDidHover = this._onDidHover.registerListener;

    // [fields]

    private readonly _fileURI: URI;

    // [constructor]

    constructor(
        container: HTMLElement,
        renderers: ITreeListRenderer<HeadingItem, void, any>[], 
        itemProvider: IListItemProvider<HeadingItem>, 
        opts: IOutlineTreeOptions,
        @IEditorService editorService: IEditorService,
    ) {
        const editor = assert(editorService.editor, '`OutlineTree` cannot be initialized when the EditorService is not initialized.');
        const model = assert(editor.model, '`OutlineTree` cannot be initialized when the editor is not built.');
        
        // build the tree structure
        const content = model.getContent();
        const root = buildOutlineTree(content);

        // constructor
        super(container, root.data, renderers, itemProvider, opts);
        this._fileURI = model.source;

        // rendering
        this.splice(root.data, root.children);
        this.layout();

        // listeners
        this.__registerListeners();
    }

    // [public methods]

    get fileURI(): URI {
        return this._fileURI;
    }

    // [private helper methods]

    private __registerListeners(): void {

        this.__register(this.onDidChangeItemHover(e => {
            const hovers = e.data;
            if (hovers.length === 0) {
                return;
            }
            
            const hovered = hovers[0]!;
            const index = this.getItemIndex(hovered);
            const element = this.getHTMLElement(index); // list-view-row
            if (!element) {
                return;
            }

            const content = assert(element.getElementsByClassName('tree-list-content')[0]);
            this._onDidHover.fire({
                heading: hovered,
                index: index,
                isOverflow: content.scrollWidth > content.clientWidth
            });
        }));
    }
}

/**
 * @description Converts an array of markdown content to a tree structure of
 * {@link HeadingItem}.
 * @param content Array of markdown lines to be converted.
 * @returns The root node of the tree structure for later rendering purpose.
 *
 * @note Export for unit test purpose.
 */
export function buildOutlineTree(content: string[]): ITreeNodeItem<HeadingItem> {
    const root: ITreeNodeItem<HeadingItem> = {
        data: new HeadingItem(0, HeadingItem.ROOT_ID, 0),
        children: []
    };

    const stack = new Stack<ITreeNodeItem<HeadingItem>>();
    stack.push(root);

    content.forEach((line, lineNumber) => {
        let level = 0;
        while (line.charAt(level) === '#') {
            level++;

            // not a heading (perf: avoid blocking when a line start with countless of `#`)
            if (level > 6) {
                return;
            }
        }

        // not a heading
        if (level === 0) {
            return;
        }

        const name = line.slice(level + 1, undefined).trim();
        const item = new HeadingItem(lineNumber, name, level);
        const node = { data: item, children: [] } as ITreeNodeItem<HeadingItem>;

        // Backtrack to find the correct parent level
        while (stack.top().data.depth >= level) {
            stack.pop();
        }

        stack.top().children!.push(node);
        stack.push(node);
    });

    return root;
}
