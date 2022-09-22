import { IListViewRenderer, RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { ITraitChangeEvent } from "src/base/browser/secondary/listWidget/listWidget";
import { IDisposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { Arrays } from "src/base/common/util/array";
import { hash } from "src/base/common/util/hash";

/**
 * @internal
 * @class A {@link ListTrait} implements a set of methods for toggling one type 
 * of the characteristic of items in {@link ListWidget}, such as item selecting
 * and focusing.
 */
export class ListTrait implements IDisposable {

    // [field]

    /** A trait is a string that represents an CSS class. */
    public readonly traitID: string;

    private readonly _onDidChange = new Emitter<ITraitChangeEvent>();
    public readonly onDidChange = this._onDidChange.registerListener;

    private indices: number[] = [];
    private _getHTMLElement!: (index: number) => HTMLElement | null;

    /** For fast querying */
    private indicesSet?: Set<number>;

    // [constructor]

    constructor(trait: string) {
        this.traitID = trait;
    }

    // [public method]

    set getHTMLElement(value: (index: number) => HTMLElement | null) {
        this._getHTMLElement = value;
    }

    /**
     * @description Sets the given items with the current trait.
     * @param indice The indice of the items.
     * @param fire If fires the onDidChange event.
     */
    public set(indice: number[], fire: boolean = true): void {
        
        const oldIndice = this.indices;
        this.indices = indice;
        this.indicesSet = undefined;

        const toUnrender = Arrays.relativeComplement(indice, oldIndice);
        const toRender = Arrays.relativeComplement(oldIndice, indice);

        if (this._getHTMLElement) {
            for (const index of toUnrender) {
                const item = this._getHTMLElement(index);
                if (item) {
                    item.classList.toggle(this.traitID, false);
                }
            }
    
            for (const index of toRender) {
                const item = this._getHTMLElement(index);
                if (item) {
                    item.classList.toggle(this.traitID, true);
                }
            }
        }
        
        if (fire) {
            this._onDidChange.fire({ indice });
        }
    }

    /**
     * @description Returns how many items has such trait.
     */
    public size(): number {
        return this.indices.length;
    }

    /**
     * @description Returns all the indices of items with the current trait.
     */
    public items(): number[] {
        return this.indices;
    }

    /**
     * @description Determines if the item with the given index has the current
     * trait.
     * @param index The index of the item.
     */
    public has(index: number): boolean {
        if (!this.indicesSet) {
            this.indicesSet = new Set();
            this.indices.forEach(index => this.indicesSet!.add(index));
        }
        return this.indicesSet.has(index);
    }

    /**
     * @description All the listeners will be removed and indices will be reset.
     */
    public dispose(): void {
        this._onDidChange.dispose();
        this.indices = [];
    }
}


/**
 * @class A type of {@link IListViewRenderer} for rendering {@link ListTrait}.
 */
export class ListTraitRenderer<T> implements IListViewRenderer<T, HTMLElement> {

    public readonly type: RendererType;

    private _trait: ListTrait;

    constructor(trait: ListTrait) {
        this._trait = trait;
        this.type = hash(this._trait.traitID);
    }

    public render(element: HTMLElement): HTMLElement {
        return element;
    }

    public update(item: T, index: number, data: HTMLElement, size?: number): void {
        if (this._trait.has(index)) {
            data.classList.toggle(this._trait.traitID, true);
        } else {
            data.classList.toggle(this._trait.traitID, false);
        }
    }

    public dispose(element: HTMLElement): void {
        // do nothing
    }
}