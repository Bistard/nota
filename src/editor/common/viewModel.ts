import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ViewEvent } from "src/editor/common/view";
import { EditorItemProvider } from "src/editor/viewModel/editorItem";

/**
 * An interface only for {@link EditorViewModel}.
 */
export interface IEditorViewModel extends Disposable {

    readonly onDidFlush: Register<void>;

    readonly onDidLineInserted: Register<ViewEvent.LineInsertedEvent>;

    readonly onDidLineDeleted: Register<ViewEvent.LineDeletedEvent>;

    readonly onDidLineChanged: Register<ViewEvent.LineChangedEvent>;

    getItemProvider(): EditorItemProvider;

}
