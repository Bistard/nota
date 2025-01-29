import "src/editor/contrib/dragAndDropExtension/dropBlinkRenderer.scss";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { ProseDecoration, ProseDecorationSet, ProseEditorView } from "src/editor/common/proseMirror";
import { IEditorWidget } from "src/editor/editorWidget";

export class DropBlinkRenderer extends Disposable {

    // [fields]

    private _decorations: ProseDecorationSet;

    // [constructor]

    constructor(
        private readonly _editorWidget: IEditorWidget,
    ) {
        super();
        this._decorations = ProseDecorationSet.empty;
    }

    // [public methods]

    public setNodeBlink(view: ProseEditorView, position: number, nodeSize: number): void {
        // animation disabled, do nothing.
        if (this._editorWidget.getOptions().dropAnimation.value === false) {
            return;
        }
        
        const decoration = ProseDecoration.node(position, position + nodeSize, {
            class: 'drop-blink-animation'
        });
        this._decorations = ProseDecorationSet.create(view.state.doc, [decoration]);
        view.updateState(view.state);

        // delay: remove the decoration
        setTimeout(() => {
            this._decorations = ProseDecorationSet.empty;
            if (view && !view.isDestroyed) {
                view.updateState(view.state);
            }
        }, 500);
    }

    public getDecorations(): ProseDecorationSet {
        return this._decorations;
    }

    public override dispose(): void {
        super.dispose();
        this._decorations = ProseDecorationSet.empty;
    }
}