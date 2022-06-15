import { FastElement } from "src/base/browser/basic/fastElement";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { IRange } from "src/base/common/range";
import { IScrollEvent } from "src/base/common/scrollable";
import { ViewEvent } from "src/editor/common/view";
import { EditorViewComponent } from "src/editor/view/component/viewComponent";
import { EditorItem } from "src/editor/viewModel/editorItem";

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


/**
 * An interface only for {@link LineWidget}.
 */
export interface ILineWidget extends Disposable {

    /**
     * Invokes when the scroll event happens.
     */
    readonly onDidScroll: Register<IScrollEvent>;

    /**
     * @description Returns the DOM element of the widget.
     */
    getDomElement(): FastElement<HTMLElement>;

    /**
     * @description Returns a range represents the visible items of the view.
     */
    getVisibleRange(): IRange;

    /**
     * @description Returns the scrollable position (top) of the view.
     */
    getScrollPosition(): number;
    
    /**
     * @description Returns the viewport size of the view.
     */
    getViewportSize(): number;

    init(): void;

    splice(index: number, deleteCount: number, items: EditorItem[]): void;
}