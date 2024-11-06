import { dropPoint } from "prosemirror-transform";
import { addDisposableListener, EventType } from "src/base/browser/basic/dom";
import { Time, TimeUnit } from "src/base/common/date";
import { IUnbufferedScheduler } from "src/base/common/utilities/async";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseEditorState, ProseEditorView } from "src/editor/common/proseMirror";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";

export interface IDragAndDropExtension extends IEditorExtension {
    readonly id: EditorExtensionIDs.DragAndDrop;
}

export class EditorDragAndDropExtension extends EditorExtension implements IDragAndDropExtension {
    public readonly id = EditorExtensionIDs.DragAndDrop;
    private readonly _unbufferedScheduler: IUnbufferedScheduler<DragEvent> | undefined;
    private _cursorPos: number | null = null;
    private _cursorElement: HTMLElement | null = null;
    private width: number;

    constructor(editorWidget: IEditorWidget, unbufferedScheduler: IUnbufferedScheduler<DragEvent>, width: number = 2) {
        super(editorWidget);
        this._unbufferedScheduler = unbufferedScheduler;
        this.width = width;
        console.log("EditorDragAndDropExtension initialized with width:", width);
        if (!this._unbufferedScheduler) {
            console.log("UnbufferedScheduler is not initialized. Ensure it is passed correctly.");
        }
    }

    protected override onViewInit(view: ProseEditorView): void {
        console.log("onViewInit called");
        this.__register(addDisposableListener(view.dom, EventType.dragover, event => {
            console.log("Dragover event triggered");
            if (this._unbufferedScheduler) {
                this._unbufferedScheduler.schedule(event);
                this.__onDragover(event, view);
            }
        }));
        this.__register(addDisposableListener(view.dom, EventType.dragleave, event => {
            console.log("Dragleave event triggered");
            if (this._unbufferedScheduler) {
                this._unbufferedScheduler.schedule(event);
                this.__onDragleave(event, view);
            }
        }));
        this.__register(addDisposableListener(view.dom, EventType.drop, event => {
            console.log("Drop event triggered");
            if (this._unbufferedScheduler) {
                this._unbufferedScheduler.schedule(event);
                this.__onDrop(event, view);
            }
        }));
        this.__register(addDisposableListener(view.dom, EventType.dragend, event => {
            console.log("Dragend event triggered");
            if (this._unbufferedScheduler) {
                this._unbufferedScheduler.schedule(event);
                this.__onDragEnd(event, view);
            }
        }));
    }

    protected override onViewUpdate(view: ProseEditorView, prevState: ProseEditorState): void {
        console.log("onViewUpdate called");
        if (this._cursorPos !== null && prevState.doc !== view.state.doc) {
            if (this._cursorPos > view.state.doc.content.size) {
                console.log("Cursor position out of bounds, clearing cursor");
                this.__renderCursor(null, view);
            } else {
                this.__updateOverlay(view);
            }
        }
    }

    protected override onViewDestroy(view: ProseEditorView): void {
        console.log("onViewDestroy called");
        this.dispose();
        this._unbufferedScheduler?.cancel();
    }

    private __renderCursor(pos: number | null, view: ProseEditorView): void {
        console.log("Attempting to render cursor at position:", pos);
        if (pos === this._cursorPos) {
            console.log("Position is the same as current cursor position; no action taken.");
            return;
        }
        
        this._cursorPos = pos;
        if (pos === null) {
            console.log("Clearing cursor element");
            if (this._cursorElement && this._cursorElement.parentNode) {
                this._cursorElement.parentNode.removeChild(this._cursorElement);
            }
            this._cursorElement = null;
        } else {
            console.log("Rendering cursor at new position:", pos);
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
            this._cursorElement.style.cssText = "position: absolute; z-index: 50; pointer-events: none;";
            console.log("Cursor element created and added to DOM");
        }
    
        this._cursorElement.classList.toggle("prosemirror-dropcursor-block", isBlock);
        this._cursorElement.classList.toggle("prosemirror-dropcursor-inline", !isBlock);
    
        // Calculate parent offsets
        let parentLeft: number, parentTop: number;
        if (!parent || (parent === document.body && getComputedStyle(parent).position === "static")) {
            parentLeft = -window.pageXOffset;
            parentTop = -window.pageYOffset;
        } else {
            const parentRect = parent.getBoundingClientRect();
            const parentScaleX = parentRect.width / parent.offsetWidth;
            const parentScaleY = parentRect.height / parent.offsetHeight;
            parentLeft = parentRect.left - parent.scrollLeft * parentScaleX;
            parentTop = parentRect.top - parent.scrollTop * parentScaleY;
        }
    
        // Set the position and size of the cursor element based on calculated `rect`
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
    
            // Check if the drop cursor is disabled for this node
            const node = view.state.doc.nodeAt(pos.inside);
            const disableDropCursor = node && node.type.spec["disableDropCursor"];
            const isDisabled = typeof disableDropCursor === "function"
                ? disableDropCursor(view, pos, event)
                : disableDropCursor;
    
            console.log("Drop cursor disabled:", isDisabled);
    
            if (!isDisabled) {
                // Calculate the target position, taking into account any dragging slice
                let target: number | null = pos.pos;
                console.log("Initial target position:", target);
    
                if (view.dragging && view.dragging.slice) {
                    const point = dropPoint(view.state.doc, target, view.dragging.slice);
                    console.log("Calculated drop point:", point);
                    if (point !== null) target = point;
                }
    
                // Set the cursor and schedule its removal
                if (target !== null) {
                    console.log("Final target position for cursor:", target);
                    this.__renderCursor(target, view);  // This should now call __renderCursor
    
                    const time = new Time(TimeUnit.Milliseconds, 5000);
                    if (this._unbufferedScheduler) {
                        console.log("Scheduling cursor removal with _unbufferedScheduler after 5000 ms");
                        this._unbufferedScheduler.schedule(event, time);
                    }
                }
            } else {
                console.log("Drop cursor is disabled for this node.");
            }
        } else {
            console.log("No valid position found or position is outside document.");
        }
    
        event.preventDefault();
    }
    

    private __onDragleave(event: DragEvent, view: ProseEditorView): void {
        const editorView = view;
        if (!editorView || (event.relatedTarget && editorView.dom.contains(event.relatedTarget as Node))) return;
        this.__renderCursor(null, editorView);
    }

    private __onDrop(event: DragEvent, view: ProseEditorView): void {
        this.__renderCursor(null, view);
    }

    private __onDragEnd(event: DragEvent, view: ProseEditorView): void {
        const editorView = view;
        this.__renderCursor(null, editorView);
    }
}
