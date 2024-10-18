import { Disposable } from "src/base/common/dispose";
import { Emitter, Event } from "src/base/common/event";
import { EditorToken, IEditorModel } from "src/editor/common/model";
import { IEditorViewModel, IEditorViewModelOptions, RenderEvent } from "src/editor/common/viewModel";
import { DocumentParser, IDocumentParser } from "src/editor/model/parser/parser";
import { EditorSchema, buildSchema } from "src/editor/model/schema";
import { ILogEvent, LogLevel } from "src/base/common/logger";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorOptionsType } from "src/editor/common/configuration/editorConfiguration";
import { DocumentNodeProvider } from "src/editor/model/parser/documentNodeProvider";
import { EditorType } from "src/editor/common/view";

export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [field]

    /** The configuration of the editor */
    private readonly _options: EditorOptionsType;
    private readonly _model: IEditorModel;

    /** An object that defines how a view is organized. */
    private readonly _schema: EditorSchema;

    /** Parser that parses the given token into a legal view based on the schema */
    private readonly _docParser: IDocumentParser;

    // [event]

    private readonly _onLog = this.__register(new Emitter<ILogEvent>());
    public readonly onLog = this._onLog.registerListener;

    private readonly _onRender = this.__register(new Emitter<RenderEvent>());
    public readonly onRender = this._onRender.registerListener;

    private readonly _onDidRenderModeChange = this.__register(new Emitter<EditorType>());
    public readonly onDidRenderModeChange = this._onDidRenderModeChange.registerListener;

    // [constructor]

    constructor(
        model: IEditorModel,
        options: EditorOptionsType,
    ) {
        super();
        this._model = model;
        this._options = options;

        const nodeProvider = DocumentNodeProvider.create().register();
        this._schema = buildSchema(nodeProvider);
        this._docParser = new DocumentParser(this._schema, nodeProvider, /* options */);
        
        this.__registerParserListeners(this._docParser);
        this.__registerModelListeners();

        this._onLog.fire({ level: LogLevel.DEBUG, message: 'EditorViewModel constructed.' });
    }

    // [getter]

    get renderMode(): EditorType {
        return this._options.mode.value;
    }

    // [public methods]

    public getSchema(): EditorSchema {
        return this._schema;
    }

    public updateOptions(options: Partial<IEditorViewModelOptions>): void {
        if (options.mode) {
            const changed = this._options.mode.updateWith(options.mode);
            if (changed) {
                this._onDidRenderModeChange.fire(options.mode);
            }
        }
    }

    // [private helper methods]

    private __registerModelListeners(): void {
        
        this.__register(Event.any([this._model.onDidBuild])(tokens => {
            // this.__onDidModelContentChange(tokens);
        }));
    }

    private __onDidModelContentChange(tokens: EditorToken[]): void {
        console.log('[EditorViewModel] [tokens]', tokens); // TEST

        const document = this._docParser.parse(tokens);
        console.log('[EditorViewModel] [document]', document); // TEST

        const renderType = this._options.mode.value;
        let event: RenderEvent;

        if (renderType === EditorType.Plain) {
            event = {
                type: renderType,
                plainText: this._model.getContent(),
            };
        }
        else if (renderType === EditorType.Split) {
            event = {
                type: renderType,
                plainText: this._model.getContent(),
                document: document,
            };
        }
        else {
            event = {
                type: renderType,
                document: document,
            };
        }

        this._onRender.fire(event);
    }

    private __registerParserListeners(parser: IDocumentParser): void {
        parser.onLog(event => this._onLog.fire(event));
        
        if (this._options.ignoreHTML.value) {
            parser.ignoreToken(TokenEnum.HTML, true);
        }
    }
}