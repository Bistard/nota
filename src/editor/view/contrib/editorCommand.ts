import { canSplit, liftTarget } from "prosemirror-transform";
import { ProseEditorState, ProseTransaction, ProseAllSelection, ProseTextSelection, ProseNodeSelection, ProseEditorView } from "src/editor/common/proseMirror";
import { ProseUtils } from "src/editor/common/proseUtility";
import { Command } from "src/platform/command/common/command";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";

abstract class EditorCommand extends Command {

    public abstract override run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void, view?: ProseEditorView): boolean | Promise<boolean>;
}

export namespace EditorCommands {

    /**
     * @description Inserts a newline character in a code block at the current 
     * selection in the editor, but only under specific selection conditions.
     * 
     * @note The command checks if the current selection (cursor position) is 
     * within a node that is marked as a 'code' node (e.g. {@link CodeBlock}). 
     * If the selection meets this criteria, the function replaces the selection 
     * with a newline character.
     */
    export class insertNewLineInCodeBlock extends EditorCommand {

        public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void): boolean {
            const { $head, $anchor } = state.selection;
            if (!$head.parent.type.spec.code || !$head.sameParent($anchor)) {
                return false;
            }
    
            const tr = state.tr.insertText("\n").scrollIntoView();
            dispatch?.(tr);
            
            return true;
        }
    }

    /**
     * @description Inserts an empty paragraph either before or after a block 
     * node in the editor, depending on the position of the block node. The 
     * function adds a paragraph before the block node if it is the first child 
     * of its parent, otherwise, it adds a paragraph after the block node.
     */
    export class InsertEmptyParagraphAdjacentToBlock extends EditorCommand {
    
        public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void): boolean {
            const { $from, $to } = state.selection;

            // Check if the selection is not suitable for paragraph insertion.
            if (state.selection instanceof ProseAllSelection || $from.parent.inlineContent || $to.parent.inlineContent) {
                return false;
            }

            // Determine the default block type at the current position.
            const defaultBlockType = ProseUtils.getNextValidDefaultNodeTypeAt($to.parent, $to.indexAfter());
            
            // Check if the determined block type is valid and is a textblock.
            if (!defaultBlockType || !defaultBlockType.isTextblock) {
                return false;
            }

            if (!dispatch) {
                return true;
            }

            // Calculate the position to insert the new paragraph.
            const insertionPosition = (!$from.parentOffset && $to.index() < $to.parent.childCount) ? $from.pos : $to.pos;

            // Create and dispatch the transaction to insert the new paragraph.
            const transaction = state.tr.insert(insertionPosition, defaultBlockType.createAndFill()!);
            const newSelection = ProseTextSelection.create(transaction.doc, insertionPosition + 1);
            transaction.setSelection(newSelection).scrollIntoView();
            dispatch?.(transaction);

            return true;
        }
    }
    
    /**
     * @description Lifts an empty text block in the editor. This function 
     * checks if the cursor is positioned in an empty text block. If the block 
     * can be "lifted" (meaning moved out of its current context, like out of a 
     * list or a quote), the function performs this action.
     */
    export class LiftEmptyTextBlock extends EditorCommand {
    
        public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void): boolean {
            if (!(state.selection instanceof ProseTextSelection)) {
                return false;
            }
            
            const { $cursor: cursor } = state.selection;
            if (!cursor || cursor.parent.content.size) {
                return false;
            }

            /**
             * Attempt to lift the block if the cursor is deeper than one level 
             * and not at the end of its parent.
             */
            if (cursor.depth > 1 && cursor.after() !== cursor.end(-1)) {
                const before = cursor.before();
                if (canSplit(state.doc, before)) {
                    const newTr = state.tr.split(before).scrollIntoView();
                    dispatch?.(newTr);
                    return true;
                }
            }
    
            // Calculate the range and target for lifting the block
            const blockRange = cursor.blockRange();
            const target = blockRange && liftTarget(blockRange);
            if (target === null) {
                return false;
            }
    
            const newTr = state.tr.lift(blockRange!, target).scrollIntoView();
            dispatch?.(newTr);

            return true;
        }
    }
    
    /**
     * @description Splits a block in the editor at the current selection. If 
     * the selection is within a block, the function divides the block into two 
     * at that point.
     */
    export class SplitBlockAtSelection extends EditorCommand {
    
        public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void): boolean {
            const { $from, $to } = state.selection;
    
            if (state.selection instanceof ProseNodeSelection && state.selection.node.isBlock) {
                if (!$from.parentOffset || !canSplit(state.doc, $from.pos)) {
                    return false;
                }
    
                const newTr = state.tr.split($from.pos).scrollIntoView();
                dispatch?.(newTr);
                return true;
            }
    
            if (!$from.parent.isBlock) {
                return false;
            }
    
            if (dispatch) {
                const isAtEnd = $to.parentOffset === $to.parent.content.size;
                const tr = state.tr;
                
                // First, delete the selection.
                if (state.selection instanceof ProseTextSelection || state.selection instanceof ProseAllSelection) {
                    tr.deleteSelection();
                }
    
                /**
                 * A match that represents the rules for what content is valid 
                 * after the selection (from).
                 */
                const match = $from.node(-1).contentMatchAt($from.indexAfter(-1));
                const defaultType = $from.depth === 0 ? null : ProseUtils.getNextValidDefaultNodeType(match);
                let types = isAtEnd && defaultType ? [{ type: defaultType }] : undefined;
                let ifCanSplitAtPosition = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);
    
                if (!types && 
                    !ifCanSplitAtPosition && 
                    canSplit(tr.doc, tr.mapping.map($from.pos), 1, defaultType ? [{ type: defaultType }] : undefined)
                ) {
                    if (defaultType) {
                        types = [{ type: defaultType }];
                    }
                    ifCanSplitAtPosition = true;
                }
    
                if (ifCanSplitAtPosition) {
                    tr.split(tr.mapping.map($from.pos), 1, types);

                    // Additional logic for handling specific cases
                    if (!isAtEnd && !$from.parentOffset && $from.parent.type !== defaultType) {
                        const first = tr.mapping.map($from.before()), $first = tr.doc.resolve(first);
                        if (defaultType && $from.node(-1).canReplaceWith($first.index(), $first.index() + 1, defaultType)) {
                            tr.setNodeMarkup(tr.mapping.map($from.before()), defaultType);
                        }
                    }
                }
    
                dispatch?.(tr.scrollIntoView());
            }
    
            return true;
        }
    }

    /**
     * @description Delete the current selection.
     */
    export class DeleteSelection extends EditorCommand {

        public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void): boolean {
            if (state.selection.empty) {
                return false;
            }

            dispatch?.(state.tr.deleteSelection().scrollIntoView());
            return true;
        }
    }
    
    /// If the selection is empty and at the start of a textblock, try to
    /// reduce the distance between that block and the one before it—if
    /// there's a block directly before it that can be joined, join them.
    /// If not, try to move the selected block closer to the next one in
    /// the document structure by lifting it out of its parent or moving it
    /// into a parent of the previous block. Will use the view for accurate
    /// (bidi-aware) start-of-textblock detection if given.
    export class JoinBackward extends EditorCommand {

        public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void): boolean {
            
            // TODO
            return false;
        }
    }
}
