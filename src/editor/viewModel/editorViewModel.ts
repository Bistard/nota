import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { IEditorModel } from "src/editor/common/model";
import { ProseNode } from "src/editor/common/prose";
import { IEditorViewModel, DocumentNodeType } from "src/editor/common/viewModel";
import { DocumentParser } from "src/editor/viewModel/parser/documentParser";
import { EditorSchema, MarkdownSchema } from "src/editor/viewModel/schema";

export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [field]

    private readonly _model: IEditorModel;
    private readonly _schema: EditorSchema;

    private _tokenToNodeTypes: Map<string, DocumentNodeType>;

    // [event]

    private readonly _onFlush = this.__register(new Emitter<ProseNode>());
    public readonly onFlush = this._onFlush.registerListener;

    // [constructor]

    constructor(
        model: IEditorModel,
    ) {
        super();
        this._model = model;
        
        this._schema = new MarkdownSchema();
        this._tokenToNodeTypes = new Map();
        this.__mappingTokenToNodeTypes(this._tokenToNodeTypes, this._schema);

        this.__registerModelListeners();
    }

    // [public methods]

    public getSchema(): EditorSchema {
        return this._schema;
    }

    // [private helper methods]

    private __registerModelListeners(): void {
        
        this.__register(this._model.onDidBuild(success => { if (success) this.__onDidBuild(); }));
    }

    private __onDidBuild(): void {
        const tokens = this._model.getTokens();
        console.log(tokens);

        const document = DocumentParser.parse(this._schema, tokens, this._tokenToNodeTypes);
        console.log(document);

        // if (document) {
        //     this._onFlush.fire(document);
        // }
    }

    private __mappingTokenToNodeTypes(map: Map<string, DocumentNodeType>, schema: EditorSchema): void {
        for (const nodeName in schema.nodes) {
            map.set(nodeName, DocumentNodeType.Block);
        }

        for (const markName in schema.marks) {
            map.set(markName, DocumentNodeType.Mark);
        }
    }
}