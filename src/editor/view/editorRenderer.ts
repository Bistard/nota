import { IListViewRenderer, RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { EditorItem } from "src/editor/viewModel/editorItem";

export interface IEditorItemMetadata<TMetadata> {
    element: HTMLElement;
    nestedMetadata: TMetadata;
}

/**
 * @class A basic wrapper {@link IListViewRenderer} that used in {@link EditorView}.
 */
export class EditorItemRenderer<TMetadata> implements IListViewRenderer<EditorItem, IEditorItemMetadata<TMetadata>> {

    public readonly type: RendererType;

    private _renderer: IListViewRenderer<EditorItem, TMetadata>;

    constructor(
        nestedRenderer: IListViewRenderer<EditorItem, TMetadata>
    ) {
        this._renderer = nestedRenderer;
        this.type = nestedRenderer.type;
    }

    public render(element: HTMLElement): IEditorItemMetadata<TMetadata> {
        
        const container = document.createElement('div');
        container.className = 'editor-row';

        const metadata = this._renderer.render(element);
        
        container.appendChild(element);
        return { 
            element: element,
            nestedMetadata: metadata,
        };
    }

    public update(item: EditorItem, index: number, data: IEditorItemMetadata<TMetadata>, size?: number): void {
        this._renderer.update(item, index, data.nestedMetadata, size);
    }

    public dispose(data: IEditorItemMetadata<TMetadata>): void {
        this._renderer.dispose(data.nestedMetadata);
    }

}

export class HeadingRenderer implements IListViewRenderer<EditorItem, HTMLElement> {

    public readonly type = RendererType.MarkdownHeading;

    constructor() {

    }

    public render(element: HTMLElement): HTMLElement {
        return element;
    }

    public update(item: EditorItem, index: number, data: HTMLElement, size?: number): void {
        console.log(data);
    }

    public dispose(data: HTMLElement): void {
        
    }
}