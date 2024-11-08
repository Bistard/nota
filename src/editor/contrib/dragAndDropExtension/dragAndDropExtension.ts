import "src/editor/contrib/dragAndDropExtension/dragAndDropExtension.scss";
import { dropPoint } from "prosemirror-transform";
import { addDisposableListener } from "src/base/browser/basic/dom";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseEditorState, ProseEditorView } from "src/editor/common/proseMirror";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";

export interface IEditorDragAndDropExtension extends IEditorExtension {
    readonly id: EditorExtensionIDs.DragAndDrop;
}

export class EditorDragAndDropExtension extends EditorExtension implements IEditorDragAndDropExtension {
    public readonly id = EditorExtensionIDs.DragAndDrop;
    private _cursorPos: number | null = null;
    private _cursorElement: HTMLElement | null = null;

    constructor(editorWidget: IEditorWidget) {
        super(editorWidget);
    }

    protected override onViewInit(view: ProseEditorView): void {
        this.__register(addDisposableListener(view.dom, 'dragover', (event: DragEvent) => {
            this.__onDragover(event, view);
        }));
    
        this.__register(addDisposableListener(view.dom, 'dragleave', (event: DragEvent) => {
            this.__onDragleave(event, view);
        }));
    
        this.__register(addDisposableListener(view.dom, 'drop', (event: DragEvent) => {
            this.__onDrop(event, view);
        }));
    
        this.__register(addDisposableListener(view.dom, 'dragend', (event: DragEvent) => {
            this.__onDragEnd(event, view);
        }));
    }

    protected override onViewUpdate(view: ProseEditorView, prevState: ProseEditorState): void {
        if (this._cursorPos !== null && prevState.doc !== view.state.doc) {
            if (this._cursorPos > view.state.doc.content.size) {
                this.__renderCursor(null, view);
            } else {
                this.__updateOverlay(view);
            }
        }
    }

    private __renderCursor(pos: number | null, view: ProseEditorView): void {
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
        if (this._cursorPos === null) {
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
    
                    const halfWidth = scaleY;
                    rect = {
                        left: nodeRect.left,
                        right: nodeRect.right,
                        top: top - halfWidth,
                        bottom: top + halfWidth
                    };
                }
            }
        }
    
        if (!rect) {
            const coords = view.coordsAtPos(this._cursorPos);
            const halfWidth = scaleX;
            rect = {
                left: coords.left - halfWidth,
                right: coords.left + halfWidth,
                top: coords.top,
                bottom: coords.bottom
            };
        }
    
        const parent = editorDOM.offsetParent as HTMLElement;
        if (!this._cursorElement) {
            this._cursorElement = parent.appendChild(document.createElement("div"));
            this._cursorElement.classList.add("editor-dnd-cursor");
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
    }

    private __onDragover(event: DragEvent, view: ProseEditorView): void {
        if (!view || !view.editable) {
            return;
        }
    
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
    
        if (pos && pos.inside >= 0) {
            let target: number | null = pos.pos;
            if (view.dragging && view.dragging.slice) {
                const point = dropPoint(view.state.doc, target, view.dragging.slice);
                if (point !== null) {
                    target = point;
                }
            }
    
            if (target !== null) {
                this.__renderCursor(target, view);
            }
        }
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
