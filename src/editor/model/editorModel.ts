import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { URI } from "src/base/common/file/uri";
import { Blocker } from "src/base/common/util/async";
import { mixin } from "src/base/common/util/object";
import { ExplorerViewID, IExplorerViewService } from "src/code/browser/workbench/sideView/explorer/explorerService";
import { ISideViewService } from "src/code/browser/workbench/sideView/sideView";
import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { BuiltInConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { IFileService } from "src/code/platform/files/common/fileService";
import { EditorToken, IEditorModel, IModelEvent, IPieceTableModel } from "src/editor/common/model";
import { getDefaultLexerOptions, IMarkdownLexer, IMarkdownLexerOptions, MarkdownLexer } from "src/editor/model/markdown/lexer";
import { TextBufferBuilder } from "src/editor/model/textBufferBuilder";

export class EditorModel extends Disposable implements IEditorModel {

    // [event]

    private readonly _onDidBuild = this.__register(new Emitter<boolean>());
    public readonly onDidBuild = this._onDidBuild.registerListener;

    private readonly _onDidContentChange = this.__register(new Emitter<IModelEvent.ContentChange>());
    public readonly onDidContentChange = this._onDidContentChange.registerListener;
    
    // [field]

    private readonly _source: URI;

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
        @IFileService private readonly fileService: IFileService,
        @IConfigService private readonly configService: IConfigService,
        @ISideViewService private readonly sideViewService: ISideViewService,
    ) {
        super();
        this._source = source;

        // lexer construction
        const lexerOptions = this.__initLexerOptions();
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

    public onQuit(): void {
        
        // save lexer settings
        const lexerOptions = this._lexer.getOptions();
        this.configService.set(BuiltInConfigScope.User, 'editor.lexer.enableHighlight', lexerOptions.enableHighlight);
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
            this._onDidBuild.fire(false);
            return;
        }

        const builder = builderOrError;

        const textModel = builder.create();
        this._textModel = textModel;

        const rawContent = this._textModel.getRawContent();
        this._tokens = this._lexer.lex(rawContent);

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

    private __initLexerOptions(): IMarkdownLexerOptions {
        
        const overwrite = {
            enableHighlight: this.configService.get<boolean>(BuiltInConfigScope.User, 'editor.lexer.enableHighlight'),
        };
        
        const explorerView = this.sideViewService.getView<IExplorerViewService>(ExplorerViewID);
        if (explorerView?.root) {
            overwrite['baseURI'] = URI.toFsPath(explorerView.root, true);
        }

        const lexerOptionBase = mixin<IMarkdownLexerOptions>(
            getDefaultLexerOptions(),
            overwrite,
            true,
        );
        
        return lexerOptionBase;
    }
}