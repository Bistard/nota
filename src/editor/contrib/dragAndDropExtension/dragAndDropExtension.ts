import "src/editor/contrib/dragAndDropExtension/dragAndDropExtension.scss";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseEditorView } from "src/editor/common/proseMirror";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { EditorDragState, getDropExactPosition } from "src/editor/common/cursorDrop";
import { IContextService } from "src/platform/context/common/contextService";
import { EditorContextKeys } from "src/editor/common/editorContextKeys";
import { DropCursorRenderer } from "src/editor/contrib/dragAndDropExtension/dropCursorRenderer";

export interface IEditorDragAndDropExtension extends IEditorExtension {
    readonly id: EditorExtensionIDs.DragAndDrop;
}

export class EditorDragAndDropExtension extends EditorExtension implements IEditorDragAndDropExtension {
    
    // [field]
    
    public readonly id = EditorExtensionIDs.DragAndDrop;
    private readonly _cursorRenderer: DropCursorRenderer;

    // [constructor]

    constructor(
        editorWidget: IEditorWidget,
        @IContextService private readonly contextService: IContextService,
    ) {
        super(editorWidget);
        this._cursorRenderer = this.__register(new DropCursorRenderer());
    }

    // [override methods]

    protected override onViewInit(view: ProseEditorView): void {
        this.__register(this.onDragStart(e => { this.__onDragStart(e.event, view); }));
        this.__register(this.onDragOver(e => { this.__onDragover(e.event, view); }));
        this.__register(this.onDragLeave(e => { this.__onDragleave(e.event, view); }));
        this.__register(this.onDrop(e => { this.__onDrop(e.browserEvent, view); }));
        this.__register(this.onDragEnd(e => { this.__onDragEnd(e.event, view); }));
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
        if (!view.editable) {
            return;
        }
        const isBlockDragging = this.contextService.contextMatchExpr(EditorContextKeys.isEditorBlockDragging);
        const position = getDropExactPosition(view, event, isBlockDragging);
        this._cursorRenderer.render(position, view);
        
        event.preventDefault();
    }

    private __onDragleave(event: DragEvent, view: ProseEditorView): void {
        if (!event.relatedTarget || !view.dom.contains(event.relatedTarget as Node)) {
            this._cursorRenderer.unrender();
        }
    }

    private __onDrop(event: DragEvent, view: ProseEditorView): void {
        this._cursorRenderer.unrender();
        this.__onDragOrDrop();
    }

    private __onDragEnd(event: DragEvent, view: ProseEditorView): void {
        this._cursorRenderer.unrender();
        this.__onDragOrDrop();
    }

    private __onDragOrDrop(): void {
        this._editorWidget.updateContext('editorDragState', EditorDragState.None);
    }
}
