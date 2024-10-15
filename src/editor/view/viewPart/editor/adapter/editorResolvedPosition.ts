import { mixin } from "src/base/common/utilities/object";
import { ProseNode, ProseResolvedPos } from "src/editor/common/proseMirror";

/**
 * An interface only for {@link EditorResolvedPosition}.
 */
export interface IEditorResolvedPosition extends ProseResolvedPos {

    /**
     * @description The exact same API as {@link getParentNodeAt}. Except making
     * depth = this.depth.
     * @note Wrapper of `this.node()`.
     */
    getCurrNode(): ProseNode;

    /**
     * @description Retrieves a parent node from the document structure at a 
     *              specified depth level relative to the root.
     * 
     * @note Wrapper of `this.node()`.
     * @note The depth is measured from the root of the document, where the root 
     *       node (usually the document itself) is at depth 0. This method allows 
     *       you to navigate the document tree and access ancestor nodes at 
     *       various levels of the hierarchy.
     * 
     * @param depth The depth level from the root at which to retrieve the node. 
     *   - Depth 0 always refers to the root document node.
     *   - A positive depth value specifies the nth level down from the root node.
     *   - When `depth` is negative, it is added to the current depth of the 
     *     resolved position, effectively moving upwards in the document tree. 
     *     This allows for relative upward navigation from the current node.
     * 
     * @note The method returns `undefined` if the specified depth exceeds the 
     *       bounds of the document structure, meaning the depth is greater than 
     *       the total number of levels in the document tree.
     * @note When using negative depths, if the calculated depth (current depth 
     *       + negative depth) is less than 0, the method will return undefined, 
     *       as it cannot go above the root of the document tree.
     * 
     * @example
     * ```ts
     * // Given a document structure:
     * // <doc>
     * //   <paragraph>Hello, </paragraph>
     * //   <paragraph>world!</paragraph>
     * // </doc>
     * 
     * // Assuming `pos` is a resolved position in the second paragraph:
     * pos.node();        // Returns the second <paragraph> node
     * pos.node(0);       // Returns the <doc> node
     * pos.node(pos.depth); // Same as pos.node(), returns the second <paragraph> node
     * pos.node(-1);      // Returns the parent of the node at the current position, which is also the <doc> node
     * 
     * // For a nested structure like:
     * // <doc>
     * //   <blockquote>
     * //     <paragraph>One</paragraph>
     * //     <paragraph>Two<img /></paragraph>
     * //   </blockquote>
     * // </doc>
     * 
     * // Assuming `pos` is inside the <paragraph> containing "Two":
     * pos.node(-1); // Returns the <paragraph> node containing "Two"
     * pos.node(-2); // Returns the <blockquote> node
     * ```
     */
    getParentNodeAt(depth: number): ProseNode | undefined;

    /**
     * @description Finds the deepest common ancestor node between this position 
     *              and the given position. The returned value is the depth at 
     *              which both positions share the same parent node.
     * 
     * ### Example 1: Positions within the same section but different paragraphs
     * 
     * Consider a document structured as:
     * 
     * ```plaintext
     * doc (depth 0)
     * └── section (depth 1)
     *     ├── paragraph (depth 2)
     *     │   └── text "Hello" (depth 3)
     *     └── paragraph (depth 2)
     *         └── text "World" (depth 3)
     * ```
     * 
     * ```js
     * const resolvedPos1 = doc.resolve(2);   // Inside first paragraph ("Hello")
     * const resolvedPos2 = doc.resolve(12);  // Inside second paragraph ("World")
     * 
     * // Since both positions are in different paragraphs but share the same section,
     * // the common ancestor depth will be 1 (the section node).
     * const sharedDepth = resolvedPos1.getCommonAncestorDepth(resolvedPos2.pos);
     * console.log(sharedDepth);  // Output: 1
     * ```
     * 
     * ### Example 2: One position is at the root and another is deep in the document
     * 
     * Consider a document structured similarly to Example 1. 
     * 
     * ```js
     * const resolvedPos1 = doc.resolve(0);   // Position at the start of the document (root)
     * const resolvedPos2 = doc.resolve(4);   // Inside first paragraph ("Hello")
     * 
     * // The only common ancestor is the root (depth 0), so the result is 0.
     * const sharedDepth = resolvedPos1.getCommonAncestorDepth(resolvedPos2.pos);
     * console.log(sharedDepth);  // Output: 0
     * ```
     * 
     * @param pos The position to compare with this one.
     * @returns The depth of the shared ancestor node, or 0 if the only common 
     *          ancestor is the root node.
     */
    getCommonAncestorDepth(pos: number): number;
}

/**
 * @description An wrapper for {@link ProseResolvedPos}. Additionally with more
 * readable documentations and APIs.
 */
export class EditorResolvedPosition extends ProseResolvedPos implements IEditorResolvedPosition {

    constructor(resolved: ProseResolvedPos) {
        /**
         * By the time I code, ProseMirror .d.ts files is not providing the 
         * parameters required by the constructor. We need to manually ignore 
         * the rules otherwise cannot compile.
         */
        //@ts-ignore
        super(resolved.pos, resolved.path, resolved.parentOffset);
        mixin(this, resolved, true);
    }

    public getParentNodeAt(depth: number): ProseNode | undefined {
        return this.node(depth);
    }

    public getCurrNode(): ProseNode {
        return this.node(this.depth);
    }

    public getCommonAncestorDepth(pos: number): number {
        return this.sharedDepth(pos);
    }
}

