import { dropPoint } from "prosemirror-transform";
import { ProseEditorView } from "src/editor/common/proseMirror";

/**
 * Describes how many possible states of dragging action in the editor.
 */
export const enum EditorDragState {
    /**
     * No dragging action presented in the editor.
     */
    None = 'none',
    
    /**
     * Dragging action that can dropped as inline-level or block-level.
     */
    Normal = 'normal',

    /**
     * Dragging action that can only dropped as block-level.
     */
    Block = 'block',
}

/**
 * @description Calculates the exact position within the ProseMirror document 
 * for dropping a dragged item based on the mouse event coordinates.
 * @returns The calculated document position for the drop cursor.
 */
export function getDropExactPosition(view: ProseEditorView, event: MouseEvent, blockLevelOnly: boolean): number {

    /**
     * Handle the case when the mouse is inside the editor, we try to find
     * the node at the exact mouse position (clientX and clientY).
     */
    const position = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (!blockLevelOnly && position && position.inside !== -1) {
        let target = position.pos;
        if (view.dragging) {
            const point = dropPoint(view.state.doc, target, view.dragging.slice);
            if (point !== null) {
                target = point;
            }
        }
        return target;
    }
    /**
     * Reach here might be either:
     *  1. `position` is null, means the mouse is dragging outside the editor.
     *  2. `position.inside = -1`, which means it is the node at the top level.
     * Either case, we render the cursor only in block-level.
     */
    else {
        const mouseY = event.clientY;
        const viewRect = view.dom.getBoundingClientRect();
        const position = view.posAtCoords({ left: viewRect.left, top: mouseY });
        
        // a node found at the mouse-y axis.
        if (position) {
            const target = position.inside === -1 ? position.pos : position.inside;
            return target;
        } 
        // node not found at y axis. Must be either above/below the entire editor.
        else {
            const docSize = view.state.doc.content.size;
            const target = mouseY > docSize ? docSize : 0;
            return target;
        }
    }
}