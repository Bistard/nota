import { IListViewRenderer } from "src/base/browser/secondary/listView/listRenderer";
import { ViewItemType } from "src/base/browser/secondary/listView/listView";
import { disposeAll, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { hash } from "src/base/common/hash";

/**
 * The index changed in {@link ListTrait}.
 */
export type IListTraitEvent = number;

/**
 * @class A {@link ListTrait} implements a set of methods for toggling one type 
 * of the characteristic of items in {@link ListWidget}, such as item selecting
 * and focusing.
 */
export class ListTrait implements IDisposable {

    /**
     * A trait is a string that represents an CSS class.
     */
    public trait: string;

    private _onDidChange: Emitter<IListTraitEvent> = new Emitter<IListTraitEvent>();
    public onDidChange: Register<IListTraitEvent> = this._onDidChange.registerListener;

    private indices: Set<number>;

    constructor(trait: string) {
        this.trait = trait;
        this.indices = new Set();
    }

    /**
     * @description Sets the item with the current trait.
     * @param index The index of the item.
     * @param item The HTMLElement to be rendered.
     * @param fire If fires the onDidChange event.
     */
    public set(index: number, item: HTMLElement | null, fire: boolean = true): void {
        if (this.indices.has(index)) {
            return;
        }

        this.indices.add(index);
        if (item) {
            item.classList.toggle(this.trait, true);
        }

        if (fire) {
            this._onDidChange.fire(index);
        }
    }

    /**
     * @description Unsets the item with the current trait.
     * @param index The index of the item.
     * @param item The HTMLElement to be unrendered.
     * @param fire If fires the onDidChange event.
     */
    public unset(index: number, item: HTMLElement | null, fire: boolean = true): void {
        if (this.indices.has(index) === false) {
            return;
        }

        this.indices.delete(index);
        if (item) {
            item.classList.toggle(this.trait, false);
        }

        if (fire) {
            this._onDidChange.fire(index);
        }
    }

    /**
     * @description Returns how many items has such trait.
     */
    public size(): number {
        return this.indices.size;
    }

    /**
     * @description Returns all the indices of items with the current trait.
     */
    public items(): number[] {
        return Array.from(this.indices);
    }

    /**
     * @description Determines if the item with the given index has the current
     * trait.
     * @param index The index of the item.
     */
    public has(index: number): boolean {
        return this.indices.has(index);
    }

    /**
     * @description All the listeners will be removed and indices will be reset.
     */
    public dispose(): void {
        disposeAll([this._onDidChange]);
        this.indices.clear();
    }

}

export class ListTraitRenderer implements IListViewRenderer {

    public readonly type: ViewItemType;

    private _trait: ListTrait;

    constructor(trait: ListTrait) {
        this._trait = trait;
        this.type = hash(this._trait.trait);
    }

    public render(element: HTMLElement, _data: null): void {
        // do nothing
    }

    public update(element: HTMLElement, index: number, _data: null): void {
        if (this._trait.has(index)) {
            element.classList.toggle(this._trait.trait, true);
        } else {
            element.classList.toggle(this._trait.trait, false);
        }
    }

    public dispose(element: HTMLElement): void {
        // do nothing
    }

}