import { Disposable } from "src/base/common/dispose";
import { Emitter, Event } from "src/base/common/event";
import { IEditorModel } from "src/editor/common/model";
import { EditorRenderType, IEditorViewModel, IEditorViewModelOptions, IRenderEvent } from "src/editor/common/viewModel";
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
import { defaultLog, ILogEvent, ILogService } from "src/base/common/logger";
import { List, ListItem } from "src/editor/viewModel/parser/node/list";
import { HTML } from "src/editor/viewModel/parser/node/html";
import { ifOrDefault } from "src/base/common/util/type";

export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [field]

    private readonly _options: Required<IEditorViewModelOptions>;

    private readonly _model: IEditorModel;

    private readonly _nodeProvider: DocumentNodeProvider;
    private readonly _schema: EditorSchema;
    private readonly _docParser: IDocumentParser;

    // [event]

    private readonly _onLog = this.__register(new Emitter<ILogEvent<string | Error>>());
    public readonly onLog = this._onLog.registerListener;

    private readonly _onRender = this.__register(new Emitter<IRenderEvent>());
    public readonly onRender = this._onRender.registerListener;

    // [constructor]

    constructor(
        model: IEditorModel,
        options: IEditorViewModelOptions,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        this._model = model;
        this._options = this.__initOptions(options);

        this._nodeProvider = new DocumentNodeProvider();
        this.__registerNodeProvider();

        this._schema = new MarkdownSchema(this._nodeProvider);

        this._docParser = new DocumentParser(this._schema, this._nodeProvider, /* options */);
        this._docParser.onLog(event => this._onLog.fire(event));

        this.__registerModelListeners();
    }

    // [public methods]

    public getSchema(): EditorSchema {
        return this._schema;
    }

    public updateOptions(options: Partial<IEditorViewModelOptions>): void {

    }

    // [private helper methods]

    private __registerModelListeners(): void {
        
        this.__register(Event.any([this._model.onDidContentChange, this._model.onDidBuild])(() => {
            this.__onDidModelContentChange();
        }));
    }

    private __onDidModelContentChange(): void {

        const tokens = this._model.getTokens();
        const document = this._docParser.parse(tokens);
        
        console.log('[tokens]', tokens); // TEST
        console.log('[document]', document); // TEST

        const renderType = this._options.display;
        let event: IRenderEvent;

        if (renderType === EditorRenderType.Plain) {
            event = {
                type: renderType,
                plainText: this._model.getContent(),
            };
        }
        else if (renderType === EditorRenderType.Split) {
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

    private __initOptions(options: IEditorViewModelOptions): Required<IEditorViewModelOptions> {

        options.display =            ifOrDefault(options.display, EditorRenderType.Rich);
        options.codeblockHighlight = ifOrDefault(options.codeblockHighlight, true);

        return <Required<IEditorViewModelOptions>>options;
    }
}