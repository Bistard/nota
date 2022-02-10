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
	 * @note This method only invoked when a new row is created in {@link ListViewCache}.
	 * Which is possibly invoked when inserting a new item into {@link ListView}.
	 * The rest of time should only invoke update() for updating attributes or 
	 * styles.
	 */
	render(element: HTMLElement, data: any): void;

	/**
	 * @description Only updates any attributes or styles to the given item in 
	 * the DOM.
	 * @param element The HTMLElement to be updated.
	 * @param index The index of the item in {@link ListView}.
	 * @param data The provided data for update purpose.
	 * 
	 * @note This method only invoked when inserting a new item into {@link ListView}.
	 */
	update(element: HTMLElement, index: number, data: any): void;

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
export class PipelineRenderer implements IListViewRenderer {

	public readonly type: ViewItemType;
	private pipeline: IListViewRenderer[];
	
	constructor(type: ViewItemType, renderers: IListViewRenderer[]) {
		this.type = type;
		this.pipeline = renderers;
	}

	public render(element: HTMLElement, data: any): void {
		for (const renderer of this.pipeline) {
			renderer.render(element, data);
		}
	}

	public update(element: HTMLElement, index: number, data: any): void {
		for (const renderer of this.pipeline) {
			renderer.update(element, index, data);
		}
	}
 
	public dispose(element: HTMLElement): void {
		for (const renderer of this.pipeline) {
			renderer.dispose(element);
		}
	}

}