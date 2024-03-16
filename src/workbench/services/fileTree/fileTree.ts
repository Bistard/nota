import "src/workbench/services/fileTree/media.scss";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { AsyncTree, AsyncTreeWidget, IAsyncTree, IAsyncTreeOptions, IAsyncTreeWidgetOpts } from "src/base/browser/secondary/tree/asyncTree";
import { MultiTreeKeyboardController } from "src/base/browser/secondary/tree/multiTree";
import { ITreeMouseEvent, ITreeNode } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { Emitter, Event, Register } from "src/base/common/event";
import { IStandardKeyboardEvent } from "src/base/common/keyboard";
import { FileItem } from "src/workbench/services/fileTree/fileItem";
import { DomUtility } from "src/base/browser/basic/dom";

export interface IFileTreeOpenEvent<T extends FileItem> {
    readonly item: T;
}

/** 
 * Option for constructing a {@link FileTree}. 
 */
export interface IFileTreeOptions<T extends FileItem, TFilter> extends IAsyncTreeOptions<T, TFilter> { }

/** 
 * Option for constructing a {@link FileTreeWidget}. 
 */
export interface IFileTreeWidgetOpts<T extends FileItem, TFilter> extends IAsyncTreeWidgetOpts<T, TFilter> {
    readonly extraArguments: [IFileTree<T, TFilter>];
}

/**
 * @internal
 */
export class FileTreeKeyboardController<T extends FileItem, TFilter> extends MultiTreeKeyboardController<T, TFilter> {

    // [field]

    declare protected readonly _view: FileTreeWidget<T, TFilter>;
    declare protected readonly _tree: FileTree<T, TFilter>;

    // [constructor]

    constructor(
        view: FileTreeWidget<T, TFilter>,
        tree: IFileTree<T, TFilter>,
    ) {
        super(view, tree);
    }

    // [protected override methods]

    protected override __onEnter(e: IStandardKeyboardEvent): void {
        super.__onEnter(e);

        const anchor = this._tree.getAnchor();
        if (!anchor) {
            return;
        }

        if (anchor.isDirectory()) {
            return;
        }

        this._tree.select(anchor);
    }
}

/**
 * @class Used to override and add additional controller behaviours.
 */
export class FileTreeWidget<T extends FileItem, TFilter> extends AsyncTreeWidget<T, TFilter> {

    protected override __createKeyboardController(opts: IFileTreeWidgetOpts<T, TFilter>): FileTreeKeyboardController<T, TFilter> {
        return new FileTreeKeyboardController(this, opts.extraArguments[0]);
    }
}

/**
 * An interface only for {@link FileTree}.
 */
export interface IFileTree<T extends FileItem, TFilter> extends IAsyncTree<T, TFilter> {

    /**
     * Fires when a file / notepage in the explorer tree is about to be opened.
     */
    readonly onSelect: Register<IFileTreeOpenEvent<T>>;

    /**
     * @description
     * @param item 
     * 
     * @note Will reveal to the item if not visible (not rendered).
     */
    select(item: T): void;
}

export class FileTree<T extends FileItem, TFilter> extends AsyncTree<T, TFilter> implements IFileTree<T, TFilter> {

    // [field]

    // [event]

    private readonly _onSelect = new Emitter<IFileTreeOpenEvent<T>>();
    public readonly onSelect = this._onSelect.registerListener;

    // [constructor]

    constructor(
        container: HTMLElement,
        rootData: T,
        opts: IFileTreeOptions<T, TFilter>,
    ) {
        super(container, rootData, opts);
        this.DOMElement.classList.add('file-tree');
        this.__register(this.onClick(e => this.__onClick(e)));

        /**
         * Only focus the entire tree when:
         *      1. no any traits exists in the view or
         *      2. the tree is focused.
         */
        this.__register(Event.any([
            this.onDidChangeItemFocus,
            this.onDidChangeItemSelection,
            this.onDidChangeFocus
        ])(() => {
            // REVIEW: perf - this fn triggered very frequently
            const noTraits = (this.getViewFocus() === null && this.getViewSelections().length === 0);
            const isFocused = DomUtility.Elements.isElementFocused(this.DOMElement);
            this.DOMElement.classList.toggle('focused', noTraits && isFocused);
        }));
    }

    // [public methods]

    public select(item: T): void {
        if (!this.isItemVisible(item)) {
            this.reveal(item);
        }

        this.setFocus(item);
        this.setSelections([item]);

        this._onSelect.fire({ item: item });
    }

    // [protected override method]

    protected override createTreeWidget(container: HTMLElement, renderers: ITreeListRenderer<T, TFilter, any>[], itemProvider: IListItemProvider<ITreeNode<T, TFilter>>, opts: IFileTreeWidgetOpts<T, TFilter>): FileTreeWidget<T, TFilter> {
        return new FileTreeWidget<T, TFilter>(container, renderers, itemProvider, opts);
    }

    // [private helper method]

    private __onClick(event: ITreeMouseEvent<T>): void {
        // clicking no where
        if (event.data === null) {
            return;
        }

        if (event.browserEvent.shiftKey || event.browserEvent.ctrlKey) {
            return;
        }

        if (event.data.isDirectory()) {
            return;
        }

        this._onSelect.fire({ item: event.data });
    }
}