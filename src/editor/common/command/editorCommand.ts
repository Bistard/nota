import { IEditorService } from "src/code/browser/workbench/parts/workspace/editor/editorService";
import { Command } from "src/platform/command/common/command";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { ProseEditorView } from "src/editor/common/proseMirror";
import { EditorInstance } from "src/editor/common/view";
import { EditorType } from "src/editor/common/viewModel";
import { IEditorWidget, IEditorWidgetFriendship } from "src/editor/editorWidget";
import { RichtextEditor } from "src/editor/view/viewPart/editors/richtextEditor/richtextEditor";

export abstract class EditorCommand extends Command {

    protected override __runCommand(provider: IServiceProvider, ...args: any[]): boolean | Promise<boolean> {
        const editorService = provider.getOrCreateService(IEditorService);
        const editor = editorService.editor;
        if (!editor) {
            return false;
        }
        return super.__runCommand(provider, ...[editor, ...args]);
    }

    public abstract override run(provider: IServiceProvider, editorWidget: IEditorWidget, ...args: any[]): boolean | Promise<boolean>;
}

export abstract class EditorViewCommand extends EditorCommand {

    protected override __runCommand(provider: IServiceProvider, ...args: any[]): boolean | Promise<boolean> {
        const editorService = provider.getOrCreateService(IEditorService);
        const widget = editorService.editor;
        if (!widget) {
            return false;
        }

        const view = (<IEditorWidgetFriendship>widget).view;
        if (!view) {
            return false;
        }

        return super.__runCommand(provider, ...[view.editor, ...args]);
    }

    public run(provider: IServiceProvider, editorWidget: IEditorWidget, editor: EditorInstance, ...args: any[]): boolean | Promise<boolean> {
        switch (editor.type) {
            case EditorType.Rich:
                return this.richtextCommand(provider, editorWidget, RichtextEditor.getInternalView(editor), ...args);
            case EditorType.Plain:
                return this.plaintextCommand(provider, editorWidget, undefined!, ...args); // TODO
            case EditorType.Split:
                return this.splitViewCommand(provider, editorWidget, undefined!, ...args); // TODO
        }
    }

    protected richtextCommand(provider: IServiceProvider, editorWidget: IEditorWidget, view: ProseEditorView, ...args: any[]): boolean | Promise<boolean> {
        return false;
    }

    protected plaintextCommand(provider: IServiceProvider, editorWidget: IEditorWidget, view: never, ...args: any[]): boolean | Promise<boolean> {
        return false;
    }

    protected splitViewCommand(provider: IServiceProvider, editorWidget: IEditorWidget, view: never, ...args: any[]): boolean | Promise<boolean> {
        return false;
    }
}