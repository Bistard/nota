import { IWidget, Widget } from "src/base/browser/basic/widget";
import { Disposable, disposeAll } from "src/base/common/dispose";
import { addDisposableListener, clearChildrenNodes, EventType } from "src/base/common/domNode";

export interface IWidgetBarItem extends IWidget {
    // right now, is equivalent with a IWidget.
}

export interface IWidgetBar extends IWidget {
    // TODO
}

export enum WidgetBarOrientation {
    Horizontal,
    Vertical
}

export interface IWidgetBarOptions {
    orientation: WidgetBarOrientation
}

/**
 * // TODO rename to WidgetBar
 */
export class WidgetBar<T extends IWidget> extends Disposable {

    protected readonly _container: HTMLElement;
    protected readonly _itemsContainer: HTMLElement;
    public items: T[];

    protected opts: IWidgetBarOptions;

    constructor(
        parentContainer: HTMLElement,
        opts: IWidgetBarOptions
    ) {
        super();

        this.items = [];
        this.opts = opts;

        this._container = document.createElement('div');
        this._container.classList.add('widget-bar');

        this._itemsContainer = document.createElement('ui');
        this._itemsContainer.classList.add('widget-list');

        if (this.opts.orientation === WidgetBarOrientation.Vertical) {
            this._itemsContainer.style.display = 'block';
        }

        this._container.appendChild(this._itemsContainer);
        parentContainer.appendChild(this._container);
    }

    get container(): HTMLElement {
        return this._container;
    }

    get viewsContainer(): HTMLElement {
        return this._itemsContainer;
    }

    public override dispose(): void {
        disposeAll(this.items);
        this.items = [];
        this._container.remove();
        super.dispose();
    }

    public addItem(item: T, index?: number): void {

        // create a new view HTMLElement
        const newViewElement = document.createElement('li');
        newViewElement.classList.add('widget-item');

        // render the viewItem
        item.render(newViewElement);

        // prevent native context menu on the viewElement
        this.__register(addDisposableListener(newViewElement, EventType.contextmenu, (e) => {
            e.preventDefault();
        }))

        if (index === undefined || index < 0 || index >= this._itemsContainer.children.length) {
            // index is not valid to be inserted, we insert at the end.
            this._itemsContainer.appendChild(newViewElement);
            this.items.push(item);
        } else {
            // index is valid.
            this._itemsContainer.insertBefore(newViewElement, this._itemsContainer.children[index]!);
            this.items.splice(index, 0, item);
        }

    }

    public removeItem(index: number): boolean {
        
        // index is invalid
        if (index < 0 || index >= this._itemsContainer.children.length) {
            return false;
        }

        // remove the viewElement and the corresponding view.
        this._itemsContainer.removeChild(this._itemsContainer.childNodes[index]!);
        disposeAll(this.items.splice(index, 1));

        return true;
    }

    // public getItem(id: string): T {
    //     // TODO use this.items.filter
    // }

    // public getItemIndex(id: string): number {

    // }

    // public hideItems(): void {

    // }

    public clearItems(): number {
        disposeAll(this.items);
        this.items = [];
        return clearChildrenNodes(this._itemsContainer);
    }

    public size(): number {
        return this.items.length;
    }

    public empty(): boolean {
        return this.items.length === 0;
    }

    public getItemWidth(index: number): number {
        // index is invalid
        if (index < 0 || index >= this._itemsContainer.children.length) {
            return -1;
        }

        const viewElement = this._itemsContainer.children[index]!;
        return viewElement.clientWidth;
    }

    public getItemHeight(index: number): number {
        // index is invalid
        if (index < 0 || index >= this._itemsContainer.children.length) {
            return -1;
        }

        const viewElement = this._itemsContainer.children[index]!;
        return viewElement.clientHeight;
    }

}