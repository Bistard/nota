import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ProseNode } from "src/editor/common/prose";
import { EditorSchema } from "src/editor/viewModel/schema";

export interface IEditorViewModel extends Disposable {

    readonly onFlush: Register<ProseNode>;

    getSchema(): EditorSchema;

    /**
     * @description Updates the options of the editor view model.
     * @param options The options.
     */
    updateOptions(options: Partial<IEditorViewModelOptions>): void;
}

export interface IEditorViewModelOptions {

    /**
     * A string to prefix the className in a <code> block. Useful for syntax 
     * highlighting.
     * @default 'language-'
     */
    languagePrefix?: string;

    /**
     * If enables code-block highlight functionality.
     * @default true
     */
    enableHighlight?: boolean;
}