import { Disposable } from "src/base/common/dispose";
import { EditorItemProvider } from "src/editor/viewModel/editorItem";

/**
 * An interface only for {@link EditorViewModel}.
 */
export interface IEditorViewModel extends Disposable {

    getItemProvider(): EditorItemProvider;

}
