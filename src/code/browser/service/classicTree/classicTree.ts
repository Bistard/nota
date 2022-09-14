import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { AsyncTree, IAsyncTreeOptions } from "src/base/browser/secondary/tree/asyncTree";
import { ITreeMouseEvent } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { Emitter, Register } from "src/base/common/event";
import { Pair } from "src/base/common/util/type";
import { ClassicItem } from "src/code/browser/service/classicTree/classicItem";

export interface ClassicOpenEvent {
    readonly item: ClassicItem;
    readonly browserEvent: UIEvent;
}

export interface IClassicTree<T, TFilter> extends AsyncTree<T, TFilter> {

    /**
     * Fires when a file / notepage in the explorer tree is about to be opened.
     */
    readonly onDidClick: Register<ClassicOpenEvent>;
}

export interface IClassicTreeOptions<T extends ClassicItem, TFilter> extends IAsyncTreeOptions<T, TFilter> {}

/**
 * @class // TODO
 */
export class ClassicTree<T extends ClassicItem, TFilter> extends AsyncTree<T, TFilter> implements IClassicTree<T, TFilter> {

    // [field]

    // [event]

    private readonly _onDidClick = new Emitter<ClassicOpenEvent>();
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    private constructor(
        container: HTMLElement,
        rootData: T,
        renderers: ITreeListRenderer<T, TFilter, any>[],
        itemProvider: IListItemProvider<T>,
        opts: IClassicTreeOptions<T, TFilter>,
    ) {
        super(container, rootData, renderers, itemProvider, opts);
        this.__register(this.onClick(e => this.__onTreeClick(e)));
    }

    // [public static method]

    /**
     * @description Use this method to create the tree so that it gets refreshed 
     * automatcially.
     */
    public static create<T extends ClassicItem, TFilter = void>(
        container: HTMLElement, 
        rootData: T, 
        renderers: ITreeListRenderer<T, TFilter, any>[], 
        itemProvider: IListItemProvider<T>, 
        opts: IClassicTreeOptions<T, TFilter>
    ): Pair<ClassicTree<T, TFilter>, Promise<void>>
    {
        const tree = new ClassicTree(container, rootData, renderers, itemProvider, opts);
        return [tree, tree.refresh()];
    }

    // [private helper method]

    private __onTreeClick(event: ITreeMouseEvent<T>): void {
        // clicking no where
        if (event.data === null) {
            return;
        }

        if (event.data.isDirectory()) {
            return;
        }

        this._onDidClick.fire({
            item: event.data,
            browserEvent: event.browserEvent
        });
    }
}