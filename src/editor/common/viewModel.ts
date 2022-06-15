import { Disposable, IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ViewEvent } from "src/editor/common/view";
import { EditorViewComponent } from "src/editor/view/component/viewComponent";
import { ILineWidget } from "src/editor/viewModel/lineWidget";

/**
 * An interface only for {@link EditorViewModel}.
 */
export interface IEditorViewModel extends Disposable {

    onViewEvent: Register<ViewEvent.Events>;

    addViewComponent(id: string, component: EditorViewComponent): IDisposable;

    getLineWidget(): ILineWidget;
}

/**
 * An interface only for {@link EditorViewModelEventEmitter}.
 */
export interface IEditorViewModelEventEmitter extends Disposable {

    addViewComponent(id: string, component: EditorViewComponent): IDisposable;

    fire(event: ViewEvent.Events): void;

    pause(): void;

    resume(): void;
}