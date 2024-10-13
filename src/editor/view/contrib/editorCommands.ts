import { ReplaceAroundStep, canJoin, canSplit, liftTarget, replaceStep } from "prosemirror-transform";
import { Constructor } from "src/base/common/utilities/type";
import { ProseEditorState, ProseTransaction, ProseAllSelection, ProseTextSelection, ProseNodeSelection, ProseEditorView, ProseReplaceStep, ProseSlice, ProseFragment, ProseNode, ProseSelection, ProseContentMatch } from "src/editor/common/proseMirror";
import { ProseUtils } from "src/editor/common/proseUtility";
import type { IEditorCommandExtension } from "src/editor/view/contrib/commandExtension";
import { EditorResolvedPosition, IEditorResolvedPosition } from "src/editor/view/viewPart/editor/adapter/editorResolvedPosition";
import { ChainCommand, Command, ICommandSchema, buildChainCommand } from "src/platform/command/common/command";
import { CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";


/**
 * {@link EditorCommands}
 *  - {@link EditorCommands.Basic}
 *  - {@link EditorCommands.Composite}
 */

/**
 * @description A set of default editor command configurations.
 */
export function registerBasicEditorCommands(extension: IEditorCommandExtension): void {
    extension.registerCommand(EditorCommands.Composite.Enter, ['Enter']);
    extension.registerCommand(EditorCommands.Composite.Backspace, ['Backspace']);
    extension.registerCommand(EditorCommands.Composite.Delete, ['Delete', 'Meta+Delete', 'Ctrl+Delete']);
    extension.registerCommand(EditorCommands.Composite.SelectAll, ['Meta+A', 'Ctrl+A']);
    extension.registerCommand(EditorCommands.Composite.ExitCodeBlock, ['Meta+Enter', 'Ctrl+Enter']);
}

/**
 * @class A base class for every command in the {@link EditorCommandsBasic}.
 */
export abstract class EditorCommandBase extends Command {
    public abstract override run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void, view?: ProseEditorView): boolean | Promise<boolean>;
}

/**
 * @description Contains a list of commands specific for editor. The commands 
 * can be categorized into two groups:
 *  1. Basic commands,
 *  2. Composite commands.
 */
export namespace EditorCommands {

    /**
     * Every basic command is responsible for a very specific editor job. 
     * Usually these commands are only used when you know what you are doing. 
     * Otherwise consider the commands from {@link EditorCommands.Composite}.
     */
    export namespace Basic {

        export class SelectAll extends EditorCommandBase {
    
            public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void): boolean {
                const allSelect = new ProseAllSelection(state.doc);
                const tr = state.tr.setSelection(allSelect);
                dispatch?.(tr);
                return true;
            }
        }

        /**
         * @description Inserts a newline character in a code block at the current 
         * selection in the editor, but only under specific selection conditions.
         * 
         * @note The command checks if the current selection (cursor position) is 
         * within a node that is marked as a 'code' node (e.g. {@link CodeBlock}). 
         * If the selection meets this criteria, the function replaces the selection 
         * with a newline character.
         */
        export class InsertNewLineInCodeBlock extends EditorCommandBase {
    
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
        export class InsertEmptyParagraphAdjacentToBlock extends EditorCommandBase {
    
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
        export class LiftEmptyTextBlock extends EditorCommandBase {
    
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
        export class SplitBlockAtSelection extends EditorCommandBase {
    
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
        export class DeleteSelection extends EditorCommandBase {
    
            public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void): boolean {
                if (state.selection.empty) {
                    return false;
                }
    
                const newTr = state.tr.deleteSelection().scrollIntoView();
                dispatch?.(newTr);
                return true;
            }
        }
    
        /**
         * @description If the selection is empty and at the start of a textblock, 
         * try to reduce the distance between that block and the one before it—if
         * there's a block directly before it that can be joined, join them. If not, 
         * try to move the selected block closer to the next one in the document 
         * structure by lifting it out of its parent or moving it into a parent of 
         * the previous block. Will use the view for accurate (bidi-aware) start-of
         * -textblock detection if given.
         */
        export class JoinBackward extends EditorCommandBase {
    
