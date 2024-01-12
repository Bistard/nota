import { Disposable } from "src/base/common/dispose";
import { Emitter, Event } from "src/base/common/event";
import { EditorToken, IEditorModel } from "src/editor/common/model";
import { EditorType, IEditorViewModel, IEditorViewModelOptions, RenderEvent } from "src/editor/common/viewModel";
import { DocumentNodeProvider } from "src/editor/viewModel/parser/documentNode";
import { DocumentParser, IDocumentParser } from "src/editor/viewModel/parser/parser";
import { Codespan } from "src/editor/viewModel/parser/mark/codespan";
import { Emphasis } from "src/editor/viewModel/parser/mark/emphasis";
import { Link } from "src/editor/viewModel/parser/mark/link";
import { Strong } from "src/editor/viewModel/parser/mark/strong";
import { Blockquote } from "src/editor/viewModel/parser/node/blockquote";
import { CodeBlock } from "src/editor/viewModel/parser/node/codeBlock";
import { Heading } from "src/editor/viewModel/parser/node/heading";
import { HorizontalRule } from "src/editor/viewModel/parser/node/horizontalRule";
import { Image } from "src/editor/viewModel/parser/node/image";
import { LineBreak } from "src/editor/viewModel/parser/node/lineBreak";
import { Paragraph } from "src/editor/viewModel/parser/node/paragraph";
import { Space } from "src/editor/viewModel/parser/node/space";
import { Text } from "src/editor/viewModel/parser/node/text";
import { EditorSchema, MarkdownSchema } from "src/editor/viewModel/schema";
import { ILogEvent, LogLevel } from "src/base/common/logger";
import { List, ListItem } from "src/editor/viewModel/parser/node/list";
import { HTML } from "src/editor/viewModel/parser/node/html";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorOptionsType } from "src/editor/common/configuration/editorConfiguration";

export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [field]

    /** The configuration of the editor */
    private readonly _options: EditorOptionsType;

    private readonly _model: IEditorModel;

    private readonly _nodeProvider: DocumentNodeProvider;
    private readonly _schema: EditorSchema;
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

        this._nodeProvider = new DocumentNodeProvider();
        this.__registerNodeProvider();

        this._schema = new MarkdownSchema(this._nodeProvider);

        this._docParser = new DocumentParser(this._schema, this._nodeProvider, /* options */);
        this.__initDocParser();

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
            this.__onDidModelContentChange(tokens);
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

    private __registerNodeProvider(): void {
        const provider = this._nodeProvider;

        // nodes
        provider.registerNode(new Space());
        provider.registerNode(new Text());
        provider.registerNode(new Heading());
        provider.registerNode(new Paragraph());
        provider.registerNode(new Blockquote());
        provider.registerNode(new HorizontalRule());
        provider.registerNode(new CodeBlock());
        provider.registerNode(new LineBreak());
        provider.registerNode(new Image());
        provider.registerNode(new List());
        provider.registerNode(new ListItem());
        provider.registerNode(new HTML());

        // marks
        provider.registerMark(new Link());
        provider.registerMark(new Emphasis());
        provider.registerMark(new Strong());
        provider.registerMark(new Codespan());
    }

    private __initDocParser(): void {
        const parser = this._docParser;
        
        parser.onLog(event => this._onLog.fire(event));
        
        if (this._options.ignoreHTML.value) {
            parser.ignoreToken(TokenEnum.HTML, true);
        }
    }
}