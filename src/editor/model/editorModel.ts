import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { IFileService } from "src/code/common/service/fileService/fileService";

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

    constructor(
        source: URI,
        private fileService: IFileService
    ) {
        super();

        this.__createModel(source);
    }

    // [public methods]

    // [private helper methods]

    private async __createModel(source: URI): Promise<void> {
        const stream = await this.fileService.readFileStream(source);
        stream.on('data', (data) => {
            console.log(data.bufferLength);
        });
    }

}