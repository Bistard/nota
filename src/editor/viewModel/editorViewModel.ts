import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { IEditorModel } from "src/editor/common/model";
import { ProseNode } from "src/editor/common/prose";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorSchema, MarkdownSchema } from "src/editor/viewModel/schema";

export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [field]

    private readonly _model: IEditorModel;
    private readonly _schema: EditorSchema;

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
        const content = this._model.getRawContent();
        
        console.log(this._model.getTokens());

        // const doc = defaultMarkdownParser.parse(content);
        // if (doc) {
        //     this._onFlush.fire(doc);
        // }
    }
}