import { IDisposable } from "src/base/common/dispose";

export interface IEditorView extends IDisposable {

    /**
     * The container that will contain the entire editor view.
     */
    readonly container: HTMLElement;
}