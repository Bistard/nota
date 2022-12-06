import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ILogEvent } from "src/base/common/logger";

export interface IEditorView extends Disposable {

    /**
     * Fires when a log is about happen.
     */
    readonly onLog: Register<ILogEvent<string | Error>>;

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