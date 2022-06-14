import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { URI } from "src/base/common/file/uri";
import { asyncFinish } from "src/base/common/util/async";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { ModelEvent, IEditorModel, IPieceTableModel } from "src/editor/common/model";
import { TextBufferBuilder } from "src/editor/model/textBuffer";

/**
 * @class // TODO
 * 
 * @throws If the model is disposed, any operations will throw an error.
 */
export class EditorModel extends Disposable implements IEditorModel {

    // [event]

    // REVIEW: do we really need this? or one single onDidChangeContent will be fine
    private readonly _onDidFinishBuild = this.__register(new Emitter<true | Error>());
    public readonly onDidFinishBuild = this._onDidFinishBuild.registerListener;

    private readonly _onDidChangeContent = this.__register(new Emitter<ModelEvent.IContentChangeEvent>());
    public readonly onDidChangeContent = this._onDidChangeContent.registerListener;
    
    // [field]

    /**
     * `null` indicates the model is not built yet. The tex model is registered,
     * need to be disposed manually.
     */
    private _textModel: IPieceTableModel = null!;

    // [constructor]

    constructor(
        source: URI,
        private fileService: IFileService
    ) {
        super();
        this.__createModel(source);
    }

    // [public methods]

    // REVIEW: maybe we need a URI and do it asynchronous.
    public replaceModelWith(text: string): void {
        this.__assertModel();
        
        const builder = new TextBufferBuilder();
        builder.receive(text);
        builder.build();
        const newTextModel = builder.create();

        this._textModel.dispose();
        this._textModel = null!;
        this._textModel = newTextModel;

        this._onDidFinishBuild.fire(true);
    }

    public getContent(): string[] {
        this.__assertModel();
        return this._textModel.getContent();
    }

    public getLineCount(): number {
        this.__assertModel();
        return this._textModel.getLineCount();
    }

    public getLine(lineNumber: number): string {
        this.__assertModel();
        return this._textModel.getLine(lineNumber);
    }

    public getLineLength(lineNumber: number): number {
        this.__assertModel();
        return this._textModel.getLineLength(lineNumber);
    }

    public override dispose(): void {
        super.dispose();
        if (this._textModel !== null) {
            this._textModel.dispose();
        }
    }

    // [private helper methods]

    private __assertModel(): void {
        if (this.isDisposed()) {
            throw new Error('editor model is already disposed');
        }
        
        if (this._textModel === null) {
            throw new Error('model is not built yet.');
        }

        if (this._textModel.isDisposed()) {
            throw new Error('text model is already disposed');
        }
    }

    private async __createModel(source: URI): Promise<void> {
        
        const builder = await this.__createTextBufferBuilder(source);
        if (builder === null) {
            return;
        }

        const textModel = builder.create();
        this._textModel = textModel;
        
        this._onDidFinishBuild.fire(true);
    }

    /**
     * @description Given the {@link URI}, reads the corresponding file chunk by
     * chunk. After read all the chunks, we build a {@link __TextBufferBuilder}
     * and returns it for later piece table usage.
     * 
     * `await` this function guarantees the file will be completely read into 
     * the memory.
     * 
     * @note method will invoke `TextBufferBuilder.build()` automatically.
     */
    private async __createTextBufferBuilder(source: URI): Promise<TextBufferBuilder | null> {

        // Otherwise source is a URI, we need to read it first.

        const [finished, finishBuilding] = asyncFinish<void>();
        let builder: TextBufferBuilder | null = new TextBufferBuilder();

        const stream = await this.fileService.readFileStream(source);
        stream.on('data', (data: DataBuffer) => {
            builder!.receive(data.toString());
        });

        stream.on('end', () => {
            builder!.build();
            finishBuilding();
        });

        stream.on('error', (error) => {
            this._onDidFinishBuild.fire(error);
            builder = null;
            finishBuilding();
        });

        await finished;
        return builder;
    }

}