import "src/editor/contrib/dragAndDropExtension/dragAndDropExtension.scss";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseDecorationSource, ProseEditorState, ProseEditorView } from "src/editor/common/proseMirror";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { EditorDragState, getDropExactPosition } from "src/editor/common/cursorDrop";
import { IContextService } from "src/platform/context/common/contextService";
import { EditorContextKeys } from "src/editor/common/editorContextKeys";
import { DropCursorRenderer } from "src/editor/contrib/dragAndDropExtension/dropCursorRenderer";
import { IEditorDragEvent } from "src/editor/view/proseEventBroadcaster";
import { Numbers } from "src/base/common/utilities/number";
import { DropBlinkRenderer } from "src/editor/contrib/dragAndDropExtension/dropBlinkRenderer";
import { ScrollOnEdgeController } from "src/editor/contrib/dragAndDropExtension/scrollOnEdgeController";
import { nullable } from "src/base/common/utilities/type";

export interface IEditorDragAndDropExtension extends IEditorExtension {
    readonly id: EditorExtensionIDs.DragAndDrop;
}

export class EditorDragAndDropExtension extends EditorExtension implements IEditorDragAndDropExtension {
    
    // [field]
    
    public readonly id = EditorExtensionIDs.DragAndDrop;
    
    private readonly _cursorRenderer: DropCursorRenderer;
    private readonly _dropBlinkRenderer: DropBlinkRenderer;
    private readonly _scrollOnEdgeController: ScrollOnEdgeController;

    // [constructor]

    constructor(
        editorWidget: IEditorWidget,
        @IContextService private readonly contextService: IContextService,
    ) {
        super(editorWidget);
        this._cursorRenderer = this.__register(new DropCursorRenderer(contextService));
        this._dropBlinkRenderer = this.__register(new DropBlinkRenderer(editorWidget));
        this._scrollOnEdgeController = this.__register(new ScrollOnEdgeController(editorWidget));

        this.__register(this.onDragStart(e => { this.__onDragStart(e.event, e.view); }));
        this.__register(this.onDragOver(e => { this.__onDragover(e.event, e.view); }));
        this.__register(this.onDragLeave(e => { this.__onDragleave(e.event, e.view); }));
        this.__register(this.onDrop(e => { this.__onDropEditor(e.browserEvent, e.view); }));
        this.__register(this.onDropOverlay(e => { this.__onDropOverlay(e, e.view); }));
        this.__register(this.onDragEnd(e => { this.__onDragEnd(e.event, e.view); }));
    }

    // [override methods]

    protected override onViewDestroy(view: ProseEditorView): void {
        this._cursorRenderer.unrender();
    }

    protected override onDecoration(state: ProseEditorState): ProseDecorationSource | nullable {
        return this._dropBlinkRenderer.getDecorations();
    }

    // [private methods]

    private __onDragStart(event: DragEvent, view: ProseEditorView): void {
        /**
         * Only set to normal when we are not dragging. Ensure not overriding
         * any current dragging state.
         */
        if (this.contextService.contextMatchExpr(EditorContextKeys.isEditorDragging) === false) {
            this._editorWidget.updateContext('editorDragState', EditorDragState.Normal);
        }
    }

    private __onDragover(event: DragEvent, view: ProseEditorView): void {
        this._scrollOnEdgeController.attemptScrollOnEdge(event);
        
        if (!view.editable) {
            return;
        }

        this._cursorRenderer.render(view, event);
        event.preventDefault();
    }

    private __onDragleave(event: DragEvent, view: ProseEditorView): void {
        if (!event.relatedTarget || !view.dom.contains(event.relatedTarget as Node)) {
            this._cursorRenderer.unrender();
        }
    }

    private __onDropEditor(event: DragEvent, view: ProseEditorView): void {
        this.__dragAfterWork();
    }

    private __onDropOverlay(event: IEditorDragEvent, view: ProseEditorView): void {
        this.__dragAfterWork();
        
        if (!event.event.dataTransfer) {
            return;
        }

        const data = event.event.dataTransfer.getData('$nota-editor-block-handle');
        if (data === '') {
            // not a drop action from the drag-handle button, do nothing.
            return;
        }

        /**
         * Detect drop action from drag-handle button, we prevent default drop 
         * behavior from prosemirror.
         */
        event.event.preventDefault();

        const dragPosition = parseInt(data);
        const dropPosition = getDropExactPosition(view, event.event, true);
        if (dragPosition === dropPosition) {
            // drop at exact same position, do nothing.
            return;
        }

        const tr = view.state.tr;
        const node = tr.doc.nodeAt(dragPosition);
        if (!node) {
            return;
        }
        
        // Drop inside the dragged node, do nothing.
        if (Numbers.within(dropPosition, dragPosition, dragPosition + node.nodeSize, false, false)) {
            return;
        }

        /**
         * We need to consider for the offset caused by deletion.
         */
        const adjustedDropPosition = dragPosition < dropPosition 
            ? dropPosition - node.nodeSize 
            : dropPosition;

        // drop behavior
        tr.delete(dragPosition, dragPosition + node.nodeSize)
          .insert(adjustedDropPosition, node);
        //   .setSelection(ProseNodeSelection.create(tr.doc, adjustedDropPosition));
        
        // update view
        view.dispatch(tr);

        this._dropBlinkRenderer.setNodeBlink(view, adjustedDropPosition, node.nodeSize);

        /**
         * Since we are clicking the button outside the editor, we need to 
         * manually focus the editor after drop.
         */
        view.focus();
    }

    private __onDragEnd(event: DragEvent, view: ProseEditorView): void {
        this.__dragAfterWork();
    }

    private __dragAfterWork(): void {
        this._cursorRenderer.unrender();
        this._scrollOnEdgeController.clearCache();
        this._editorWidget.updateContext('editorDragState', EditorDragState.None);
    }
}
