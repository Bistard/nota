import { canJoin, canSplit, liftTarget } from "prosemirror-transform";
import { Shortcut } from "src/base/common/keyboard";
import { ILogService } from "src/base/common/logger";
import { EditorContextKeys } from "src/editor/common/editorContextKeys";
import { TokenEnum } from "src/editor/common/markdown";
import { ProseEditorState, ProseTransaction, ProseEditorView, ProseNodeType, ProseFragment, ProseSlice, ProseReplaceAroundStep, ProseNodeRange, ProseSelection, ProseNodeSelection, ProseAttrs } from "src/editor/common/proseMirror";
import { IEditorCommandExtension } from "src/editor/contrib/command/command";
import { EditorCommandArguments, EditorCommandBase } from "src/editor/contrib/command/editorCommand";
import { IEditorWidget } from "src/editor/editorWidget";
import { Command, ICommandSchema } from "src/platform/command/common/command";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { ShortcutWeight } from "src/workbench/services/shortcut/shortcutRegistrant";

export function registerListCommands(extension: IEditorCommandExtension, logService: ILogService, getArguments: () => EditorCommandArguments): void {
    const schema = extension.getEditorSchema().unwrap();

    const listItemType = schema.getNodeType(TokenEnum.ListItem);
    if (!listItemType) {
        logService.warn(extension.id, `Cannot register the editor command (${TokenEnum.ListItem}) because the node type does not exists in the editor schema.`);
        return;
    }
    
    extension.registerCommand(
        EditorListCommands.splitListItem(
            { 
                id: 'editor-split-list-item', 
                when: EditorContextKeys.isEditorEditable,
                shortcutOptions: {
                    when: EditorContextKeys.isEditorEditable,
                    weight: ShortcutWeight.Editor,
                    shortcut: Shortcut.fromString('Enter'),
                    commandArgs: getArguments,
                }
            }, 
            listItemType,
            undefined,
        ), 
    );
    
    extension.registerCommand(
        EditorListCommands.sinkListItem(
            { 
                id: 'editor-sink-list-item', 
                when: EditorContextKeys.isEditorEditable,
                shortcutOptions: {
                    when: EditorContextKeys.isEditorEditable,
                    weight: ShortcutWeight.Editor,
                    shortcut: Shortcut.fromString('Tab'),
                    commandArgs: getArguments,
                }
            }, 
            listItemType,
        )
    );
    
    extension.registerCommand(
        EditorListCommands.liftListItem(
            { 
                id: 'editor-lift-list-item', 
                when: EditorContextKeys.isEditorEditable,
                shortcutOptions: {
                    when: EditorContextKeys.isEditorEditable,
                    weight: ShortcutWeight.Editor,
                    shortcut: Shortcut.fromString('Shift+Tab'),
                    commandArgs: getArguments,
                }
            }, 
            listItemType,
        )
    );
}

export namespace EditorListCommands {

