import "src/base/browser/secondary/widgetBar/widgetBar.scss";
import { IWidget } from "src/base/browser/basic/widget";
import { Disposable, disposeAll, IDisposable } from "src/base/common/dispose";
import { addDisposableListener, DomUtility, EventType, Orientation } from "src/base/browser/basic/dom";
import { FastElement } from "src/base/browser/basic/fastElement";
import { Arrays } from "src/base/common/utilities/array";

export interface IWidgetBar<T extends IWidget> extends IDisposable {
    
    /** 
     * The HTMLElement of the widget bar which contains `viewContainer` 
     */
    readonly container: FastElement<HTMLElement>;

    /** 
     * The list HTMLElement to stores all the actual HTMLElements of each widget 
     */
    readonly viewsContainer: HTMLElement;

    /**
     * Is the widget bar rendered.
     */
    readonly isRendered: boolean;

    /**
     * @description Renders the widget bar (appending the element into the 
     * provided parent element).
     * @param parentContainer Optional. Force to render under this container.
     */
    render(parentContainer?: HTMLElement): void;

    /**
     * @description Unrender the widget bar. You may still render again after 
     * unrender call.
     */
    unrender(): void;

    /**
     * @description Inserts the provided widget item into the bar.
     * @param item The widget item to be added.
     * @param index The index to be inserted at. If not given, pushes to the back 
     *  as default.
     * 
     * @note Method will invoke `item.item.render()` automatically.
     * @note The lifecycle of the provided item will be bond with the widget bar.
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
     * @returns Returns the corresponding widget, undefined if widget does not
     * exist.
     */
    getItem(id: string): T | undefined;
    
    /**
     * @description Determines if the widget item with the given id exists.
     * @param id The id of the widget item.
     * @returns If the item exists in the widget bar.
     */
    hasItem(id: string): boolean;

    /**
     * @description Returns an array of all the items.
     */
    items(): T[];

    /**
     * @description Gets the index of the widget which has the provided id.
     * @param id The id of the widget item.
     * @returns Returns the index of the widget in the bar. -1 if widget does not
     * exist.
     */
    getItemIndex(id: string): number;

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
 * An interface that stores widget and will be stored inside the widget bar.
 */
interface IWidgetBarItem<T> {
    readonly id: string;
    readonly data: T;
    /**
     * Client-provided disposable when the item is removed from the widget bar.
     */
    readonly disposable?: IDisposable;
}

/** 
 * @readonly The options for the WidgetBar. 
 */
export interface IWidgetBarOptions {

    /**
     * displaying vertical or horizontal.
     */
    readonly orientation: Orientation;

    /**
     * If provided, the {@link WidgetBar} will be rendered under this parent.
     */
    readonly parentContainer?: HTMLElement;

    /**
     * If render immediately after construction.
     * @default false
     */
    readonly render?: boolean;
}

function getDefaultOpts(): IWidgetBarOptions {
    return {
        parentContainer: undefined,
        orientation: Orientation.Horizontal,
        render: true,
    };
}

/**
 * @class A convenient tool to stores a sequence of Widgets and displays them in 
 * a sequential order.
 */
export class WidgetBar<T extends IWidget> extends Disposable implements IWidgetBar<T> {

    // [field]

    protected readonly opts: IWidgetBarOptions;

    protected _parentContainer?: HTMLElement;
    protected readonly _container: FastElement<HTMLElement>;
    protected readonly _itemContainer: HTMLElement;
    
    private _items: IWidgetBarItem<T>[];
    private _rendered: boolean;

    // [constructor]

    constructor(id: string, opts: IWidgetBarOptions) {
        super();

        this._items = [];
        this.opts = opts ?? getDefaultOpts();
        this._rendered = false;
        this._parentContainer = opts.parentContainer;

        this._container = this.__register(new FastElement(document.createElement('div')));
        this._container.addClassList('widget-bar', id);

        this._itemContainer = document.createElement('ui');
        this._itemContainer.classList.add('widget-item-container');

        if (this.opts.orientation === Orientation.Vertical) {
            this._itemContainer.style.display = 'block';
        }

        this._container.appendChild(this._itemContainer);
        if (opts?.render === true && this._parentContainer) {
            this._parentContainer.appendChild(this._container.raw);
            this._rendered = true;
        }
    }

    // [getter]

    get container(): FastElement<HTMLElement> {
        return this._container;
    }

    get viewsContainer(): HTMLElement {
        return this._itemContainer;
    }

    get isRendered(): boolean {
        return this._rendered;
    }

    // [public methods]

    public render(parentContainer?: HTMLElement): void {
        this._parentContainer ??= parentContainer;
        if (this._rendered || !this._parentContainer) {
            return;
        }
        this._parentContainer.appendChild(this._container.raw);
        this._rendered = true;
    }

    public unrender(): void {
        this._rendered = false;
        this._container.raw.remove();
    }

    public addItem(item: IWidgetBarItem<T>, index?: number): void {
        if (item.disposable) {
            this.__register(item.disposable);
        }

        // create a new view HTMLElement
        const newViewElement = document.createElement('li');
        newViewElement.classList.add('widget-item');

        // render the viewItem
        item.data.render(newViewElement);

        // prevent native context menu on the viewElement
        this.__register(addDisposableListener(newViewElement, EventType.contextmenu, (e) => {
            e.preventDefault();
        }));

        // index is not valid to be inserted, we insert at the end.
        if (index === undefined || index < 0 || index >= this._itemContainer.children.length) {
            this._itemContainer.appendChild(newViewElement);
            this._items.push(item);
        } 
        // index is valid.
        else {
            this._itemContainer.insertBefore(newViewElement, this._itemContainer.children[index]!);
            this._items.splice(index, 0, item);
        }
    }

    public removeItem(index: number): boolean {
        
        // index is invalid
        if (index < 0 || index >= this._itemContainer.children.length) {
            return false;
        }

        // remove the viewElement and the corresponding view.
        this._itemContainer.removeChild(this._itemContainer.childNodes[index]!);
        
        // dispose data if needed
        const toRemove = this._items.splice(index, 1)[0]!;
        this.release(toRemove.disposable);

        return true;
    }

    public getItem(id: string): T | undefined {
        return this._items.filter(item => item.id === id)[0]?.data;
    }

    public hasItem(id: string): boolean {
        return !!this.getItem(id);
    }

    public items(): T[] {
        return this._items.map(item => item.data);
    }

    public getItemIndex(id: string): number {
        for (let index = 0; index < this._items.length; index++) {
			if (this._items[index]!.id === id) {
				return index;
			}
		}
		return -1;
    }

    public clear(): number {
        this.__clearItems();
        return DomUtility.Modifiers.clearChildrenNodes(this._itemContainer);
    }

    public size(): number {
        return this._items.length;
    }

    public empty(): boolean {
        return this._items.length === 0;
    }

    public override dispose(): void {
        super.dispose();
        this.__clearItems();
    }

    private __clearItems(): void {
        disposeAll(Arrays.coalesce(this._items.map(each => each.disposable)));
        this._items = [];
    }
}