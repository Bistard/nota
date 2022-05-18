import { IListViewRenderer, RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { ListTrait } from "src/base/browser/secondary/listWidget/listTrait";
import { hash } from "src/base/common/hash";

/**
 * @class // TODO
 */
 export class ListTraitRenderer<T> implements IListViewRenderer<T, HTMLElement> {

    public readonly type: RendererType;

    private _trait: ListTrait;

    constructor(trait: ListTrait) {
        this._trait = trait;
        this.type = hash(this._trait.trait);
    }

    public render(element: HTMLElement): HTMLElement {
        return element;
    }

    public update(item: T, index: number, data: HTMLElement, size?: number): void {
        if (this._trait.has(index)) {
            data.classList.toggle(this._trait.trait, true);
        } else {
            data.classList.toggle(this._trait.trait, false);
        }
    }

    public dispose(element: HTMLElement): void {
        // do nothing
    }

}