import type { IContextService } from "src/platform/context/common/contextService";
import { Disposable, type IDisposable } from "src/base/common/dispose";
import { RequestAnimateController } from "src/base/browser/basic/animation";
import { FastElement } from "src/base/browser/basic/fastElement";
import { getDropExactPosition } from "src/editor/common/cursorDrop";
import { EditorContextKeys } from "src/editor/common/editorContextKeys";
import { ProseEditorView } from "src/editor/common/proseMirror";

/**
 * Responsible for rendering drop cursor.
 */
export class DropCursorRenderer extends Disposable {

    // [fields]

    public readonly width: number = 3; // in pixel
    private _cursorPosition: number | null = null;
    private _cursorElement: FastElement<HTMLElement> | null = null;
    private readonly _animateController: RequestAnimateController<{ 
        mouseEvent: MouseEvent,
        view: ProseEditorView,
    }>;

    // [constructor]

    constructor(
        private readonly contextService: IContextService,
    ) {
        super();
        this._animateController = this.__register(new RequestAnimateController(({ mouseEvent, view }) => {
            if (view && view.isDestroyed) {
                return;
            }

            const isBlockDragging = this.contextService.contextMatchExpr(EditorContextKeys.isEditorBlockDragging);
            const position = getDropExactPosition(view, mouseEvent, isBlockDragging);
            if (position === this._cursorPosition) {
                return;
            }

            this._cursorPosition = position;
            this.__updateOverlay(view);
        }));
    }

    // [public methods]

    public render(view: ProseEditorView, event: MouseEvent): void {
        this._animateController.request({ mouseEvent: event, view });
    }

    public unrender(): void {
        this.release(this._cursorElement);
        this._cursorElement = null;
        this._cursorPosition = null;
        this._animateController.cancel();
    }

    public override dispose(): void {
        super.dispose();
        this.unrender();
    }

    // [private methods]

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
            this._cursorElement = this.__register(new FastElement(parent.appendChild(document.createElement('div'))));
            this._cursorElement.addClassList('editor-drop-cursor');
        }
    
        this._cursorElement.toggleClassName('drop-cursor-block', isBlock);
        this._cursorElement.toggleClassName('drop-cursor-inline', !isBlock);
    
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
    
        this._cursorElement.setLeft((rect.left - parentLeft) / scaleX);
        this._cursorElement.setTop((rect.top - parentTop) / scaleY);
        this._cursorElement.setWidth((rect.right - rect.left) / scaleX);
        this._cursorElement.setHeight((rect.bottom - rect.top) / scaleY);
    }
}