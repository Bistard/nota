import { ListItemType } from "src/base/browser/secondary/listView/listView";

/**
 * @description An interface that describes how to render an item in 
 * {@link ListView} with an specific type.
 */
export interface IListViewRenderer<TMetadata> {
	/**
	 * The type of item that the renderer is responsible for.
	 */
	readonly type: ListItemType;

	/**
	 * @description Only creates and renders the DOM structure of that item for 
	 * initialization purpose.
	 * @param element The HTMLElement to be rendered.
	 * 
	 * @note This method only invoked when a new row is created in {@link ListViewCache}.
	 * Which is possibly invoked when inserting a new item into {@link ListView}.
	 * The rest of time should only invoke update() for updating attributes or 
	 * styles.
	 */
	render(element: HTMLElement): void;

	/**
	 * @description Only updates any attributes or styles to the given item in 
	 * the DOM.
	 * @param element The HTMLElement to be updated.
	 * @param index The index of the item in {@link ListView}.
	 * @param data The provided data for update purpose.
	 * @param size The size of the rendered element.
	 * 
	 * @note This method only invoked when inserting a new item into {@link ListView}.
	 */
	update(element: HTMLElement, index: number, data: TMetadata, size?: number): void;

	/**
	 * @description Dispose (destruct) the item.
	 * @param element The HTMLElement to be disposed.
	 * 
	 * @note This method only invoked when removing an existed item from {@link ListView}.
	 */
	dispose(element: HTMLElement): void;
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
export class PipelineRenderer<TMetadata> implements IListViewRenderer<TMetadata> {

	public readonly type: ListItemType;
	private pipeline: IListViewRenderer<TMetadata>[];
	
	constructor(type: ListItemType, renderers: IListViewRenderer<TMetadata>[]) {
		this.type = type;
		this.pipeline = renderers;
	}

	public render(element: HTMLElement): void {
		for (const renderer of this.pipeline) {
			renderer.render(element);
		}
	}

	public update(element: HTMLElement, index: number, data: any, size: number): void {
		for (const renderer of this.pipeline) {
			renderer.update(element, index, data, size);
		}
	}
 
	public dispose(element: HTMLElement): void {
		for (const renderer of this.pipeline) {
			renderer.dispose(element);
		}
	}

}

/**
 * @class A basic renderer that only rendering the size of the list item in the 
 * {@link IListView}.
 */
export class ListItemRenderer implements IListViewRenderer<null> {

	public readonly type: ListItemType;

	constructor() {
		this.type = NaN;
	}

	render(element: HTMLElement): void {
		
	}

	update(element: HTMLElement, index: number, data: null, size: number): void {
		element.style.height = size + 'px';
	}

	dispose(element: HTMLElement): void {
		
	}

}