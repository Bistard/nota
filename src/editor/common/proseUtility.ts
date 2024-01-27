import { ProseContentMatch, ProseEditorState, ProseNode, ProseNodeType } from "src/editor/common/proseMirror";
import { EditorResolvedPosition } from "src/editor/view/viewPart/editor/adapter/editorResolvedPosition";

/**
 * @description Contains a list of helper functions that relates to ProseMirror.
 * 
 * @note 
 * - The start of the document, right before the first content, is position 0.
 * - Entering or leaving a node that is not a leaf node (i.e. supports content) 
 *      counts as one token. So if the document starts with a paragraph, the 
 *      start of that paragraph counts as position 1.
 * - Each character in text nodes counts as one token. So if the paragraph at 
 *      the start of the document contains the word “hi”, position 2 is after 
 *      the “h”, position 3 after the “i”, and position 4 after the whole 
 *      paragraph.
 * - Leaf nodes that do not allow content (such as images) also count as a 
 *      single token.
 * @example
 * ```
 * 0   1 2 3 4    5
 *  <p> O n e </p>
 * 
 * 5            6   7 8 9 10     11    12             13
 *  <blockquote> <p> T w o  <img>  </p>  </blockquote>
 * ```
 */
export namespace ProseUtils {

    /**
     * @description Get the enitre document size.
     */
    export function getEntireDocumentSize(state: ProseEditorState): number {
        return state.doc.content.size;
    }

    /**
     * @description Get the entire content size of the given node.
     * @note The returned size includes the open and close tokens of the node.
     * @note DO NOT use this function for getting the entire document size. Use
     *      {@link getEntireDocumentSize} instead.
     */
    export function getNodeSize(node: ProseNode): number {
        return node.nodeSize;
    }

    export function getResolvedPositionAt(state: ProseEditorState, position: number): EditorResolvedPosition {
        return new EditorResolvedPosition(state.doc.resolve(position));
    }

    export function getNodeAt(state: ProseEditorState, position: number): ProseNode {
        return (new EditorResolvedPosition(state.doc.resolve(position))).getCurrNode();
    }

    export function getNextValidDefaultNodeTypeAt(node: ProseNode, position: number): ProseNodeType | null {
        const match = node.contentMatchAt(position);
        return getNextValidDefaultNodeType(match);
    }

    export function getNextValidDefaultNodeType(match: ProseContentMatch): ProseNodeType | null {
        for (let i = 0; i < match.edgeCount; i++) {
            const { type } = match.edge(i);
            if (type.isTextblock && !type.hasRequiredAttrs()) {
                return type;
            }
        }
        return null;
    }
}