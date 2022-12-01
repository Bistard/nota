import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { URI } from "src/base/common/file/uri";
import { ILogEvent, LogLevel } from "src/base/common/logger";
import { Blocker } from "src/base/common/util/async";
import { IFileService } from "src/code/platform/files/common/fileService";
import { EditorToken, IEditorModel, IEditorModelOptions, IPieceTableModel } from "src/editor/common/model";
import { EditorOptionsType } from "src/editor/configuration/editorConfiguration";
import { IMarkdownLexer, IMarkdownLexerOptions, MarkdownLexer } from "src/editor/model/markdown/lexer";
import { TextBufferBuilder } from "src/editor/model/textBufferBuilder";

export class EditorModel extends Disposable implements IEditorModel {

    // [event]

    private readonly _onLog = this.__register(new Emitter<ILogEvent<string | Error>>());
    public readonly onLog = this._onLog.registerListener;

    private readonly _onDidBuild = this.__register(new Emitter<void>());
    public readonly onDidBuild = this._onDidBuild.registerListener;

    private readonly _onDidContentChange = this.__register(new Emitter<void>());
    public readonly onDidContentChange = this._onDidContentChange.registerListener;
    
    // [field]

    private readonly _source: URI;
    private readonly _options: EditorOptionsType;

    private readonly _lexer: IMarkdownLexer;

    /**
     * `undefined` indicates the model is not built yet. The text model is 
     * registered, need to be disposed manually.
     */
    private _textModel: IPieceTableModel = undefined!;
    private _tokens: EditorToken[] = [];

    // [constructor]

    constructor(
        source: URI,
        options: EditorOptionsType,
        @IFileService private readonly fileService: IFileService,
    ) {
        super();
        this._source = source;
        this._options = options;

        // lexer construction
        const lexerOptions = this.__initLexerOptions(options);
        this._lexer = new MarkdownLexer(lexerOptions);
    }

    // [getter / setter]

    get source(): URI {
        return this._source;
    }

    // [public methods]

    public build(): Promise<void> {
        return this.__buildModel(this._source);
    }

    public replaceWith(source: URI): Promise<void> {
        if (this.isDisposed()) {
            throw new Error('editor model is already disposed.');
        }
        
        this.__detachModel();

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

    public getTokens(): EditorToken[] {
        return this._tokens;
    }

    public updateOptions(options: EditorOptionsType): void {
        if (options.baseURI.value) {
            this._lexer.updateOptions({ baseURI: options.baseURI.value });
        }
    }

    public override dispose(): void {
        super.dispose();
        this.__detachModel();
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

    private __detachModel(): void {
        if (this._textModel) {
            this._textModel.dispose();
            this._textModel = undefined!;
        }
    }

    private async __buildModel(source: URI): Promise<void> {
        
        // building plain text into piece-table
        const builderOrError = await this.__createTextBufferBuilder(source);
        if (builderOrError instanceof Error) {
            this._onLog.fire({ level: LogLevel.ERROR, data: new Error(`cannot build text model at ${URI.toFsPath(source)}`) });
            return;
        }

        const builder = builderOrError;

        const textModel = builder.create();
        this._textModel = textModel;

        const rawContent = this._textModel.getRawContent();
        this._tokens = this._lexer.lex(rawContent);

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

    private __initLexerOptions(options: EditorOptionsType): IMarkdownLexerOptions {
        return { 
            baseURI: options.baseURI.value,
        };
    }
}