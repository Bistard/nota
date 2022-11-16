import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { IEditorModel } from "src/editor/common/model";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { hit } from "test/util/helpers";

export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [field]

    private readonly _model: IEditorModel;

    // [event]

    private readonly _onFlush = this.__register(new Emitter<string[]>());
    public readonly onFlush = this._onFlush.registerListener;

    // [constructor]

    constructor(
        model: IEditorModel,
    ) {
        super();
        this._model = model;

        this.__registerModelListeners();
    }

    // [public methods]

    // [private helper methods]

    private __registerModelListeners(): void {
        
        this.__register(this._model.onDidBuild(success => { if (success) this.__onDidBuild(); }));
    }

    private __onDidBuild(): void {
        const newTextLines = this._model.getContent();
        this._onFlush.fire(newTextLines);
    }
}