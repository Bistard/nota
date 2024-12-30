import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";
import { RichTextEditor } from "src/workbench/contrib/richTextEditor/richTextEditor";
import { TextEditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";
import { EditorPaneDescriptor } from "src/workbench/services/editorPane/editorPaneRegistrant";

export const registerRichTextEditor = createRegister(
    RegistrantType.EditorPane,
    'richTextEditorPane',
    registrant => {
        registrant.registerEditor(
            new EditorPaneDescriptor(RichTextEditor),
            [
                TextEditorPaneModel,
            ]
        );
    }
);