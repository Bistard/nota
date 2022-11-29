import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { IEditorModel } from "src/editor/common/model";
import { ProseNode } from "src/editor/common/proseMirror";
import { IEditorViewModel, IEditorViewModelOptions } from "src/editor/common/viewModel";
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
import { defaultLog, ILogService, LogLevel } from "src/base/common/logger";
import { List, ListItem } from "src/editor/viewModel/parser/node/list";

export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [field]

    private readonly _options: IEditorViewModelOptions;

    private readonly _model: IEditorModel;
    private readonly _nodeProvider: DocumentNodeProvider;
    private readonly _schema: EditorSchema;
    private readonly _docParser: IDocumentParser;

    // [event]

    private readonly _onFlush = this.__register(new Emitter<ProseNode>());
    public readonly onFlush = this._onFlush.registerListener;

    // [constructor]

    constructor(
        model: IEditorModel,
        options: IEditorViewModelOptions,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        this._model = model;
        this._options = options;

        this._nodeProvider = new DocumentNodeProvider();
        this.__registerNodeProvider();

        this._schema = new MarkdownSchema(this._nodeProvider);

        this._docParser = new DocumentParser(this._schema, this._nodeProvider, /* options */);
        this._docParser.onLog( event => defaultLog(this.logService, event.level, event.data) );

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
        
        this.__register(this._model.onDidBuild(success => { 
            if (success) {
                this.__onDidBuild();
            }
        }));
    }

    private __onDidBuild(): void {
        const tokens = this._model.getTokens();
        console.log('[tokens]', tokens); // TEST

        const document = this._docParser.parse(tokens);
        console.log('[document]', document); // TEST

        if (document) {
            this._onFlush.fire(document);
        }
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

        // marks
        provider.registerMark(new Link());
        provider.registerMark(new Emphasis());
        provider.registerMark(new Strong());
        provider.registerMark(new Codespan());
    }
}