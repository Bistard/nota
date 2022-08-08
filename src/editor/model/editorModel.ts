import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { URI } from "src/base/common/file/uri";
import { Blocker } from "src/base/common/util/async";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { ModelEvent, IEditorModel, IPieceTableModel } from "src/editor/common/model";
import { IMarkdownLexer, MarkdownLexer } from "src/editor/model/markdown/markedLexer";
import { TextBufferBuilder } from "src/editor/model/textBufferBuilder";

/**
 * @class // TODO
 * 
 * @throws If the model is disposed, any operations will throw an error.
 */
export class EditorModel extends Disposable implements IEditorModel {

    // [event]

    private readonly _onDidBuild = this.__register(new Emitter<true | Error>());
    public readonly onDidBuild = this._onDidBuild.registerListener;

    private readonly _onEvent = this.__register(new Emitter<ModelEvent.Events>());
    public readonly onEvent = this._onEvent.registerListener;

    // [field]

    private readonly _source: URI;

    /**
     * `null` indicates the model is not built yet. The text model is registered,
     * need to be disposed manually.
     */
    private _textModel: IPieceTableModel = null!;

    private readonly _lexer: IMarkdownLexer;

    // [constructor]

    constructor(
        source: URI,
        private fileService: IFileService
    ) {
        super();
        this._source = source;
        this._lexer = new MarkdownLexer();

        this.__createModel(source);
    }

    // [getter / setter]

    get source(): URI {
        return this._source;
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

        this._onDidBuild.fire(true);
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

    public tokenizationBetween(startLineNumber: number, endLineNumber: number): void {
        startLineNumber = Math.max(0, startLineNumber);
        endLineNumber = Math.min(this.getLineCount(), endLineNumber);
        // TODO
    }

    public override dispose(): void {
        super.dispose();
        if (this._textModel !== null) {
            this._textModel.dispose();
        }
    }

    // [private helper methods]

    /**
     * @description Raises any assertions if the model is 
     */
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

    /**
     * @description // TODO
     */
    private async __createModel(source: URI): Promise<void> {
        
        const builder = await this.__createTextBufferBuilder(source);
        if (builder === undefined) {
            return;
        }

        const textModel = builder.create();
        this._textModel = textModel;

        // REVIEW
        const rawContent = this._textModel.getRawContent();
        console.log(rawContent);
        const tokens = this._lexer.lex(rawContent);
        console.log(tokens);
        
        this._onDidBuild.fire(true);
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
    private async __createTextBufferBuilder(source: URI): Promise<TextBufferBuilder | undefined> {

        const blocker = new Blocker<TextBufferBuilder | undefined>();
        let builder: TextBufferBuilder = new TextBufferBuilder();

        const stream = await this.fileService.readFileStream(source);
        stream.on('data', (data: DataBuffer) => {
            builder!.receive(data.toString());
        });

        stream.on('end', () => {
            builder!.build();
            blocker.resolve(builder);
        });

        stream.on('error', (error) => {
            this._onDidBuild.fire(error);
            blocker.resolve(undefined);
        });

        return blocker.waiting();
    }

}