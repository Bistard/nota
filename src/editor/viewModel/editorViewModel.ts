import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { IEditorModel } from "src/editor/common/model";
import { ProseNode } from "src/editor/common/prose";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { DocumentNodeProvider } from "src/editor/viewModel/parser/documentNode";
import { DocumentParser, IDocumentParser } from "src/editor/viewModel/parser/documentParser";
import { Emphasis } from "src/editor/viewModel/parser/mark/emphasis";
import { Link } from "src/editor/viewModel/parser/mark/link";
import { Strong } from "src/editor/viewModel/parser/mark/strong";
import { Blockquote } from "src/editor/viewModel/parser/node/blockquote";
import { Heading } from "src/editor/viewModel/parser/node/heading";
import { Paragraph } from "src/editor/viewModel/parser/node/paragraph";
import { Space } from "src/editor/viewModel/parser/node/space";
import { Text } from "src/editor/viewModel/parser/node/text";
import { EditorSchema, MarkdownSchema } from "src/editor/viewModel/schema";

export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [field]

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
    ) {
        super();
        this._model = model;

        this._nodeProvider = new DocumentNodeProvider();
        this.__registerNodeAndMark(this._nodeProvider);
        this._schema = new MarkdownSchema(this._nodeProvider);
        this._nodeProvider.init(this._schema);

        this._docParser = new DocumentParser(this._schema, this._nodeProvider);

        this.__registerModelListeners();
    }

    // [public methods]

    public getSchema(): EditorSchema {
        return this._schema;
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
        console.log(tokens);

        const document = this._docParser.parse(tokens);
        console.log(document);

        // if (document) {
        //     this._onFlush.fire(document);
        // }
    }

    private __registerNodeAndMark(provider: DocumentNodeProvider): void {
        provider.registerNode(new Space());
        provider.registerNode(new Text());
        provider.registerNode(new Heading());
        provider.registerNode(new Paragraph());
        provider.registerNode(new Blockquote());

        provider.registerMark(new Link());
        provider.registerMark(new Emphasis());
        provider.registerMark(new Strong());
    }
}