import { ViewItemType } from "src/base/browser/secondary/listView/listView";

/**
 * @description An interface that describes how to render an item in 
 * {@link ListView} with an specific type.
 */
export interface IListViewRenderer {
	/**
	 * The type of item that the renderer is responsible for.
	 */
	readonly type: ViewItemType;

	/**
	 * @description Only creates and renders the DOM structure of that item for 
	 * initialization purpose.
	 * @param element The HTMLElement to be rendered.
	 * @param data The provided data for initialization.
	 * 
	 * @note This method should be only invoked the a new row is created. The 
	 * rest of time should only invoke update() for updating attributes or styles.
	 */
	render(element: HTMLElement, data: any): void;

	/**
	 * @description Only updates any attributes or styles to the given item in 
	 * the DOM.
	 * @param element The HTMLElement to be updated.
	 * @param index The index of the item in {@link ListView}.
	 * @param data The provided data for update purpose.
	 */
	update(element: HTMLElement, index: number, data: any): void;

	/**
	 * @description Dispose (destruct) the item.
	 * @param element The HTMLElement to be disposed.
	 */
	dispose(element: HTMLElement): void;
}
