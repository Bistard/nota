import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ILogEvent } from "src/base/common/logger";
import { IEditorViewModel } from "src/editor/common/viewModel";

export interface IEditorView extends Disposable {

    readonly viewModel: IEditorViewModel;

    /**
     * Fires when a log is about happen.
     */
    readonly onLog: Register<ILogEvent<string | Error>>;

    /** 
	 * Fires when the component is either focused or blured (true represents 
	 * focused). 
	 */
    readonly onDidFocusChange: Register<boolean>;

    /**
     * Fires before the actual rendering happens.
     */
    readonly onBeforeRender: Register<void>;

    readonly onClick: Register<unknown>;
    readonly onDidClick: Register<unknown>;
    readonly onDoubleClick: Register<unknown>;
    readonly onDidDoubleClick: Register<unknown>;
    readonly onTripleClick: Register<unknown>;
    readonly onDidTripleClick: Register<unknown>;
    readonly onKeydown: Register<unknown>;
    readonly onKeypress: Register<unknown>;
    readonly onTextInput: Register<unknown>;
    readonly onPaste: Register<unknown>;
    readonly onDrop: Register<unknown>;

    /**
     * @description Updates the options of the editor view.
     * @param options The options.
     */
    updateOptions(options: Partial<IEditorViewOptions>): void;
}

export interface IEditorViewOptions {

}