            public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void, view?: ProseEditorView): boolean {
                const $cursor = __atBlockStart(state, view);
                if (!$cursor) {
                    return false;
                }
    
                const $cut = __findCutBefore($cursor);
    
                // If there is no node before this, try to lift.
                if (!$cut) {
                    const range = $cursor.blockRange();
                    const target = range && liftTarget(range);
                    if (target === null) {
                        return false;
                    }
    
                    const newTr = state.tr.lift(range!, target).scrollIntoView();
                    dispatch?.(newTr);
    
                    return true;
                }
    
                const before = $cut.nodeBefore!;
    
                // Apply the joining algorithm
                if (__deleteBarrier(state, $cut, dispatch, -1)) {
                    return true;
                }
    
                /**
                 * If the node below has no content and the node above is 
                 * selectable, delete the node below and select the one above.
                 */
                if ($cursor.parent.content.size === 0 &&
                    (__textblockAt(before, "end") || ProseNodeSelection.isSelectable(before))
                ) {
                    for (let depth = $cursor.depth; ; depth--) {
                        const delStep = <ProseReplaceStep>replaceStep(state.doc, $cursor.before(depth), $cursor.after(depth), ProseSlice.empty);
                        if (delStep && delStep.slice.size < delStep.to - delStep.from) {
                            if (dispatch) {
                                const tr = state.tr.step(delStep);
                                tr.setSelection(__textblockAt(before, "end")
                                    ? ProseSelection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos, -1)), -1)!
                                    : ProseNodeSelection.create(tr.doc, $cut.pos - before.nodeSize));
                                dispatch(tr.scrollIntoView());
                            }
                            return true;
                        }
                        if (depth === 1 || $cursor.getParentNodeAt(depth - 1)!.childCount > 1) {
                            break;
                        }
                    }
                }
    
                // If the node before is an atom, delete it.
                if (before.isAtom && $cut.depth === $cursor.depth - 1) {
                    const newTr = state.tr.delete($cut.pos - before.nodeSize, $cut.pos);
                    dispatch?.(newTr.scrollIntoView());
                    return true;
                }
    
