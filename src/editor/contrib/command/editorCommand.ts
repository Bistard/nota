import { ProseEditorState, ProseTransaction, ProseEditorView } from "src/editor/common/proseMirror";
import { IEditorWidget } from "src/editor/editorWidget";
import { buildChainCommand, Command, ICommandSchema } from "src/platform/command/common/command";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";

/**
 * @class A base class for every command in the {@link EditorCommandsBasic}.
 */
export abstract class EditorCommandBase extends Command {
    public abstract override run(provider: IServiceProvider, editor: IEditorWidget, state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void, view?: ProseEditorView): boolean | Promise<boolean>;
}

export function buildEditorCommand(schema: ICommandSchema, ctors: (typeof Command<any>)[]): Command {
    if (ctors.length === 1) {
        const command = ctors[0]!;
        return new command(schema);
    }
    return buildChainCommand(schema, ctors);
}
