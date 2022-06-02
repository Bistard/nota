import { Disposable, IDisposable } from "src/base/common/dispose";
import { IEditorModel } from "src/editor/model/editorModel";
import { EditorItemProvider } from "src/editor/viewModel/editorItem";

/**
 * An interface only for {@link EditorViewModel}.
 */
 export interface IEditorViewModel extends IDisposable {

    getItemProvider(): EditorItemProvider;

}

/**
 * @class // TODO
 */
export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [event]
    
    // [field]
    
    private _model: IEditorModel;

    private _itemProvider: EditorItemProvider;

    // [constructor]

    constructor(
        model: IEditorModel,
    ) {
        super();
        this._model = model;

        this._itemProvider = new EditorItemProvider();

        this.__registerModelListeners();
    }

    // [public methods]

    public getItemProvider(): EditorItemProvider {
        return this._itemProvider;
    }

    // [private helper methods]

    /**
     * @description Registrations for {@link EditorModel} events.
     */
    private __registerModelListeners(): void {
        
        this._model.onDidChangeContent(() => {

        });
    }

}