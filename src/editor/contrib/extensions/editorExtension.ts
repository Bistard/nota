import { IDisposable } from "src/base/common/dispose";
import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { IEditorWidget } from "src/editor/editorWidget";

/**
 * An interface used to describe an extension for an editor that is created for
 * every time when an editor is created and disposed when the editor is disposed.
 */
export interface IEditorExtension extends IDisposable {
    // noop
}

export interface IEditorExtensionCtor {
    new (editor: IEditorWidget, service: IServiceProvider): IEditorExtension;
}