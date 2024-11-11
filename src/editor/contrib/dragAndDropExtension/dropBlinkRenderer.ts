import "src/editor/contrib/dragAndDropExtension/dropBlinkRenderer.scss";
import { IDisposable } from "src/base/common/dispose";
import { ProseDecoration, ProseDecorationSet, ProseEditorView } from "src/editor/common/proseMirror";
import { IEditorWidget } from "src/editor/editorWidget";

export class DropBlinkRenderer implements IDisposable {

    // [fields]

    private _decorations: ProseDecorationSet;

    // [constructor]

    constructor(
        private readonly _editorWidget: IEditorWidget,
    ) {
        this._decorations = ProseDecorationSet.empty;
    }

    // [public methods]

    public setNodeBlink(view: ProseEditorView, position: number, nodeSize: number): void {
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

    public dispose(): void {
        this._decorations = ProseDecorationSet.empty;
    }
}