import "src/workbench/contrib/outline/outline.scss";
import { EventType, addDisposableListener } from "src/base/browser/basic/dom";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IMultiTree, IMultiTreeOptions, MultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeNodeItem } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { Time } from "src/base/common/date";
import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { Stack } from "src/base/common/structures/stack";
import { UnbufferedScheduler } from "src/base/common/utilities/async";
import { assert } from "src/base/common/utilities/panic";
import { isNonNullable } from "src/base/common/utilities/type";
import { HeadingItem } from "src/workbench/contrib/outline/headingItem";
import { IEditorWidget } from "src/editor/editorWidget";

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
     * The corresponding HTMLElement of the hovered heading.
     */
    readonly element: HTMLElement;

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

    private readonly _container: HTMLElement;
    private readonly _fileURI: URI;
    private _hoverBox?: HTMLElement;
    private _hoverBoxScheduler!: UnbufferedScheduler<IOutlineHoverEvent>;

    // [constructor]

    constructor(
        parent: HTMLElement,
        renderers: ITreeListRenderer<HeadingItem, void, any>[], 
        itemProvider: IListItemProvider<HeadingItem>, 
        opts: IOutlineTreeOptions,
        editor: IEditorWidget,
    ) {
        const container = document.createElement('div');
        container.className = 'outline';
        parent.appendChild(container);

        const model = editor.model;

        // build the tree structure
        const content = model.getContent();
        const root = buildOutlineTree(content);

        // constructor
        super(container, root.data, renderers, itemProvider, opts);
        this._container = container;
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

    public override dispose(): void {
        super.dispose();
        this._container.remove();
    }

    // [private helper methods]

    private __registerListeners(): void {

        this.__register(this.onDidChangeItemHover(e => {
            const hovers = e.data;
            if (hovers.length === 0) {
                this._hoverBoxScheduler.cancel();
                return;
            }

            const hovered = hovers[0]!;
            const index = this.getItemIndex(hovered);
            const element = this.getHTMLElement(index); // .list-view-row
            if (!element) {
                return;
            }

            const content = assert(element.getElementsByClassName('tree-list-content')[0]);
            const isOverflow = content.scrollWidth > content.clientWidth;
            const event: IOutlineHoverEvent = {
                heading: hovered,
                element: element,
                index: index,
                isOverflow: isOverflow
            };
            
            this._hoverBoxScheduler.schedule(event);
            this._onDidHover.fire(event);
        }));

        // on click event
        this.__register(this.onClick(e => {
            
            /**
             * When user click a heading, we assume the user is not expecting a hover 
             * box, we delay the hover box display.
             */
            const currEvent = this._hoverBoxScheduler.currentEvent;
            if (isNonNullable(currEvent) && currEvent.heading.id === e.data?.id) {
                this._hoverBoxScheduler.schedule(currEvent);
            }
        }));

        // hover box deferred rendering
        this._hoverBoxScheduler = this.__register(new UnbufferedScheduler(Time.sec(0.8), e => {
            if (e.isOverflow) {
                this.__renderHoverBox(e);
            } else {
                this.__removeHoverBox();
            }
        }));
    }

    private __renderHoverBox(event: IOutlineHoverEvent) {
        const { heading, element: row } = event;
        this._hoverBox?.remove();

        // Create hover box element
        const hoverBox = document.createElement('div');
        hoverBox.className = 'hover-box';
        hoverBox.textContent = heading.name;

        // Position the hover box
        const rowRect = row.getBoundingClientRect();
        const containerRect = this._container.getBoundingClientRect();
        const topPosition = rowRect.bottom - containerRect.top;
        hoverBox.style.top = `${topPosition}px`;

        this._container.appendChild(hoverBox);
        this._hoverBox = hoverBox;

        const listen = addDisposableListener(row, EventType.mouseleave, () => {
            listen.dispose();
            hoverBox.remove();
            this._hoverBox = undefined;
        });
    }

    private __removeHoverBox() {
        if (this._hoverBox) {
            this._hoverBox.remove();
            this._hoverBox = undefined;
        }
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
