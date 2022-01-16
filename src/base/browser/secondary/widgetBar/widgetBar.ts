import { IWidget } from "src/base/browser/basic/widget";
import { Disposable, disposeAll, IDisposable } from "src/base/common/dispose";
import { addDisposableListener, clearChildrenNodes, EventType, Orientation } from "src/base/common/dom";

/**
 * @readonly An interface that stores widget and will be stored inside the widget bar.
 */
export interface IWidgetBarItem<T> extends IDisposable {
    id: string
    item: T,
    dispose: () => void;
}

export interface IWidgetBar<T extends IWidget> extends IWidget {
    /* The array container to contains all the widgets */
    items: IWidgetBarItem<T>[];

    /* The HTMLElement of the widget bar which contains `viewContainer` */
    container: HTMLElement;

    /* The list HTMLElement to stores all the actual HTMLElements of each widget */
    viewsContainer: HTMLElement;

    /**
     * @description Inserts the provided widget item into the bar.
     * @param item The widget item to be added.
     * @param index The index to be inserted at. If not given, pushes to the back 
     *  as default.
     */
    addItem(item: IWidgetBarItem<T>, index?: number): void;
    
    /**
     * @description Removes an existed widget item from the bar.
     * @param index The index to be removed. If index is invalid, a false will 
     * be returned.
     * @returns Tells wether the operation success.
     */
    removeItem(index: number): boolean;
    
    /**
     * @description Gets the widget item by their id.
     * @param id The id of the widget item.
     * @returns Returns the coressponding widget, undefined if widget does not
     * exist.
     */
    getItem(id: string): T | undefined;
    
    /**
     * @description Gets the index of the widget which has the provided id.
     * @param id The id of the widget item.
     * @returns Returns the index of the widget in the bar. -1 if wdiget does not
     * exist.
     */
    getItemIndex(id: string): number;
    
    // hide(): void;

    /** 
     * @description Clears all the existed widget items. 
     * @returns Returns the number of cleared widget items. */
    clear(): number;

    /** @description Returns the size of the bar. */
    size(): number;

    /** @description Determines if the bar is empty. */
    empty(): boolean;
}

/** 
 * @readonly The options for the WidgetBar. 
 */
export interface IWidgetBarOptions {
    orientation: Orientation // displaying vertical or horizontal
    // more and more...
}

/**
 * @class A convenient tool to stores a sequence of Widgets and displays them in 
 * sequential order.
 */
export class WidgetBar<T extends IWidget> extends Disposable {

    protected readonly _container: HTMLElement;
    protected readonly _itemsContainer: HTMLElement;
    protected opts: IWidgetBarOptions;

    public items: IWidgetBarItem<T>[];
    
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

        if (this.opts.orientation === Orientation.Vertical) {
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

    public addItem(item: IWidgetBarItem<T>, index?: number): void {

        // create a new view HTMLElement
        const newViewElement = document.createElement('li');
        newViewElement.classList.add('widget-item');

        // render the viewItem
        item.item.render(newViewElement);

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

    public getItem(id: string): T | undefined {
        return this.items.filter(item => item.id === id)[0]?.item;
    }

    public getItemIndex(id: string): number {
        for (let index = 0; index < this.items.length; index++) {
			if (this.items[index]!.id === id) {
				return index;
			}
		}
		return -1;
    }

    // public hide(): void {
    //   // TODO
    // }

    public clear(): number {
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

}