import { Disposable, IDisposable } from "src/base/common/dispose";
import { EditorViewComponent } from "src/editor/view/viewComponent/viewComponent";
import { EditorItemProvider } from "src/editor/viewModel/editorItem";

/**
 * An interface only for {@link EditorViewModel}.
 */
export interface IEditorViewModel extends Disposable {

    getItemProvider(): EditorItemProvider;

    addViewComponent(id: string, component: EditorViewComponent): IDisposable;

}


/**
 * An interface only for {@link EditorViewModelEventEmitter}.
 */
export interface IEditorViewModelEventEmitter extends Disposable {

}