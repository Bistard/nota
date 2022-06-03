import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { URI } from "src/base/common/file/uri";
import { asyncFinish } from "src/base/common/util/async";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { TextBufferBuilder } from "src/editor/model/textBuffer";

/**
 * An interface only for {@link EditorModel}.
 */
export interface IEditorModel extends IDisposable {

    /** Fires when the model is build whether successed or failed. */
    onDidFinishBuild: Register<boolean>;

    /** Fires when the content of the text model is changed. */
    onDidChangeContent: Register<void>;

}

/**
 * @class // TODO
 */
export class EditorModel extends Disposable implements IEditorModel {

    // [event]

    private readonly _onDidFinishBuild = this.__register(new Emitter<boolean>());
    public readonly onDidFinishBuild = this._onDidFinishBuild.registerListener;

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
        
        const builder = await this.__createTextBufferBuilder(source);

    }

    /**
     * @description Given the {@link URI}, reads the corresponding file chunk by
     * chunk. After read all the chunks, we build a {@link __TextBufferBuilder}
     * and returns it for later piece table usage.
     * 
     * `await` this function guarantees the file will be completely read into the memory.
     */
    private async __createTextBufferBuilder(source: URI): Promise<TextBufferBuilder> {

        const [finished, finishBuilding] = asyncFinish<void>();
        const builder = new TextBufferBuilder();

        const stream = await this.fileService.readFileStream(source);
        stream.on('data', (data: DataBuffer) => {
            builder.receiveChunk(data.toString());
        });

        stream.on('end', () => {
            finishBuilding();
        });

        stream.on('error', (error) => {
            // logService
            this._onDidFinishBuild.fire(false);
            finishBuilding();
        });

        await finished;
        return builder;
    }

}