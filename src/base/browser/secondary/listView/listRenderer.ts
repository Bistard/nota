import { ViewItemType } from "src/base/browser/secondary/listView/listView";

export const enum ListViewRendererType {
	TEST,
	FILE,
	DIRECTORY
}

export interface IListViewRenderer {
	readonly type: ViewItemType;
	render(element: HTMLElement, data: any): void;
	dispose(element: HTMLElement): void;
}
