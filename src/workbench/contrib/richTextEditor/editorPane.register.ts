import { createRegister, RegistrantType } from "src/platform/registrant/common/registrant";
import { RichTextEditor } from "src/workbench/contrib/richTextEditor/richTextEditor";
import { TextEditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";

export const registerRichTextEditor = createRegister(
    RegistrantType.EditorPane,
    'richTextEditorPane',
    registrant => {
        registrant.registerEditor(
            RichTextEditor,
            [
                TextEditorPaneModel,
            ]
        );
    }
);