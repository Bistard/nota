import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ProseEditorState, ProseTransaction } from "src/editor/common/proseMirror";
import { EditorSchema } from "src/editor/model/schema";
import { IOnDidContentChangeEvent } from "src/editor/view/proseEventBroadcaster";

// region - IEditorViewModel

export interface IViewModelBuildData {
    readonly state: ProseEditorState;
}

export interface IViewModelChangeEvent {
    readonly tr: ProseTransaction;
}

export interface IEditorViewModel extends Disposable {

    // region - field & event

    /**
     * The schema of the editor.
     */
    readonly schema: EditorSchema;

    /**
     * The state of the model. Returns undefined if the data is not ready yet.
     */
    readonly state?: ProseEditorState;

    readonly onDidContentChange: Register<IViewModelChangeEvent>;

    // region - methods

    /**
     * @description Takes the changes created from the editor view, adapt it to
     * model.
     */
    updateViewChange(e: IOnDidContentChangeEvent): void;

    // region - others

    getRegisteredDocumentNodes(): string[];
    getRegisteredDocumentNodesBlock(): string[];
    getRegisteredDocumentNodesInline(): string[];
}