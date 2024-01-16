import { canSplit, liftTarget } from "prosemirror-transform";
import { ProseEditorState, ProseTransaction, ProseAllSelection, ProseContentMatch, ProseTextSelection, ProseNodeSelection, ProseNodeType, ProseEditorView } from "src/editor/common/proseMirror";
import { Command } from "src/platform/command/common/command";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";

export const enum KeyboardEditorCommands {
    Enter = 'editor-enter',
}

abstract class EditorCommand extends Command {
    
    public abstract override run(provider: IServiceProvider, state: ProseEditorState, dispatch?: ((tr: ProseTransaction) => void) | undefined, view?: ProseEditorView): boolean | Promise<boolean>;
}

export namespace EditorCommands {

    export class CreateNewLineInCodeBlock extends EditorCommand {

        public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: ((tr: ProseTransaction) => void) | undefined): boolean {
            const { $head, $anchor } = state.selection;
            if (!$head.parent.type.spec.code || !$head.sameParent($anchor)) {
                return false;
            }
    
            const tr = state.tr.insertText("\n")
                .scrollIntoView();
            dispatch?.(tr);
            
            return true;
        }
    }
    
    export class CreateParagraphNear extends EditorCommand {
    
        public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: ((tr: ProseTransaction) => void) | undefined): boolean {
            const selection = state.selection;
            const { $from, $to } = selection;
    
            if (selection instanceof ProseAllSelection || $from.parent.inlineContent || $to.parent.inlineContent) {
                return false;
            }
    
            const type = __defaultBlockAt($to.parent.contentMatchAt($to.indexAfter()));
            if (!type || !type.isTextblock) {
                return false;
            }
    
            if (!dispatch) {
                return true;
            }
    
            const side = (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to).pos;
            const tr = state.tr.insert(side, type.createAndFill()!);
    
            const newSelction = ProseTextSelection.create(tr.doc, side + 1);
            tr.setSelection(newSelction)
                .scrollIntoView();
    
            dispatch(tr);
            return true;
        }
    }
    
    export class liftEmptyBlock extends EditorCommand {
    
        public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: ((tr: ProseTransaction) => void) | undefined): boolean {
            const { $cursor } = state.selection as ProseTextSelection;
    
            if (!$cursor || $cursor.parent.content.size) {
                return false;
            }
    
            if ($cursor.depth > 1 && $cursor.after() !== $cursor.end(-1)) {
                const before = $cursor.before();
                if (canSplit(state.doc, before)) {
                    dispatch?.(state.tr.split(before).scrollIntoView());
                    return true;
                }
            }
    
            const range = $cursor.blockRange();
            const target = range && liftTarget(range);
            if (target === null) {
                return false;
            }
    
            const newTr = state.tr.lift(range!, target).scrollIntoView();
            dispatch?.(newTr);
            return true;
        }
    }
    
    export class SplitBlock extends EditorCommand {
    
        public run(provider: IServiceProvider, state: ProseEditorState, dispatch?: ((tr: ProseTransaction) => void) | undefined): boolean {
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
                const atEnd = $to.parentOffset === $to.parent.content.size;
                const tr = state.tr;
                if (state.selection instanceof ProseTextSelection || state.selection instanceof ProseAllSelection) {
                    tr.deleteSelection();
                }
    
                const deflt = $from.depth === 0 ? null : __defaultBlockAt($from.node(-1).contentMatchAt($from.indexAfter(-1)));
                let types = atEnd && deflt ? [{ type: deflt }] : undefined;
                let can = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);
    
                if (!types && !can && canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt ? [{ type: deflt }] : undefined)) {
                    if (deflt) {
                        types = [{ type: deflt }];
                    }
                    can = true;
                }
    
                if (can) {
                    tr.split(tr.mapping.map($from.pos), 1, types);
                    if (!atEnd && !$from.parentOffset && $from.parent.type !== deflt) {
                        const first = tr.mapping.map($from.before()), $first = tr.doc.resolve(first);
                        if (deflt && $from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt)) {
                            tr.setNodeMarkup(tr.mapping.map($from.before()), deflt);
                        }
                    }
                }
    
                dispatch(tr.scrollIntoView());
            }
    
            return true;
        }
    }
}

function __defaultBlockAt(match: ProseContentMatch): ProseNodeType | null {
    for (let i = 0; i < match.edgeCount; i++) {
        const { type } = match.edge(i);
        if (type.isTextblock && !type.hasRequiredAttrs()) {
            return type;
        }
    }
    return null;
}