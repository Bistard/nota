import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/files/buffer";
import { URI } from "src/base/common/files/uri";
import { ILogEvent, LogLevel } from "src/base/common/logger";
import { Blocker } from "src/base/common/utilities/async";
import { IFileService } from "src/platform/files/common/fileService";
import { EditorToken, IEditorModel, IPieceTableModel } from "src/editor/common/model";
import { EditorOptionsType } from "src/editor/common/configuration/editorConfiguration";
import { IMarkdownLexer, IMarkdownLexerOptions, MarkdownLexer } from "src/editor/model/markdown/lexer";
import { TextBufferBuilder } from "src/editor/model/textBufferBuilder";
import { panic } from "src/base/common/utilities/panic";

export class EditorModel extends Disposable /** implements IEditorModel */ {

    // [event]

    private readonly _onLog = this.__register(new Emitter<ILogEvent>());
    public readonly onLog = this._onLog.registerListener;

    private readonly _onDidBuild = this.__register(new Emitter<EditorToken[]>());
    public readonly onDidBuild = this._onDidBuild.registerListener;

    private readonly _onDidContentChange = this.__register(new Emitter<void>());
    public readonly onDidContentChange = this._onDidContentChange.registerListener;

    // [field]

    /** The configuration of the editor */
    private readonly _options: EditorOptionsType;
    
    /** 
     * The source file the model is about to read and parse.
     */
    private readonly _source: URI;
    
    /**
     * `undefined` indicates the model is not built yet. The text model is 
     * registered, need to be disposed manually.
     */
    private _textModel: IPieceTableModel = undefined!;
    
    /**
     * Responsible for parsing the raw text into tokens.
     */
    private readonly _lexer: IMarkdownLexer;

    // [constructor]

    constructor(
        source: URI,
        options: EditorOptionsType,
        @IFileService private readonly fileService: IFileService,
    ) {
        super();
        this._source = source;
        this._options = options;

        const lexerOptions = this.__initLexerOptions(options);
        this._lexer = new MarkdownLexer(lexerOptions);

        this._onLog.fire({ level: LogLevel.DEBUG, message: 'EditorModel constructed.' });
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
            panic('editor model is already disposed.');
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
            panic('editor model is already disposed.');
        }

        if (!this._textModel) {
            panic('model is not built yet.');
        }

        if (this._textModel.isDisposed()) {
            panic('text model is already disposed.');
        }
    }

    private __detachModel(): void {
        if (this._textModel) {
            this._textModel.dispose();
            this._textModel = undefined!;
        }
    }

    private async __buildModel(source: URI): Promise<void> {
        this._onLog.fire({ level: LogLevel.DEBUG, message: `EditorModel start building at: ${URI.toString(source)}` });

        // building plain text into piece-table
        const builderOrError = await this.__createTextBufferBuilder(source);
        if (builderOrError instanceof Error) {
            this._onLog.fire({ level: LogLevel.ERROR, message: `cannot build text model at: ${URI.toFsPath(source)}`, error: builderOrError });
            return;
        }
        const builder = builderOrError;

        // build piece table
        const textModel = builder.create();
        this._textModel = textModel;

        // lex
        const rawContent = this._textModel.getRawContent();
        const tokens = this._lexer.lex(rawContent);

        // event
        this._onLog.fire({ level: LogLevel.DEBUG, message: `EditorModel built.` });
        this._onDidBuild.fire(tokens);
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
        const readResult = await this.fileService.readFileStream(source);
        if (readResult.isErr()) {
            return readResult.error;
        }

        const stream = readResult.unwrap().flow();

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