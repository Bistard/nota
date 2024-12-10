import { IListViewRenderer, RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { IDisposable } from "src/base/common/dispose";
import { DomUtility } from "src/base/browser/basic/dom";
import { assert, panic } from "src/base/common/utilities/panic";

/**
 * @description An interface for storing the DOM related element as a cache in 
 * {@link ListViewCache}.
 */
export interface IListViewRow {
	
    /**
     * The HTMLElement as a cache.
     */
    readonly dom: HTMLElement;
    
    /**
     * The type of the item in {@link ListView}, for finding the correct renderer.
     */
	readonly type: RendererType;

    /**
     * The user-defined data which will be returned after the method 
     * `renderer.render()` invoked. This is used for later `renderer.update()` / 
     * `renderer.dispose()`.
     */
    metadata: any;
}

/**
 * @class Storage to store all the DOM elements that are not displaying on the 
 * DOM tree. For performance usage.
 */
export class ListViewCache implements IDisposable {

    private readonly cache: Map<RendererType, IListViewRow[]>;
    private readonly renderers: Map<RendererType, IListViewRenderer<any, any>>;

    constructor(
        renderers: Map<RendererType, IListViewRenderer<any, any>>
    ) {
        this.cache = new Map();
        this.renderers = renderers;
    }

    public dispose(): void {
        this.cache.forEach((cache, type) => {
            const renderer = assert(this.renderers.get(type));
            cache.forEach(row => { 
                renderer.dispose(row.metadata);
                row.metadata = undefined;
            });
        });

        this.cache.clear();
    }

    /**
     * @description Creates a new `row` or reusing a previously released `row` 
     * which shares the same type.
     * @param type The type of the row.
     * @returns {IListViewRow}
     */
    public get(type: RendererType): IListViewRow {
        let row = this.__getCache(type).pop();

        if (row === undefined) {
            const dom = document.createElement('div');
            dom.className = 'list-view-row';
            
            // since we are creating a new row, we need to create the DOM structure.
            const renderer = this.renderers.get(type);
            if (renderer === undefined) {
                panic(`[ListViewCache] no renderer provided for the given type: ${type}`);
            }
            const metadata = renderer.render(dom);

            row = { dom: dom, type: type, metadata: metadata };
        }

        return row;
    }

    /**
     * @description Releases an existed row for essentially reuse purpose. The 
     * HTMLElement will be removed from the DOM tree and still exists in the 
     * cache.
     * @param row The row about to be released.
     */
    public release(row: IListViewRow): void {
        DomUtility.Modifiers.removeNodeFromParent(row.dom);
        const cache = this.__getCache(row.type);
        cache.push(row);
    }

    private __getCache(type: RendererType): IListViewRow[] {
        let cache = this.cache.get(type);

        if (cache === undefined) {
            cache = [];
            this.cache.set(type, cache);
        }

        return cache;
    }

}