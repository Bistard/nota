import "src/editor/contrib/dragAndDropExtension/dragAndDropExtension.scss";
import { dropPoint } from "prosemirror-transform";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseEditorView } from "src/editor/common/proseMirror";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { getDropExactPosition } from "src/editor/common/cursorDrop";

export interface IEditorDragAndDropExtension extends IEditorExtension {
    readonly id: EditorExtensionIDs.DragAndDrop;
}

export class EditorDragAndDropExtension extends EditorExtension implements IEditorDragAndDropExtension {
    
    // [field]
    
    public readonly id = EditorExtensionIDs.DragAndDrop;
    public readonly width: number = 3; // in pixel

    private _cursorPosition: number | null = null;
    private _cursorElement: HTMLElement | null = null; // TODO: replace with FastElement

    // [constructor]

    constructor(editorWidget: IEditorWidget) {
        super(editorWidget);
    }

    // [override methods]

    protected override onViewInit(view: ProseEditorView): void {
        this.__register(this.onDragOver(e => { this.__onDragover(e.event, view); }));
        this.__register(this.onDragLeave(e => { this.__onDragleave(e.event, view); }));
        this.__register(this.onDrop(e => { this.__onDrop(e.browserEvent, view); }));
        this.__register(this.onDragEnd(e => { this.__onDragEnd(e.event, view); }));
    }

    // [private methods]

    private __renderCursor(position: number | null, view: ProseEditorView): void {
        if (position === this._cursorPosition) {
            return;
        }
        
        this._cursorPosition = position;
        if (position === null) {
            this._cursorElement?.remove();
            this._cursorElement = null;
            return;
        } 
        
        this.__updateOverlay(view);
    }

    private __updateOverlay(view: ProseEditorView): void {
        if (this._cursorPosition === null) {
            return;
        }
    
        /**
         * Resolve the document position to find the current node context and 
         * determine if we are dealing with a block-level element.
         */
        const $pos = view.state.doc.resolve(this._cursorPosition);
        const isBlock = !$pos.parent.inlineContent;
        let rect: { left: number; right: number; top: number; bottom: number } | undefined;
    
        const editorDOM = view.dom;
        const editorRect = editorDOM.getBoundingClientRect();
        const scaleX = editorRect.width / editorDOM.offsetWidth;
        const scaleY = editorRect.height / editorDOM.offsetHeight;
    
        /**
         * If the cursor is in a block-level position, determine the rectangle 
         * to represent the cursor visually.
         */
        if (isBlock) {
            const before = $pos.nodeBefore;
            const after = $pos.nodeAfter;
            if (before || after) {
                const offset = before ? before.nodeSize : 0;
                const node = view.nodeDOM(this._cursorPosition - offset);
                if (node) {
                    const nodeRect = (node as HTMLElement).getBoundingClientRect();
                    let top = before ? nodeRect.bottom : nodeRect.top;
    
                    if (before && after) {
                        const currentNode = view.nodeDOM(this._cursorPosition);
                        if (currentNode) {
                            const currentNodeRect = (currentNode as HTMLElement).getBoundingClientRect();
                            top = (top + currentNodeRect.top) / 2;
                        }
                    }
    
                    const halfWidth = (this.width / 2) * scaleY;
                    rect = {
                        left: nodeRect.left,
                        right: nodeRect.right,
                        top: top - halfWidth,
                        bottom: top + halfWidth
                    };
                }
            }
        }
    
        /**
         * If the position is not block-level and we are not restricting to block only,
         * calculate the cursor rectangle for inline content.
         */
        if (!rect) {
            const coords = view.coordsAtPos(this._cursorPosition);
            const halfWidth = (this.width / 2) * scaleX;
            rect = {
                left: coords.left - halfWidth,
                right: coords.left + halfWidth,
                top: coords.top,
                bottom: coords.bottom
            };
        }
    
        // start rendering

        const parent = editorDOM.offsetParent as HTMLElement;
        if (!this._cursorElement) {
            this._cursorElement = parent.appendChild(document.createElement('div'));
            this._cursorElement.classList.add('editor-drop-cursor');
        }
    
        this._cursorElement.classList.toggle('drop-cursor-block', isBlock);
        this._cursorElement.classList.toggle('drop-cursor-inline', !isBlock);
    
        let parentLeft: number, parentTop: number;
        if (!parent || (parent === document.body && getComputedStyle(parent).position === 'static')) {
            parentLeft = -window.scrollX;
            parentTop = -window.scrollY;
        } else {
            const parentRect = parent.getBoundingClientRect();
            const parentScaleX = parentRect.width / parent.offsetWidth;
            const parentScaleY = parentRect.height / parent.offsetHeight;
            parentLeft = parentRect.left - parent.scrollLeft * parentScaleX;
            parentTop = parentRect.top - parent.scrollTop * parentScaleY;
        }
    
        this._cursorElement.style.left = `${(rect.left - parentLeft) / scaleX}px`;
        this._cursorElement.style.top = `${(rect.top - parentTop) / scaleY}px`;
        this._cursorElement.style.width = `${(rect.right - rect.left) / scaleX}px`;
        this._cursorElement.style.height = `${(rect.bottom - rect.top) / scaleY}px`;
    }

    private __onDragover(event: DragEvent, view: ProseEditorView): void {
        if (!view.editable) {
            return;
        }
        const position = getDropExactPosition(view, event);
        this.__renderCursor(position, view);
        
        event.preventDefault();
    }

    private __onDragleave(event: DragEvent, view: ProseEditorView): void {
        if (!event.relatedTarget || !view.dom.contains(event.relatedTarget as Node)) {
            this.__renderCursor(null, view);
        }
    }

    private __onDrop(event: DragEvent, view: ProseEditorView): void {
        this.__renderCursor(null, view);
    }

    private __onDragEnd(event: DragEvent, view: ProseEditorView): void {
        this.__renderCursor(null, view);
    }
}
