import { FastElement } from "src/base/browser/basic/fastElement";
import { IDisposable } from "src/base/common/dispose";
import { EditorViewEventHandler } from "src/editor/view/component/editorViewEventHandler";
import { EditorViewContext } from "src/editor/view/editorView";

/**
 * An interface only for {@link EditorViewComponent}.
 */
export interface IEditorViewComponent extends EditorViewEventHandler {

    /**
     * The id of the component.
     */
    readonly id: string;

    readonly context: EditorViewContext;

    render(): void;

    getDomElement(): HTMLElement;

}

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

    public abstract render(): void;

    public abstract getDomElement(): HTMLElement;
}