                return false;
            }
        }
    
        /**
         * @description If the selection is empty and the cursor is at the end 
         * of a textblock, try to reduce or remove the boundary between that 
         * block and the one after it, either by joining them or by moving the 
         * other block closer to this one in the tree structure. Will use the 
         * view for accurate start-of-textblock detection if given.
         */
        export class joinForward extends EditorCommandBase {
    
            public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void, view?: ProseEditorView): boolean {
                const $cursor = __atBlockEnd(state, view);
                if (!$cursor) {
                    return false;
                }

                const $cut = __findCutAfter($cursor);
                
                // If there is no node after this, there's nothing to do
                if (!$cut) {
                    return false;
                }

                const after = $cut.nodeAfter!;
                // Try the joining algorithm
                if (__deleteBarrier(state, $cut, dispatch, 1)) {
                    return true;
                }

                // If the node above has no content and the node below is
                // selectable, delete the node above and select the one below.
                if ($cursor.parent.content.size === 0 &&
                    (__textblockAt(after, "start") || ProseNodeSelection.isSelectable(after))) {
                    const delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), ProseSlice.empty) as ProseReplaceStep;
                    if (delStep && delStep.slice.size < delStep.to - delStep.from) {
                    
                        if (dispatch) {
                            const tr = state.tr.step(delStep);
                            tr.setSelection(__textblockAt(after, "start") 
                                            ? ProseSelection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos)), 1)!
                                            : ProseNodeSelection.create(tr.doc, tr.mapping.map($cut.pos)));
                            dispatch(tr.scrollIntoView());
                        }
                        
                        return true;
                    }
                }

                // If the next node is an atom, delete it
                if (after.isAtom && $cut.depth === $cursor.depth - 1) {
                    if (dispatch) {
                        dispatch(state.tr.delete($cut.pos, $cut.pos + after.nodeSize).scrollIntoView());
                    }
                    return true;
                }

                return false;
            }
        }

        /**
         * @description When the selection is empty and at the start of a 
         * textblock, select the node before that textblock, if possible. This is 
         * intended to be bound to keys like backspace, after[`joinBackward`](#commands.joinBackward) 
         * or other deleting commands, as a fall-back behavior when the schema 
         * doesn't allow deletion at the selected point.
         */
        export class SelectNodeBackward extends EditorCommandBase {
    
            public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void, view?: ProseEditorView): boolean {
                const $head = new EditorResolvedPosition(state.selection.$head);
                const ifEmpty = state.selection.empty;
    
                let $cut: IEditorResolvedPosition | null = new EditorResolvedPosition($head);
                if (!ifEmpty) {
                    return false;
                }
    
                if ($head.parent.isTextblock) {
                    if (view ? !view.endOfTextblock("backward", state) : $head.parentOffset > 0) {
                        return false;
                    }
                    $cut = __findCutBefore($head);
                }
    
                const node = $cut && $cut.nodeBefore;
                if (!node || !ProseNodeSelection.isSelectable(node)) {
                    return false;
                }
    
                const newSelection = ProseNodeSelection.create(state.doc, $cut!.pos - node.nodeSize);
                const newTr = state.tr.setSelection(newSelection);
                dispatch?.(newTr.scrollIntoView());
    
                return true;
            }
        }

        /**
         * When the selection is empty and at the end of a textblock, select
         * the node coming after that textblock, if possible. This is intended
         * to be bound to keys like delete, after
         * [`joinForward`](#commands.joinForward) and similar deleting
         * commands, to provide a fall-back behavior when the schema doesn't
         * allow deletion at the selected point.
         */
        export class SelectNodeForward extends EditorCommandBase {
    
            public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void, view?: ProseEditorView): boolean {
                const { empty } = state.selection;
                if (!empty) {
                    return false;
                }

                const $head = new EditorResolvedPosition(state.selection.$head);
                let $cut: IEditorResolvedPosition | null = new EditorResolvedPosition($head);

                if ($head.parent.isTextblock) {
                    if (view ? !view.endOfTextblock("forward", state) : $head.parentOffset < $head.parent.content.size) {
                        return false;
                    }
                    $cut = __findCutAfter($head);
                }

                const node = $cut && $cut.nodeAfter;
                if (!node || !ProseNodeSelection.isSelectable(node)) {
                    return false;
                }
                
                const newSelection = ProseNodeSelection.create(state.doc, $cut!.pos);
                const newTr = state.tr.setSelection(newSelection);
                dispatch?.(newTr.scrollIntoView());
                
                return true;
            }
        }

        /**
         * @description A command that allows users to exit from a code block by 
         * creating a new default block (usually a paragraph) immediately after 
         * the code block and moving the cursor to that new block. 
         *
         * The command performs the following steps:
         * 1. It checks if the selection is entirely within a code block. This is 
         *    determined by verifying if the parent node of the current selection 
         *    has a `code` property in its spec, and ensuring the selection is not 
         *    spanning across multiple nodes.
         * 2. If the selection is inside a code block, it looks for the appropriate 
         *    default block type (e.g., paragraph) to insert after the code block, 
         *    ensuring the document structure allows for the new block to be placed 
         *    after the code block.
         * 3. If a valid block type is found and the document allows for the 
         *    insertion, it creates the new block at the position right after the 
         *    code block and moves the cursor into it.
         */
        export class ExitCodeBlock extends EditorCommandBase {
    
            public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void, view?: ProseEditorView): boolean {
                const { $head, $anchor } = state.selection;
                const isInCodeBlock = $head.parent.type.spec.code;
                const isSelectionCollapsed = $head.sameParent($anchor);

                // Ensure the selection is entirely within a single code block
                if (!isInCodeBlock || !isSelectionCollapsed) {
                    return false;
                }

                const parentNode = $head.node(-1);
                const nextNodeIndex = $head.indexAfter(-1);
                const blockType = __defaultBlockAt(parentNode.contentMatchAt(nextNodeIndex));

                // Check if the document structure allows inserting a new block after the code block
                if (!blockType || !parentNode.canReplaceWith(nextNodeIndex, nextNodeIndex, blockType)) {
                    return false;
                }

                // Proceed with creating the new block and updating the selection
                if (dispatch) {
                    const insertPosition = $head.after();
                    const newBlock = blockType.createAndFill();
                    const tr = state.tr.replaceWith(insertPosition, insertPosition, newBlock!);

                    // Move the selection to the new block
                    tr.setSelection(ProseSelection.near(tr.doc.resolve(insertPosition), 1));
                    dispatch(tr.scrollIntoView());
                }

                return true;
            }
        }
    }

    /**
     * Every composite command:
     *  - is a chain command, consists of multiple basic commands. 
     *  - represents a specific keyboard combination.
     */
    export namespace Composite {

        const _whenEditorFocused = CreateContextKeyExpr.Equal('isEditorFocused', true);
        function __buildCompositeCommand<TID extends EditorCommands.Composite.ID>(schema: ICommandSchema, ctors: Constructor<Command>[]): ChainCommand<TID> {
            return buildChainCommand(
                { 
                    ...schema,
                    when: CreateContextKeyExpr.And(_whenEditorFocused, schema.when),
                }, 
                ctors,
            );
        }

        /**
         * The identifiers for all the composite commands.
         */
        export const enum ID {
            Enter = 'editor-enter',
            Backspace = 'editor-backspace',
            Delete = 'editor-delete',
            SelectAll = 'editor-select-all',
            ExitCodeBlock = 'editor-exit-code-block',
        }
        
        export const Enter = __buildCompositeCommand<ID.Enter>(
            { 
                id: ID.Enter, 
                when: null,
            }, 
            [
                Basic.InsertNewLineInCodeBlock,
                Basic.InsertEmptyParagraphAdjacentToBlock,
                Basic.LiftEmptyTextBlock,
                Basic.SplitBlockAtSelection,
            ],
        );
        
        export const Backspace = __buildCompositeCommand<ID.Backspace>(
            { 
                id: ID.Backspace, 
                when: null,
            }, 
            [
                Basic.DeleteSelection,
                Basic.JoinBackward,
                Basic.SelectNodeBackward,
            ],
        );

        export const Delete = __buildCompositeCommand<ID.Delete>(
            {
                id: ID.Delete,
                when: null,
            },
            [
                Basic.DeleteSelection,
                Basic.joinForward,
                Basic.SelectNodeForward,
            ]
        );

        export const SelectAll = __buildCompositeCommand<ID.SelectAll>(
            {
                id: ID.SelectAll,
                when: null,
            },
            [
                Basic.SelectAll,
            ]
        );
        
        // @fix Doesn't work with CM, guess bcz CM is focused but PM is not.
        export const ExitCodeBlock = __buildCompositeCommand<ID.ExitCodeBlock>(
            {
                id: ID.ExitCodeBlock,
                when: null,
            },
            [
                Basic.ExitCodeBlock,
            ]
        );
    }
}

