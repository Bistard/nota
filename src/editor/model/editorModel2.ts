import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ILogEvent, LogLevel } from "src/base/common/logger";
import { AsyncResult, ok } from "src/base/common/result";
import { EditorOptionsType } from "src/editor/common/configuration/editorConfiguration";
import { IEditorExtension } from "src/editor/common/extension/editorExtension";
import { IEditorModel } from "src/editor/common/model";
import { ProseEditorState } from "src/editor/common/proseMirror";
import { IMarkdownLexer, IMarkdownLexerOptions, MarkdownLexer } from "src/editor/model/markdown/lexer";
import { DocumentNodeProvider } from "src/editor/viewModel/parser/documentNodeProvider";
import { DocumentParser, IDocumentParser } from "src/editor/viewModel/parser/parser";
import { buildSchema, EditorSchema } from "src/editor/viewModel/schema";
import { IFileService } from "src/platform/files/common/fileService";


export class EditorModel extends Disposable implements IEditorModel {

    // [events]

    private readonly _onLog = this.__register(new Emitter<ILogEvent>());
    public readonly onLog = this._onLog.registerListener;

    private readonly _onDidBuild = this.__register(new Emitter<ProseEditorState>());
    public readonly onDidBuild = this._onDidBuild.registerListener;

    // [fields]

    /** The configuration of the editor */
    private readonly _options: EditorOptionsType;

    /** The source file the model is about to read and parse. */
    private readonly _source: URI;

    /** Responsible for parsing the raw text into tokens. */
    private readonly _lexer: IMarkdownLexer;

    /** An object that defines how a view is organized. */
    private readonly _schema: EditorSchema;

    /** Parser that parses the given token into a legal view based on the schema */
    private readonly _docParser: IDocumentParser;

    /** A reference to the prosemirror state. */
    private _editorState?: ProseEditorState;

    // [constructor]

    constructor(
        source: URI,
        options: EditorOptionsType,
        @IFileService private readonly fileService: IFileService,
    ) {
        super();
        this._source = source;
        this._options = options;
        this._lexer = new MarkdownLexer(this.__initLexerOptions(options));
        
        const nodeProvider = DocumentNodeProvider.create().register();
        this._schema = buildSchema(nodeProvider);
        this._docParser = new DocumentParser(this._schema, nodeProvider, /* options */);

        this._onLog.fire({ level: LogLevel.DEBUG, message: 'EditorModel constructed.' });
    }

    // [getter / setter]

    get source(): URI {
        return this._source;
    }

    get schema(): EditorSchema {
        return this._schema;
    }

    get state(): ProseEditorState | undefined {
        return this._editorState;
    }

    // [public methods]

    public build(extensions: IEditorExtension[]): AsyncResult<ProseEditorState, Error> {
        return this.__buildModel(this._source, extensions)
            .map(state => {
                this._editorState = state;
                this._onDidBuild.fire(state);
                return state;
            });
    }

    public getContent(): string[] {
        return []; // TODO
    }

    // [private methods]

    private __initLexerOptions(options: EditorOptionsType): IMarkdownLexerOptions {
        return {
            baseURI: options.baseURI.value,
        };
    }

    private __buildModel(source: URI, extensions: IEditorExtension[]): AsyncResult<ProseEditorState, Error> {
        this._onLog.fire({ level: LogLevel.DEBUG, message: `EditorModel start building at: ${URI.toString(source)}` });

        return this.__readFileRaw(source)
            .andThen(raw => {
                const tokens = this._lexer.lex(raw);
                const document = this._docParser.parse(tokens);
                const state = ProseEditorState.create({
                    schema: this._schema,
                    doc: document,
                    plugins: extensions.map(extension => extension.getViewExtension()),
                });
                return ok(state);
            });
    }

    private __readFileRaw(source: URI): AsyncResult<string, Error> {
        return this.fileService.readFile(source, {})
            .map(buffer => buffer.toString());
    }
}