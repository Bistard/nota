import { Shortcut } from "src/base/common/keyboard";
import { IS_MAC } from "src/base/common/platform";
import { IO } from "src/base/common/utilities/functional";
import { panic } from "src/base/common/utilities/panic";
import { EditorContextKeys } from "src/editor/common/editorContextKeys";
import { MarkEnum, TokenEnum } from "src/editor/common/markdown";
import { ProseMarkType, ProseNodeType } from "src/editor/common/proseMirror";
import { EditorCommands } from "src/editor/contrib/command/command.contrib";
import { EditorListCommands } from "src/editor/contrib/command/listCommand.contrib";
import { buildEditorCommand } from "src/editor/contrib/command/editorCommand";
import { ICommandRegistrant } from "src/platform/command/common/commandRegistrant";
import { CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";
import { IEditorService } from "src/workbench/services/editor/editor";
import { ShortcutWeight } from "src/workbench/services/shortcut/shortcutRegistrant";

export const rendererEditorCommandRegister = createRegister(
    RegistrantType.Command, 
    'rendererWorkbench',
    (registrant, provider) => {
        const editorService = provider.getOrCreateService(IEditorService);
        __registerListCommands(registrant, editorService);
        __registerToggleMarkCommands(registrant, editorService);
        __registerHeadingCommands(registrant, editorService);
        __registerBasicCommands(registrant, editorService);
    }
);

const whenEditorReadonly = CreateContextKeyExpr.And(EditorContextKeys.editorFocusedContext, EditorContextKeys.isEditorReadonly);
function getPlatformShortcut(ctrl: string, meta: string): string {
    return IS_MAC ? meta : ctrl;
}

/**
 * @description Register Toggle Mark Commands.
 * @note These commands need to be constructed after the editor and schema 
 * are initialized.
 */
function __registerToggleMarkCommands(registrant: ICommandRegistrant, editorService: IEditorService): void {
    const toggleMarkConfigs: [string, string, string][] = [
        [MarkEnum.Strong,   'Ctrl+B', 'Meta+B'],
        [MarkEnum.Em,       'Ctrl+I', 'Meta+I'],
        [MarkEnum.Codespan, 'Ctrl+`', 'Meta+`'],
    ];
    for (const [markID, ctrl, meta] of toggleMarkConfigs) {
        const toggleCmdID = `editor-toggle-mark-${markID}`;
        registrant.registerCommand(
            EditorCommands.createToggleMarkCommand(
                { 
                    id: toggleCmdID, 
                    when: EditorContextKeys.isEditorEditable,
                    shortcutOptions: {
                        commandArgs: [],
                        shortcut: Shortcut.fromString(getPlatformShortcut(ctrl, meta)),
                        weight: ShortcutWeight.Editor,
                        when: EditorContextKeys.isEditorEditable,
                    }
                },
                getSchemaTypeBasedOnCurrEditor(editorService, 'mark', markID), 
                null, // attrs
                {
                    removeWhenPresent: true,
                    enterInlineAtoms: true,
                }
            )
        );
    }
}

/**
 * @description Register Toggle Heading Commands. Ctrl+(1-6) will toggle the 
 * block into Heading block node.
 * @note These commands need to be constructed after the editor and schema 
 * are initialized.
 */
function __registerHeadingCommands(registrant: ICommandRegistrant, editorService: IEditorService): void {
    const headingCmdID = 'editor-toggle-heading';
    
    for (let level = 1; level <= 6; level++) {
        const cmdID = `${headingCmdID}-${level}`;
        registrant.registerCommand(
            EditorCommands.createSetBlockCommand(
                { 
                    id: cmdID, 
                    when: EditorContextKeys.isEditorEditable,
                    shortcutOptions: {
                        commandArgs: [],
                        shortcut: Shortcut.fromString(getPlatformShortcut(`Ctrl+${level}`, `Meta+${level}`)),
                        weight: ShortcutWeight.Editor,
                        when: EditorContextKeys.isEditorEditable,
                    }
                },
                getSchemaTypeBasedOnCurrEditor(editorService, 'node', TokenEnum.Heading),
                { level: level }
            )
        );
    }
}

function __registerBasicCommands(registrant: ICommandRegistrant, editorService: IEditorService): void {
    registrant.registerCommand(buildEditorCommand(
        { 
            id: 'editor-enter', 
            when: EditorContextKeys.isEditorEditable,
            shortcutOptions: {
                commandArgs: [],
                shortcut: Shortcut.fromString('Enter'),
                weight: ShortcutWeight.Editor,
                when: EditorContextKeys.isEditorEditable,
            }
        }, 
        [
            EditorCommands.InsertNewLineInCodeBlock,
            EditorCommands.InsertEmptyParagraphAdjacentToBlock,
            EditorCommands.LiftEmptyTextBlock,
            EditorCommands.SplitBlockAtSelection,
        ],
    ));

    registrant.registerCommand(buildEditorCommand(
        { 
            id: 'editor-esc', 
            when: whenEditorReadonly,
            shortcutOptions: {
                commandArgs: [],
                shortcut: Shortcut.fromString('Escape'),
                weight: ShortcutWeight.Editor,
                when: whenEditorReadonly,
            }
        }, 
        [
            EditorCommands.Unselect
        ],
    ));

    registrant.registerCommand(buildEditorCommand(
        { 
            id: 'editor-backspace', 
            when: EditorContextKeys.isEditorEditable,
            shortcutOptions: {
                commandArgs: [],
                shortcut: Shortcut.fromString('Backspace'),
                weight: ShortcutWeight.Editor,
                when: EditorContextKeys.isEditorEditable,
            }
        }, 
        [
            EditorCommands.DeleteSelection,
            EditorCommands.JoinBackward,
            EditorCommands.SelectNodeBackward,
        ],
    ));

    
    registrant.registerCommand(buildEditorCommand(
        {
            id: 'editor-delete',
            when: EditorContextKeys.isEditorEditable,
            shortcutOptions: {
                commandArgs: [],
                shortcut: [
                    Shortcut.fromString('Delete'),
                    Shortcut.fromString(getPlatformShortcut('Ctrl+Delete', 'Meta+Delete')),
                ],
                weight: ShortcutWeight.Editor,
                when: EditorContextKeys.isEditorEditable,
            }
        },
        [
            EditorCommands.DeleteSelection,
            EditorCommands.JoinForward,
            EditorCommands.SelectNodeForward,
        ]
    ));

    registrant.registerCommand(buildEditorCommand(
        {
            id: 'editor-select-all',
            when: whenEditorReadonly,
            shortcutOptions: {
                commandArgs: [],
                shortcut: Shortcut.fromString(getPlatformShortcut('Ctrl+A', 'Meta+A')),
                weight: ShortcutWeight.Editor,
                when: whenEditorReadonly,
            }
        },
        [
            EditorCommands.SelectAll
        ]
    ));
    
    // @fix Doesn't work with CM, guess bcz CM is focused but PM is not.
    registrant.registerCommand(buildEditorCommand(
        {
            id: 'editor-exit-code-block',
            when: whenEditorReadonly,
            shortcutOptions: {
                commandArgs: [],
                shortcut: Shortcut.fromString(getPlatformShortcut('Ctrl+Enter', 'Meta+Enter')),
                weight: ShortcutWeight.Editor,
                when: whenEditorReadonly,
            }
        },
        [
            EditorCommands.ExitCodeBlock
        ]
    ));

    registrant.registerCommand(buildEditorCommand(
        {
            id: 'editor-insert-hard-break',
            when: EditorContextKeys.isEditorEditable,
            shortcutOptions: {
                commandArgs: [],
                shortcut: [
                    Shortcut.fromString('Shift+Enter'),
                    Shortcut.fromString(getPlatformShortcut('Ctrl+Enter', 'Meta+Enter')),
                ],
                weight: ShortcutWeight.Editor,
                when: EditorContextKeys.isEditorEditable,
            }
        },
        [
            EditorCommands.ExitCodeBlock,
            EditorCommands.InsertHardBreak,
        ]
    ));
    
    registrant.registerCommand(buildEditorCommand(
        {
            id: 'editor-save',
            when: EditorContextKeys.isEditorEditable,
            shortcutOptions: {
                commandArgs: [],
                shortcut: Shortcut.fromString(getPlatformShortcut('Ctrl+S', 'Meta+S')),
                weight: ShortcutWeight.Editor,
                when: EditorContextKeys.isEditorEditable,
            }
        },
        [
            EditorCommands.FileSave,
        ]
    ));
    
    registrant.registerCommand(buildEditorCommand(
        {
            id: 'editor-undo',
            when: EditorContextKeys.isEditorEditable,
            shortcutOptions: {
                commandArgs: [],
                shortcut: Shortcut.fromString(getPlatformShortcut('Ctrl+Z', 'Meta+Z')),
                weight: ShortcutWeight.Editor,
                when: EditorContextKeys.isEditorEditable,
            }
        },
        [
            EditorCommands.FileUndo,
        ]
    ));
    
    registrant.registerCommand(buildEditorCommand(
        {
            id: 'editor-redo',
            when: EditorContextKeys.isEditorEditable,
            shortcutOptions: {
                commandArgs: [],
                shortcut: Shortcut.fromString(getPlatformShortcut('Ctrl+Shift+Z', 'Meta+Shift+Z')),
                weight: ShortcutWeight.Editor,
                when: EditorContextKeys.isEditorEditable,
            }
        },
        [
            EditorCommands.FileRedo,
        ]
    ));
}

function __registerListCommands(registrant: ICommandRegistrant, editorService: IEditorService): void {
    const getCurrListItemType = getSchemaTypeBasedOnCurrEditor(editorService, 'node', TokenEnum.ListItem);
    
    
    registrant.registerCommand(
        EditorListCommands.splitListItem(
            { 
                id: 'editor-split-list-item', 
                when: EditorContextKeys.isEditorEditable,
                shortcutOptions: {
                    when: EditorContextKeys.isEditorEditable,
                    weight: ShortcutWeight.Editor,
                    shortcut: Shortcut.fromString('Enter'),
                    commandArgs: [],
                }
            }, 
            getCurrListItemType,
            undefined,
        ), 
    );
    
    registrant.registerCommand(
        EditorListCommands.sinkListItem(
            { 
                id: 'editor-sink-list-item', 
                when: EditorContextKeys.isEditorEditable,
                shortcutOptions: {
                    when: EditorContextKeys.isEditorEditable,
                    weight: ShortcutWeight.Editor,
                    shortcut: Shortcut.fromString('Tab'),
                    commandArgs: [],
                }
            }, 
            getCurrListItemType,
        )
    );
    
    registrant.registerCommand(
        EditorListCommands.liftListItem(
            { 
                id: 'editor-lift-list-item', 
                when: EditorContextKeys.isEditorEditable,
                shortcutOptions: {
                    when: EditorContextKeys.isEditorEditable,
                    weight: ShortcutWeight.Editor,
                    shortcut: Shortcut.fromString('Shift+Tab'),
                    commandArgs: [],
                }
            }, 
            getCurrListItemType,
        )
    );
}

/**
 * Since {@link EditorCommand} is executed based the current editor context. So
 * the schema must also be determined dynamically.
 */
function getSchemaTypeBasedOnCurrEditor<TType extends 'mark' | 'node'>(editorService: IEditorService, type: TType, id: string): IO<GetNodeType<TType>> {
    return function () {
        const currEditor = editorService.getFocusedEditor();
        if (!currEditor) {
            panic(`Cannot execute the editor command (${id}) because the ${type} type does not exists in the current editor schema.`);
        }
        const view = currEditor.view.editor.internalView;
        return <GetNodeType<TType>>(type === 'mark'
            ? view.state.schema.marks[id]!
            : view.state.schema.nodes[id]!);
    };
}

type GetNodeType<TType extends 'mark' | 'node'> = TType extends 'mark' ? ProseMarkType : ProseNodeType;