function __atBlockStart(state: ProseEditorState, view?: ProseEditorView): IEditorResolvedPosition | null {
    const { $cursor } = <ProseTextSelection>state.selection;
    if (!$cursor || (view ? !view.endOfTextblock("backward", state) : $cursor.parentOffset > 0)) {
        return null;
    }
    return new EditorResolvedPosition($cursor);
}

function __atBlockEnd(state: ProseEditorState, view?: ProseEditorView): IEditorResolvedPosition | null {
    const { $cursor } = state.selection as ProseTextSelection;
    if (!$cursor || (view ? !view.endOfTextblock("forward", state) : $cursor.parentOffset < $cursor.parent.content.size)) {
        return null;
    }
    return new EditorResolvedPosition($cursor);
  }

function __findCutBefore($pos: IEditorResolvedPosition): IEditorResolvedPosition | null {
    if ($pos.parent.type.spec.isolating) {
        return null;
    }

    for (let i = $pos.depth - 1; i >= 0; i--) {
        if ($pos.index(i) > 0) {
            const newPos = $pos.doc.resolve($pos.before(i + 1));
            return new EditorResolvedPosition(newPos);
        }

        if ($pos.getParentNodeAt(i)!.type.spec.isolating) {
            break;
        }
    }

    return null;
}

function __findCutAfter($pos: IEditorResolvedPosition): IEditorResolvedPosition | null {
    if ($pos.parent.type.spec.isolating) {
        return null;
    }

    for (let i = $pos.depth - 1; i >= 0; i--) {
        const parent = $pos.node(i);
        if ($pos.index(i) + 1 < parent.childCount) {
            const newPos = $pos.doc.resolve($pos.after(i + 1));
            return new EditorResolvedPosition(newPos);
        }
        if (parent.type.spec.isolating) {
            break;
        }
    }

    return null;
  }

