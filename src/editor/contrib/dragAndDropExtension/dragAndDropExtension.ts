import { dropPoint } from "prosemirror-transform";
import { addDisposableListener } from "src/base/browser/basic/dom";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseEditorState, ProseEditorView } from "src/editor/common/proseMirror";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";

export interface IDragAndDropExtension extends IEditorExtension {
    readonly id: EditorExtensionIDs.DragAndDrop;
}

export class EditorDragAndDropExtension extends EditorExtension implements IDragAndDropExtension {
    public readonly id = EditorExtensionIDs.DragAndDrop;
    private _cursorPos: number | null = null;
    private _cursorElement: HTMLElement | null = null;
    private readonly width: number;
    private readonly color: string;

    constructor(editorWidget: IEditorWidget, width: number = 2, color: string = 'rgba(0, 0, 255, 0.5)') {
        super(editorWidget);
        this.width = width;
        this.color = color;
    }

    protected override onViewInit(view: ProseEditorView): void {
        ["dragover", "dragleave", "drop", "dragend"].forEach(eventType => {
            this.__register(addDisposableListener(view.dom, eventType as "dragover" | "dragleave" | "drop" | "dragend", 
                (event) => {
                switch (eventType) {
                    case "dragover":
                        this.__onDragover(event as DragEvent, view);
                        break;
                    case "dragleave":
                        this.__onDragleave(event as DragEvent, view);
                        break;
                    case "drop":
                        this.__onDrop(event as DragEvent, view);
                        break;
                    case "dragend":
                        this.__onDragEnd(event as DragEvent, view);
                        break;
                }
            }));
        });
    }

    protected override onViewUpdate(view: ProseEditorView, prevState: ProseEditorState): void {
        if (this._cursorPos !== null && prevState.doc !== view.state.doc) {
            if (this._cursorPos > view.state.doc.content.size) {
                console.log("Cursor position out of bounds, clearing cursor");
                this.__renderCursor(null, view);
            } else {
                this.__updateOverlay(view);
            }
        }
    }

    private __renderCursor(pos: number | null, view: ProseEditorView): void {
        console.log("Rendering cursor at position: ", pos);
        if (pos === this._cursorPos) {
            return;
        }
        
        this._cursorPos = pos;
        if (pos === null) {
            if (this._cursorElement && this._cursorElement.parentNode) {
                this._cursorElement.parentNode.removeChild(this._cursorElement);
            }
            this._cursorElement = null;
        } else {
            this.__updateOverlay(view);
        }
    }

    private __updateOverlay(view: ProseEditorView): void {
        console.log("Updating overlay for cursor position:", this._cursorPos);
        if (this._cursorPos === null) {
            console.log("Cursor position is null; exiting overlay update.");
            return;
        }
    
        const $pos = view.state.doc.resolve(this._cursorPos);
        const isBlock = !$pos.parent.inlineContent;
        let rect: { left: number; right: number; top: number; bottom: number } | undefined;
    
        const editorDOM = view.dom;
        const editorRect = editorDOM.getBoundingClientRect();
        const scaleX = editorRect.width / editorDOM.offsetWidth;
        const scaleY = editorRect.height / editorDOM.offsetHeight;
    
        if (isBlock) {
            console.log("Rendering block-level cursor");
    
            const before = $pos.nodeBefore;
            const after = $pos.nodeAfter;
            if (before || after) {
                const offset = before ? before.nodeSize : 0;
                const node = view.nodeDOM(this._cursorPos - offset);
                if (node) {
                    const nodeRect = (node as HTMLElement).getBoundingClientRect();
                    let top = before ? nodeRect.bottom : nodeRect.top;
    
                    if (before && after) {
                        const currentNode = view.nodeDOM(this._cursorPos);
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
                    console.log("Calculated block-level rect:", rect);
                }
            }
        }
    
        if (!rect) {
            const coords = view.coordsAtPos(this._cursorPos);
            const halfWidth = (this.width / 2) * scaleX;
            rect = {
                left: coords.left - halfWidth,
                right: coords.left + halfWidth,
                top: coords.top,
                bottom: coords.bottom
            };
            console.log("Calculated inline-level rect:", rect);
        }
    
        const parent = editorDOM.offsetParent as HTMLElement;
        if (!this._cursorElement) {
            this._cursorElement = parent.appendChild(document.createElement("div"));
            this._cursorElement.classList.add("editor-dnd-cursor");
            this._cursorElement.style.cssText = `
                position: absolute; 
                z-index: 50; 
                pointer-events: none;
                background-color: ${this.color};
            `;
            console.log("Cursor element created and added to DOM");
        }
    
        this._cursorElement.classList.toggle("prosemirror-dropcursor-block", isBlock);
        this._cursorElement.classList.toggle("prosemirror-dropcursor-inline", !isBlock);
    
        let parentLeft: number, parentTop: number;
        if (!parent || (parent === document.body && getComputedStyle(parent).position === "static")) {
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
    
        console.log("Cursor element final position and dimensions:", {
            left: this._cursorElement.style.left,
            top: this._cursorElement.style.top,
            width: this._cursorElement.style.width,
            height: this._cursorElement.style.height
        });
    }

    private __onDragover(event: DragEvent, view: ProseEditorView): void {
        console.log("Handling dragover event");
    
        if (!view || !view.editable) {
            console.log("View is not available or not editable");
            return;
        }
    
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
        console.log("Position calculated from dragover event:", pos);
    
        if (pos && pos.inside >= 0) {
            console.log("Position is inside the document:", pos.inside);
    
            let target: number | null = pos.pos;
            if (view.dragging && view.dragging.slice) {
                const point = dropPoint(view.state.doc, target, view.dragging.slice);
                console.log("Calculated drop point:", point);
                if (point !== null) target = point;
            }
    
            if (target !== null) {
                console.log("Final target position for cursor:", target);
                this.__renderCursor(target, view);
            }
        } else {
            console.log("No valid position found or position is outside document.");
        }
    
        event.preventDefault();
    }

    private __onDragleave(event: DragEvent, view: ProseEditorView): void {
        if (!event.relatedTarget || !view.dom.contains(event.relatedTarget as Node)) {
            console.log("Drag leave event: clearing cursor");
            this.__renderCursor(null, view);
        }
    }

    private __onDrop(event: DragEvent, view: ProseEditorView): void {
        console.log("Drop event triggered: clearing cursor");
        this.__renderCursor(null, view);
    }

    private __onDragEnd(event: DragEvent, view: ProseEditorView): void {
        console.log("Drag end event triggered: clearing cursor");
        this.__renderCursor(null, view);
    }
}
