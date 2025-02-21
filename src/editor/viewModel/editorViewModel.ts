import { history } from "prosemirror-history";
import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { defaultLog, ILogService } from "src/base/common/logger";
import { IEditorExtension } from "src/editor/common/editorExtension";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorToken, IEditorModel, IModelBuildData } from "src/editor/common/model";
import { ProseEditorState, ProseNode } from "src/editor/common/proseMirror";
import { IEditorViewModel, IViewModelBuildData, IViewModelChangeEvent } from "src/editor/common/viewModel";
import { DocumentNodeProvider } from "src/editor/model/documentNode/documentNodeProvider";
import { DocumentParser, IDocumentParser } from "src/editor/model/parser";
import { buildSchema, EditorSchema } from "src/editor/model/schema";
import { MarkdownSerializer } from "src/editor/model/serializer";
import { IOnDidContentChangeEvent } from "src/editor/view/proseEventBroadcaster";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [events]

    private readonly _onDidContentChange = this.__register(new Emitter<IViewModelChangeEvent>());
    public readonly onDidContentChange = this._onDidContentChange.registerListener;
    
    // [fields]

    private readonly _model: IEditorModel;

    private readonly _schema: EditorSchema;               // An object that defines how a view is organized.
    private readonly _nodeProvider: DocumentNodeProvider; // Stores all the legal document node.
    private readonly _docParser: IDocumentParser;         // Parser that parses the given token into a legal view based on the schema.
    private readonly _docSerializer: MarkdownSerializer;  // Serializer that transforms the prosemirror document back to raw string.

    // [constructor]

    constructor(
        model: IEditorModel,
        private readonly extensions: IEditorExtension[],
        @IInstantiationService instantiationService: IInstantiationService,
        @ILogService logService: ILogService,
    ) {
        super();
        this._model = model;

        this._nodeProvider = DocumentNodeProvider.create(instantiationService).register();
        this._schema = buildSchema(this._nodeProvider);
        this._docParser = this.__register(new DocumentParser(this._schema, this._nodeProvider, /* options */));
        this.__register(this._docParser.onLog(event => defaultLog(logService, event.level, 'EditorView', event.message, event.error, event.additional)));
        this._docSerializer = new MarkdownSerializer(this._nodeProvider, { strict: true, escapeExtraCharacters: undefined, });

        this.__registerListeners();
    }

    // [getter]

    get schema(): EditorSchema { return this._schema; }

    // [public methods]

    public build(e: IModelBuildData): IViewModelBuildData {
        const { tokens } = e;

        const document = this.__parse(tokens);
        const state = ProseEditorState.create({
            schema: this._schema,
            doc: document,
            plugins: [
                ...this.extensions.map(extension => extension.getViewExtension()),
                history({ depth: 500 }),
            ],
        });

        return {
            state: state,
        };
    }

    public onDidViewContentChange(e: IOnDidContentChangeEvent): void {
        this._model.setDirty(true);
        // TODO
    }

    public getRegisteredDocumentNodes(): string[] {
        return this._nodeProvider.getRegisteredNodes().map(each => each.name);
    }

    public getRegisteredDocumentNodesBlock(): string[] {
        const nodes = this._nodeProvider.getRegisteredNodes();
        const blocks: string[] = [];
        for (const node of nodes) {
            if (!node.getSchema().inline) {
                blocks.push(node.name);
            }
        }
        return blocks;
    }

    public getRegisteredDocumentNodesInline(): string[] {
        const nodes = this._nodeProvider.getRegisteredNodes();
        const blocks: string[] = [];
        for (const node of nodes) {
            if (node.getSchema().inline === true) {
                blocks.push(node.name);
            }
        }
        return blocks;
    }

    // [private methods]

    private __registerListeners(): void {
        
        /**
         * Mapping token: {@link TokenEnum.Space} to {@link TokenEnum.Paragraph}
         * Because `space` are just special cases for `paragraph`.
         */
        this._docParser.registerMapToken(TokenEnum.Space, (from) => {
            return {
                type: TokenEnum.Paragraph,
                text: '',
                raw: '',
                tokens: []
            };
        });
    }

    private __parse(tokens: EditorToken[]): ProseNode {
        console.log(tokens); // TEST

        const doc = this._docParser.parse(tokens);
        console.log(doc); // TEST

        // console.log(this._docSerializer.serialize(doc)); // TEST
        return doc;
    }
}