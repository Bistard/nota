import { FastElement } from "src/base/browser/basic/fastElement";
import { IListWidget, ListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { IEditorView } from "src/editor/common/view";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorItemRenderer, HeadingRenderer } from "src/editor/view/editorRenderer";
import { EditorViewComponent } from "src/editor/view/viewComponent/viewComponent";
import { EditorItem } from "src/editor/viewModel/editorItem";
import { requestAtNextAnimationFrame } from "src/base/common/animation";
import { DomUtility } from "src/base/common/dom";
/**
 * @class // TODO
 */
export class EditorView extends Disposable implements IEditorView {

    // [field]

    private readonly _element: FastElement<HTMLElement>;
    private readonly _listWidget: IListWidget<EditorItem>;

    private readonly _viewModel: IEditorViewModel;

    private readonly _viewComponents: Map<string, EditorViewComponent>;

    private _nextRenderFrame: IDisposable | null = null;

    // [event]

    // [constructor]

    constructor(
        container: HTMLElement,
        viewModel: IEditorViewModel,
    ) {
        super();

        this._element = new FastElement(document.createElement('div'));
        this._element.setClassName('editor-view');
        this._element.setAttribute('role', 'code');

        this._viewModel = viewModel;

        this._viewComponents = new Map();
        
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

    public render(now: boolean = false, everything: boolean = false): void {

        if (everything) {
            for (const [id, component] of this._viewComponents) {
                component.forceRender();
            }
        }

        if (now) {
            this.__doRender();
        } else {
            this.__requestRender();
        }
    }

    // REVIEW: testing purpose，view should be responsing to ViewModel and refreshing everything automatically instead of splciing manually.
    public splice(index: number, deleteCount: number, items: EditorItem[]): void {
        this._listWidget.splice(index, deleteCount, items);
    }

    // [public override on handle event methods]

    // [private helper methods]

    private __requestRender(): void {
        if (this._nextRenderFrame === null) {
            this._nextRenderFrame = requestAtNextAnimationFrame(() => this.__onRequestRender());
        }
    }

    private __onRequestRender(): void {
        this._nextRenderFrame?.dispose();
        this._nextRenderFrame = null;
        this.__doRender();
    }

    private __doRender(): void {
        
        if (DomUtility.ifInDomTree(this._element.element) === false) {
            return;
        }

        for (const [id, component] of this._viewComponents) {
            component.render();
            component.onDidRender();
        }

    }

}