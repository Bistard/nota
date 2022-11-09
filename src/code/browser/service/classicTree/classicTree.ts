import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { AsyncTree, AsyncTreeWidget, IAsyncTree, IAsyncTreeOptions, IAsyncTreeWidgetOpts } from "src/base/browser/secondary/tree/asyncTree";
import { MultiTreeKeyboardController } from "src/base/browser/secondary/tree/multiTree";
import { ITreeMouseEvent, ITreeNode } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { Emitter, Register } from "src/base/common/event";
import { IStandardKeyboardEvent } from "src/base/common/keyboard";
import { ClassicItem } from "src/code/browser/service/classicTree/classicItem";

export interface ClassicOpenEvent<T extends ClassicItem> {
    readonly item: T;
}

/** 
 * Option for constructing a {@link ClassicTree}. 
 */
export interface IClassicTreeOptions<T extends ClassicItem, TFilter> extends IAsyncTreeOptions<T, TFilter> {}

/** 
 * Option for constructing a {@link ClassicTreeWidget}. 
 */
export interface IClassicTreeWidgetOpts<T extends ClassicItem, TFilter> extends IAsyncTreeWidgetOpts<T, TFilter> {
    readonly extraArguments: [IClassicTree<T, TFilter>];
}

/**
 * @internal
 */
export class ClassicTreeKeyboardController<T extends ClassicItem, TFilter> extends MultiTreeKeyboardController<T, TFilter> {

    // [field]

    declare protected readonly _view: ClassicTreeWidget<T, TFilter>;
    declare protected readonly _tree: ClassicTree<T, TFilter>;

    // [constructor]

    constructor(
        view: ClassicTreeWidget<T, TFilter>,
        tree: IClassicTree<T, TFilter>,
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
export class ClassicTreeWidget<T extends ClassicItem, TFilter> extends AsyncTreeWidget<T, TFilter> {

    protected override __createKeyboardController(opts: IClassicTreeWidgetOpts<T, TFilter>): ClassicTreeKeyboardController<T, TFilter> {
        return new ClassicTreeKeyboardController(this, opts.extraArguments[0]);
    }
}

/**
 * An interface only for {@link ClassicTree}.
 * // TODO
 */
export interface IClassicTree<T extends ClassicItem, TFilter> extends IAsyncTree<T, TFilter> {

    /**
     * Fires when a file / notepage in the explorer tree is about to be opened.
     */
    readonly onSelect: Register<ClassicOpenEvent<T>>;

    /**
     * @description
     * @param item 
     * 
     * @note Will reveal to the item if not visible (not rendered).
     */
    select(item: T): void;
    selectRecursive(item: T, index: number): T[];
}

/**
 * @class // TODO
 */
export class ClassicTree<T extends ClassicItem, TFilter> extends AsyncTree<T, TFilter> implements IClassicTree<T, TFilter> {

    // [field]

    // [event]

    private readonly _onSelect = new Emitter<ClassicOpenEvent<T>>();
    public readonly onSelect = this._onSelect.registerListener;

    // [constructor]

    constructor(
        container: HTMLElement,
        rootData: T,
        opts: IClassicTreeOptions<T, TFilter>,
    ) {
        super(container, rootData, opts);
        this.__register(this.onClick(e => this.__onClick(e)));
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

    public selectRecursive(item: T, index: number): T[] {
        const subTreeSize = this.getVisibleNodeCount(item);
        const toSelected: T[] = [];
        for (let i = 0; i < subTreeSize; i++) {
            const currIndex = index + i;
            const item = this.getItem(currIndex);
            toSelected.push(item);
        }

        this.setSelections(toSelected);
        return toSelected;
    }

    // [protected override method]

    protected override createTreeWidget(container: HTMLElement, renderers: ITreeListRenderer<T, TFilter, any>[], itemProvider: IListItemProvider<ITreeNode<T, TFilter>>, opts: IClassicTreeWidgetOpts<T, TFilter>): ClassicTreeWidget<T, TFilter> {
        return new ClassicTreeWidget(container, renderers, itemProvider, opts);
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