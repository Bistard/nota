import { FastElement } from "src/base/browser/basic/fastElement";
import { IListWidget, ListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { EditorItemRenderer, HeadingRenderer } from "src/editor/view/editorRenderer";
import { EditorItem } from "src/editor/viewModel/editorItem";
import { IEditorViewModel } from "src/editor/viewModel/editorViewModel";

/**
 * An interface only for {@link EditorView}.
 */
 export interface IEditorView extends IDisposable {

    layout(): void;

}

/**
 * @class // TODO
 */
export class EditorView extends Disposable implements IEditorView {

    // [field]

    private _element: FastElement<HTMLElement>;
    private _listWidget: IListWidget<EditorItem>;

    private _viewModel: IEditorViewModel;

    // [event]

    // [constructor]

    constructor(
        container: HTMLElement,
        viewModel: IEditorViewModel,
    ) {
        super();

        this._element = new FastElement(document.createElement('div'));
        this._element.setClassName('editor-view');

        this._viewModel = viewModel;

        this._listWidget = new ListWidget<EditorItem>(
            this._element.element, 
            [
                // default markdown renderers
                new HeadingRenderer(),

            ].map(renderer => new EditorItemRenderer(renderer)), 
            viewModel.getItemProvider(), 
            {
                // options
                layout: true
            }
        );

        container.appendChild(this._element.element);
    }

    // [public methods]

    public layout(): void {
        this._listWidget.layout();
    }

    // REVIEW: testing purpose，view should be responsing to ViewModel and refreshing everything automatically.
    public splice(index: number, deleteCount: number, items: EditorItem[]): void {
        this._listWidget.splice(index, deleteCount, items);
    }

    // [private helper methods]

}