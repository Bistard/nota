import { Constructor } from "src/base/common/utilities/type";
import { EditorExtension } from "src/editor/common/editorExtension";
import { EditorAutoSaveExtension } from "src/editor/contrib/autoSave";
import { EditorSnippetExtension } from "src/editor/contrib/snippet/snippet";
import { EditorDragAndDropExtension } from "src/editor/contrib/dragAndDrop/dragAndDrop";
import { EditorBlockHandleExtension } from "src/editor/contrib/blockHandle/blockHandle";
import { EditorBlockPlaceHolderExtension } from "src/editor/contrib/blockPlaceHolder/blockPlaceHolder";
import { EditorSlashCommandExtension } from "src/editor/contrib/slashCommand/slashCommand";
import { EditorAskAIExtension } from "src/editor/contrib/askAI/askAI";
// import { EditorHistoryExtension } from "src/editor/contrib/history/history";

export const enum EditorExtensionIDs {
    AutoSave  = 'editor-autosave-extension',
    Snippet = 'editor-snippet-extension',
    History   = 'editor-history-extension',
    DragAndDrop = 'editor-drag-and-drop-extension',
    BlockHandle = 'editor-block-handle-extension',
    BlockPlaceHolder = 'editor-block-place-holder-extension',
    SlashCommand = 'editor-slash-command-extension',
    AskAI = 'editor-ask-AI',
}

/**
 * @description These extensions are meant to be built-in features of the editor.
 */
export function getBuiltInExtension(): { id: string, ctor: Constructor<EditorExtension> }[] {
    return [
        { id: EditorExtensionIDs.Snippet, ctor: EditorSnippetExtension },
        { id: EditorExtensionIDs.AutoSave, ctor: EditorAutoSaveExtension },
        { id: EditorExtensionIDs.DragAndDrop, ctor: EditorDragAndDropExtension },
        { id: EditorExtensionIDs.BlockHandle, ctor: EditorBlockHandleExtension },
        { id: EditorExtensionIDs.BlockPlaceHolder, ctor: EditorBlockPlaceHolderExtension },
        { id: EditorExtensionIDs.SlashCommand, ctor: EditorSlashCommandExtension },
        { id: EditorExtensionIDs.AskAI, ctor: EditorAskAIExtension },
        // { id: EditorExtensionIDs.History, ctor: EditorHistoryExtension }, // TODO: unfinished (shit mountain)
    ];
}