import { IDisposable } from "src/base/common/dispose";
import { ProseEditorView } from "src/editor/common/proseMirror";

/**
 * Responsible for rendering drop cursor.
 */
export class DropCursorRenderer implements IDisposable {

    // [fields]

    public readonly width: number = 3; // in pixel
    private _cursorPosition: number | null = null;
    private _cursorElement: HTMLElement | null = null; // TODO: replace with FastElement

    // [constructor]

    constructor() {}

    // [public methods]

    public render(position: number, view: ProseEditorView): void {
        if (position === this._cursorPosition) {
            return;
        }
        this._cursorPosition = position;
        this.__updateOverlay(view);
    }

    public unrender(): void {
        this._cursorElement?.remove();
        this._cursorElement = null;
        this._cursorPosition = null;
    }

    public dispose(): void {
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
}