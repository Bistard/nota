import { ProseEditorState, ProseTransaction, ProseEditorView } from "src/editor/common/proseMirror";
import { IEditorWidget } from "src/editor/editorWidget";
import { buildChainCommand, Command, ICommandSchema } from "src/platform/command/common/command";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IEditorService } from "src/workbench/services/editor/editor";

/**
 * @class A base class for every command in the {@link EditorCommandsBasic}.
 */
export abstract class EditorCommand extends Command {
    protected abstract __run(provider: IServiceProvider, editor: IEditorWidget, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void, view?: ProseEditorView): boolean | Promise<boolean>;
    
    /**
     * Whenever {@link EditorCommand} executed, it will be executed based on
     * the context of the current editor. If no editors is focused, will not be 
     * executed.
     */
    public override run(provider: IServiceProvider): boolean | Promise<boolean> {
        const editorService = provider.getOrCreateService(IEditorService);
        const currEditor = editorService.getFocusedEditor();
        if (!currEditor) {
            return false;
        }
        const view = currEditor.view.editor.internalView;
        return this.__run(provider, currEditor, view.state, view.dispatch.bind(view), view);
    }
}

export function buildEditorCommand(schema: ICommandSchema, ctors: (typeof Command<any>)[]): Command {
    if (ctors.length === 1) {
        const command = ctors[0]!;
        return new command(schema);
    }
    return buildChainCommand(schema, ctors);
}