    export function splitListItem<TType extends ProseNodeType>(schema: ICommandSchema, listItemType: TType, itemAttrs?: ProseAttrs): Command {
        return new class extends EditorCommandBase {
            public override run(provider: IServiceProvider, editor: IEditorWidget, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void, view?: ProseEditorView): boolean | Promise<boolean> {
                const { $from, $to, node } = state.selection as ProseNodeSelection;
                if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to)) {
                    return false;
                }
                
                const grandParent = $from.node(-1);
                if (grandParent.type !== listItemType) {
                    return false;
                }

                if ($from.parent.content.size === 0 && $from.node(-1).childCount === $from.indexAfter(-1)) {
                    // In an empty block. If this is a nested list, the wrapping
                    // list item should be split. Otherwise, bail out and let next
                    // command handle lifting.
                    if ($from.depth === 3 || $from.node(-3).type !== listItemType ||
                        $from.index(-2) !== $from.node(-2).childCount - 1
                    ) {
                        return false;
                    }

                    if (dispatch) {
                        let wrap = ProseFragment.empty;
                        const depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3;
                        
                        // Build a fragment containing empty versions of the structure
                        // from the outer list item to the parent node of the cursor
                        for (let d = $from.depth - depthBefore; d >= $from.depth - 3; d--)
                            wrap = ProseFragment.from($from.node(d).copy(wrap));

                        const depthAfter = $from.indexAfter(-1) < $from.node(-2).childCount 
                            ? 1
                            : $from.indexAfter(-2) < $from.node(-3).childCount 
                                ? 2 
                                : 3;
                        
                            // Add a second list item with an empty default start node
                        wrap = wrap.append(ProseFragment.from(listItemType.createAndFill()));
                        const start = $from.before($from.depth - (depthBefore - 1));
                        const tr = state.tr.replace(start, $from.after(-depthAfter), new ProseSlice(wrap, 4 - depthBefore, 0));
                        let sel = -1;
                        tr.doc.nodesBetween(start, tr.doc.content.size, (node, pos) => {
                            if (sel > -1) {
                                return false;
                            }
                            if (node.isTextblock && node.content.size === 0) {
                                sel = pos + 1;
                            }
                        });
                        if (sel > -1) {
                            tr.setSelection(ProseSelection.near(tr.doc.resolve(sel)));
                        }
                        dispatch(tr.scrollIntoView());
                    }
                    return true;
                }
                const nextType = $to.pos === $from.end() 
                    ? grandParent.contentMatchAt(0).defaultType 
                    : null;
                const tr = state.tr.delete($from.pos, $to.pos);
                const types = nextType 
                    ? [itemAttrs 
                        ? { type: listItemType, attrs: itemAttrs } 
                        : null, 
                        { type: nextType }] 
                    : undefined;
                
                if (!canSplit(tr.doc, $from.pos, 2, types)) {
                    return false;
                }

                if (dispatch) {
                    dispatch(tr.split($from.pos, 2, types).scrollIntoView());
                }
                return true;
            }
        }(schema);
    }

    export function liftListItem<TType extends ProseNodeType>(schema: ICommandSchema, listItemType: TType): Command {
        return new class extends EditorCommandBase {
            public override run(provider: IServiceProvider, editor: IEditorWidget, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void, view?: ProseEditorView): boolean | Promise<boolean> {
                const { $from, $to } = state.selection;
                const range = $from.blockRange($to, node => node.childCount > 0 && node.firstChild!.type === listItemType);
                if (!range) {
                    return false;
                }
                if (!dispatch) {
                    return true;
                }

                if ($from.node(range.depth - 1).type === listItemType) {
                    // Inside a parent list
                    return this.__liftToOuterList(state, dispatch, listItemType, range);
                } else {
                    // Outer list node
                    return this.__liftOutOfList(state, dispatch, range);
                }
            }

            private __liftToOuterList(state: ProseEditorState, dispatch: (tr: ProseTransaction) => void, listItemType: ProseNodeType, range: ProseNodeRange) {
                const tr = state.tr, end = range.end, endOfList = range.$to.end(range.depth);
                if (end < endOfList) {
                    // There are siblings after the lifted items, which must become
                    // children of the last item
                    tr.step(new ProseReplaceAroundStep(end - 1, endOfList, end, endOfList,
                        new ProseSlice(ProseFragment.from(listItemType.create(null, range.parent.copy())), 1, 0), 1, true));
                    range = new ProseNodeRange(tr.doc.resolve(range.$from.pos), tr.doc.resolve(endOfList), range.depth);
                }

                const target = liftTarget(range);
                if (target === null) {
                    return false;
                }

                tr.lift(range, target);
                const $after = tr.doc.resolve(tr.mapping.map(end, -1) - 1);
                if (canJoin(tr.doc, $after.pos) && $after.nodeBefore!.type === $after.nodeAfter!.type) {
                    tr.join($after.pos);
                }

                dispatch(tr.scrollIntoView());
                return true;
            }

            private __liftOutOfList(state: ProseEditorState, dispatch: (tr: ProseTransaction) => void, range: ProseNodeRange) {
                const tr = state.tr, list = range.parent;

                // Merge the list items into a single big item
                for (let pos = range.end, i = range.endIndex - 1, e = range.startIndex; i > e; i--) {
                    pos -= list.child(i).nodeSize;
                    tr.delete(pos - 1, pos + 1);
                }

                const $start = tr.doc.resolve(range.start), item = $start.nodeAfter!;
                if (tr.mapping.map(range.end) !== range.start + $start.nodeAfter!.nodeSize) {
                    return false;
                }

                const atStart = range.startIndex === 0, atEnd = range.endIndex === list.childCount;
                const parent = $start.node(-1), indexBefore = $start.index(-1);
                if (!parent.canReplace(indexBefore + (atStart ? 0 : 1), indexBefore + 1,
                    item.content.append(atEnd ? ProseFragment.empty : ProseFragment.from(list)))
                ) {
                    return false;
                }

                const start = $start.pos, end = start + item.nodeSize;
                // Strip off the surrounding list. At the sides where we're not at
                // the end of the list, the existing list is closed. At sides where
                // this is the end, it is overwritten to its end.
                tr.step(
                    new ProseReplaceAroundStep(
                        start - (atStart ? 1 : 0),
                        end + (atEnd ? 1 : 0),
                        start + 1,
                        end - 1,
                        new ProseSlice(
                            (atStart
                                ? ProseFragment.empty
                                : ProseFragment.from(list.copy(ProseFragment.empty))).append(
                                    atEnd
                                        ? ProseFragment.empty
                                        : ProseFragment.from(list.copy(ProseFragment.empty))
                                ),
                            atStart ? 0 : 1,
                            atEnd ? 0 : 1
                        ),
                        atStart ? 0 : 1
                    ));
                dispatch(tr.scrollIntoView());
                return true;
            }
        }(schema);
    }

    export function sinkListItem<TType extends ProseNodeType>(schema: ICommandSchema, listItemType: TType): Command {
        return new class extends EditorCommandBase {
            public override run(provider: IServiceProvider, editor: IEditorWidget, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void, view?: ProseEditorView): boolean | Promise<boolean> {
                const { $from, $to } = state.selection;
                const range = $from.blockRange($to, node => node.childCount > 0 && node.firstChild!.type === listItemType);
                if (!range) {
                    return false;
                }
                const startIndex = range.startIndex;
                if (startIndex === 0) {
                    return false;
                }
                const parent = range.parent, nodeBefore = parent.child(startIndex - 1);
                if (nodeBefore.type !== listItemType) {
                    return false;
                }

                if (dispatch) {
                    const nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type === parent.type;
                    const inner = ProseFragment.from(nestedBefore ? listItemType.create() : null);
                    const slice = new ProseSlice(
                        ProseFragment.from(
                            listItemType.create(
                                null,
                                ProseFragment.from(parent.type.create(null, inner))
                            )
                        ),
                        nestedBefore ? 3 : 1,
                        0,
                    );
                    const before = range.start, after = range.end;
                    dispatch(state.tr.step(
                        new ProseReplaceAroundStep(
                            before - (nestedBefore ? 3 : 1),
                            after,
                            before,
                            after,
                            slice,
                            1,
                            true,
                        ))
                        .scrollIntoView());
                }

                return true;
            }
        }(schema);
    }
}