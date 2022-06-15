import { IDisposable } from "src/base/common/dispose";
import { IRange } from "src/base/common/range";
import { IEditorViewComponent, IEditorViewContext, IRenderMetadata } from "src/editor/common/view";
import { EditorViewEventHandler } from "src/editor/view/component/editorViewEventHandler";
import { EditorViewContext } from "src/editor/view/editorView";

/**
 * @class // TODO
 */
export abstract class EditorViewComponent extends EditorViewEventHandler implements IEditorViewComponent {

    public readonly context: EditorViewContext;
    public readonly id: string;
    protected readonly _registeredView: IDisposable;

    constructor(id: string, context: EditorViewContext) {
        super();
        this.id = id;
        this.context = context;
        this._registeredView = this.context.viewModel.addViewComponent(id, this);
    }

    public abstract render(context: IRenderMetadata): void;

    public abstract getDomElement(): HTMLElement;
}

/**
 * @class A type of metadata used when rendering each {@link EditorViewComponent}
 * inside the {@link EditorView}. It contains all the information that might be
 * used during the rendering process.
 * 
 * @note The metadata only describes that moment of status.
 */
export class RenderMetadata implements IRenderMetadata {

    // [field]

    public readonly visibleRange: IRange;

    public readonly scrollHeight: number;
    public readonly scrollTop: number;

    // [constructor]

    constructor(private readonly context: IEditorViewContext) {
        const viewModel = context.viewModel;
        const lineWidget = viewModel.getLineWidget();

        this.visibleRange = lineWidget.getVisibleRange();
        this.scrollHeight = lineWidget.getViewportSize();
        this.scrollTop = lineWidget.getScrollPosition();
    }

    // [public methods]

}