import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";

/**
 * An interface only for {@link EditorModel}.
 */
export interface IEditorModel extends IDisposable {

    /** Fires when the content of the text model is changed. */
    onDidChangeContent: Register<void>;

}

/**
 * @class // TODO
 */
export class EditorModel extends Disposable implements IEditorModel {

    // [event]

    private readonly _onDidChangeContent = this.__register(new Emitter<void>());
    public readonly onDidChangeContent = this._onDidChangeContent.registerListener;
    
    // [field]

    // [constructor]

    constructor() {
        super();
    }

    // [public methods]

    // [private helper methods]

}