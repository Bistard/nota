import { DomUtility } from "src/base/browser/basic/dom";
import { Arrays } from "src/base/common/utilities/array";

/**
 * The type of renderers used in {@link IListView}.
 */
export type RendererType = string;

/**
 * A very basic type of metadata that may be used in the renderers relates to 
 * {@link IListView}.
 */
export interface IListViewMetadata {
	
	/**
	 * The HTMLElement container of the related item in the {@link IListView}.
	 */
	readonly container: HTMLElement;
}

/**
 * @description An interface that describes how to render an item in {@link ListView} 
 * with an specific type.
 * 
 * T: The type of element for updating.
 * TMetadata: type of the user-defined value which returned value by the method 
 *            `render()` for later updating / disposing.
 */
export interface IListViewRenderer<T, TMetadata> {
	
	/**
	 * Indicates the type of item that this renderer is responsible for rendering.
	 */
	readonly type: RendererType;

	/**
	 * @description Only creates and renders the DOM structure of that item for 
	 * initialization purpose.
	 * @param element The HTMLElement to be rendered.
	 * @returns Returns the user-defined data with the type `TMetadata` which 
	 * will be used later for updating / disposing.
	 * 
	 * @note This method only invoked when a new row is created in {@link ListViewCache}.
	 * Which is possibly invoked when inserting a new item into {@link ListView}.
	 * The rest of time should only invoke update() for updating attributes or 
	 * styles.
	 */
	render(element: HTMLElement): TMetadata;

	/**
	 * @description Only updates any attributes or styles to the given item in 
	 * the DOM.
	 * @param item The item with type T to be updated.
	 * @param index The index of the item in {@link ListView}.
	 * @param data The provided user-defined data for update purpose.
	 * @param size The size of the rendered item.
	 * 
	 * @note This method only invoked when (re)inserting the item back to the {@link ListView}.
	 */
	update(item: T, index: number, data: TMetadata, size?: number): void;

	/**
	 * @description Dispose (destruct) the item.
	 * @param data The user-defined data for disposing.
	 * 
	 * @note This method only invoked when 1) {@link ListViewCache} inside the 
	 * list view is disposed 2) {@link ListView} is disposed.
	 */
	dispose(data: TMetadata): void;

	/**
	 * @description Some type of renderers have stored internal data, they need 
	 * to be disposed when the item is removed from the DOM tree and that is what
	 * this method is doing.
	 * 
	 * @param item The item with type T to be updated.
	 * @param index The index of the item in {@link ListView}.
	 * @param data The provided user-defined data for update purpose.
	 * @param size The size of the rendered item.
	 */
	disposeData?(item: T, index: number, data: TMetadata, size?: number): void;
}

/**
 * @class A simple integrated renderer for rendering an item by providing 
 * multiple different renderers.
 * 
 * For example, in {@link ListWidget}, not just the provided renderers, each 
 * item will have some basic renderers for list focusing and selecting purposes.
 * This is where {@link PipelineRenderer} comes into the place by combining all
 * the renderers into one single integrated version.
 */
export class PipelineRenderer<T> implements IListViewRenderer<T, any[]> {

	public readonly type: RendererType;
	private pipeline: IListViewRenderer<T, any>[];
	
	constructor(type: RendererType, renderers: IListViewRenderer<T, any>[]) {
		this.type = type;
		this.pipeline = renderers;
	}

	public render(element: HTMLElement): any[] {
		return this.pipeline.map(r => r.render(element));
	}

	public update(item: T, index: number, data: any[], size?: number): void {
		Arrays.parallelEach([data, this.pipeline], (eachData, renderer) => {
			renderer.update(item, index, eachData, size);
		});
	}
 
	public dispose(data: any[]): void {
		Arrays.parallelEach([data, this.pipeline], (eachData, renderer) => {
			renderer.dispose(eachData);
		});
	}

}

/**
 * @class A basic renderer that only rendering the size of the list item in the 
 * {@link IListView}.
 * 
 * @note Setting the TMetadata type to {@link HTMLElement} so that when invoking
 * `update()`, the returned HTMLElement is the actual list item.
 */
export class ListItemRenderer<T> implements IListViewRenderer<T, HTMLElement> {

	public readonly type: RendererType = 'list-item';

	constructor() {}

	public render(element: HTMLElement): HTMLElement {
		return element;
	}

	public update(item: T, index: number, data: HTMLElement, size: number): void {
		if (DomUtility.Attrs.getContentHeight(data) !== size) {
			data.style.height = size + 'px';
		}
	}

	public dispose(data: HTMLElement): void {
		// noop
	}

}