function __deleteBarrier(state: ProseEditorState, $cut: IEditorResolvedPosition, dispatch: ((tr: ProseTransaction) => void) | undefined, dir: number) {
    const before = $cut.nodeBefore!;
    const after = $cut.nodeAfter!; 
    let conn, match; // TODO: type

    const isolated = before.type.spec.isolating || after.type.spec.isolating;
    if (!isolated && __joinMaybeClear(state, $cut, dispatch)) {
        return true;
    }

    const canDelAfter = !isolated && $cut.parent.canReplace($cut.index(), $cut.index() + 1);
    if (canDelAfter &&
        (conn = (match = before.contentMatchAt(before.childCount)).findWrapping(after.type)) &&
        match.matchType(conn[0] || after.type)!.validEnd) {
        if (dispatch) {
            const end = $cut.pos + after.nodeSize;
            let wrap = ProseFragment.empty;

            for (let i = conn.length - 1; i >= 0; i--) {
                wrap = ProseFragment.from(conn[i].create(null, wrap));
            }

            wrap = ProseFragment.from(before.copy(wrap));
            const tr = state.tr.step(new ReplaceAroundStep($cut.pos - 1, end, $cut.pos, end, new ProseSlice(wrap, 1, 0), conn.length, true));
            const joinAt = end + 2 * conn.length;
            if (canJoin(tr.doc, joinAt)) {
                tr.join(joinAt);
            }

            dispatch(tr.scrollIntoView());
        }
        return true;
    }

    const selAfter = after.type.spec.isolating || (dir > 0 && isolated) ? null : ProseSelection.findFrom($cut, 1);
    const range = selAfter && selAfter.$from.blockRange(selAfter.$to), target = range && liftTarget(range);
    if (target !== null && target >= $cut.depth) {
        if (dispatch) dispatch(state.tr.lift(range!, target).scrollIntoView());
        return true;
    }

    if (canDelAfter && __textblockAt(after, "start", true) && __textblockAt(before, "end")) {
        let at = before;
        const wrap: ProseNode[] = [];
        
        for (; ;) {
            wrap.push(at);
            if (at.isTextblock) {
                break;
            }
            at = at.lastChild!;
        }
        
        let afterText = after;
        let afterDepth = 1;

        for (; !afterText.isTextblock; afterText = afterText.firstChild!) {
            afterDepth++;
        }

        if (at.canReplace(at.childCount, at.childCount, afterText.content)) {
            if (!dispatch) {
                return true;
            }
            
            let end = ProseFragment.empty;
            for (let i = wrap.length - 1; i >= 0; i--) {
                end = ProseFragment.from(wrap[i]!.copy(end));
            }

            const tr = state.tr.step(
                new ReplaceAroundStep(
                    $cut.pos - wrap.length, $cut.pos + after.nodeSize,
                    $cut.pos + afterDepth, $cut.pos + after.nodeSize - afterDepth,
                    new ProseSlice(end, wrap.length, 0), 
                    0, 
                    true
                )
            );
            dispatch(tr.scrollIntoView());
            return true;
        }
    }

    return false;
}

function __textblockAt(node: ProseNode, side: "start" | "end", only = false): boolean {
    for (let scan: ProseNode | null = node; scan; scan = (side === "start" ? scan.firstChild : scan.lastChild)) {
        if (scan.isTextblock) {
            return true;
        }
        if (only && scan.childCount !== 1) {
            return false;
        }
    }
    return false;
}

function __joinMaybeClear(state: ProseEditorState, $pos: IEditorResolvedPosition, dispatch: ((tr: ProseTransaction) => void) | undefined): boolean {
    const before = $pos.nodeBefore;
    const after = $pos.nodeAfter;
    const index = $pos.index();

    if (!before || !after || !before.type.compatibleContent(after.type)) {
        return false;
    }

    if (!before.content.size && $pos.parent.canReplace(index - 1, index)) {
        const newTr = state.tr.delete($pos.pos - before.nodeSize, $pos.pos);
        dispatch?.(newTr.scrollIntoView());
        return true;
    }
    
    if (!$pos.parent.canReplace(index, index + 1) || !(after.isTextblock || canJoin(state.doc, $pos.pos))) {
        return false;
    }

    const newTr = state.tr
        .clearIncompatible($pos.pos, before.type, before.contentMatchAt(before.childCount))
        .join($pos.pos)
        .scrollIntoView();

    dispatch?.(newTr);
    return true;
}

function __defaultBlockAt(match: ProseContentMatch) {
    for (let i = 0; i < match.edgeCount; i++) {
        const { type } = match.edge(i);
        if (type.isTextblock && !type.hasRequiredAttrs()) {
            return type;
        }
    }
    return null;
}
