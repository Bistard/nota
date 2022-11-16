import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { URI } from "src/base/common/file/uri";
import { Blocker } from "src/base/common/util/async";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IEditorModel, IPieceTableModel } from "src/editor/common/model";
import { IMarkdownLexer, MarkdownLexer } from "src/editor/model/markdown/lexer";
import { TextBufferBuilder } from "src/editor/model/textBufferBuilder";

/**
 * @class // TODO
 * 
 * @throws If the model is disposed, any operations will throw an error.
 */
export class EditorModel extends Disposable implements IEditorModel {

    // [event]

    private readonly _onDidBuild = this.__register(new Emitter<void | Error>());
    public readonly onDidBuild = this._onDidBuild.registerListener;
    
    // [field]

    private readonly _source: URI;

    /**
     * `undefined` indicates the model is not built yet. The text model is 
     * registered, need to be disposed manually.
     */
    private _textModel: IPieceTableModel = undefined!;

    private readonly _lexer: IMarkdownLexer;

    // [constructor]

    constructor(
        source: URI,
        private readonly fileService: IFileService,
    ) {
        super();
        this._source = source;
        this._lexer = new MarkdownLexer();

        this.__buildModel(source);
    }

    // [getter / setter]

    get source(): URI {
        return this._source;
    }

    // [public methods]

    public replaceWith(source: URI): Promise<void> {
        if (this.isDisposed()) {
            throw new Error('editor model is already disposed.');
        }
        
        if (this._textModel) {
            this._textModel.dispose();
            this._textModel = undefined!;
        }

        return this.__buildModel(source);
    }

    public getContent(): string[] {
        this.__assertModel();
        return this._textModel.getContent();
    }

    public getRawContent(): string {
        this.__assertModel();
        return this._textModel.getRawContent();
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
            throw new Error('editor model is already disposed.');
        }
        
        if (!this._textModel) {
            throw new Error('model is not built yet.');
        }

        if (this._textModel.isDisposed()) {
            throw new Error('text model is already disposed.');
        }
    }

    private async __buildModel(source: URI): Promise<void> {
        
        // building plain text into piece-table
        const builderOrError = await this.__createTextBufferBuilder(source);
        if (builderOrError instanceof Error) {
            const error = builderOrError;
            this._onDidBuild.fire(error);
            return;
        }

        const builder = builderOrError;

        const textModel = builder.create();
        this._textModel = textModel;

        const rawContent = this._textModel.getRawContent();
        const tokens = this._lexer.lex(rawContent);
        
        this._onDidBuild.fire();
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
    private async __createTextBufferBuilder(source: URI): Promise<TextBufferBuilder | Error> {

        const blocker = new Blocker<TextBufferBuilder | Error>();
        const builder = new TextBufferBuilder();
        const stream = await this.fileService.readFileStream(source);

        stream.on('data', (data: DataBuffer) => {
            builder.receive(data.toString());
        });

        stream.on('end', () => {
            stream.destroy();
            builder.build();
            blocker.resolve(builder);
        });

        stream.on('error', (error: Error) => {
            stream.destroy();
            blocker.resolve(error);
        });

        return blocker.waiting();
    }

}