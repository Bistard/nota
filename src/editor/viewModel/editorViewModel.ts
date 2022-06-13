import { Disposable, IDisposable } from "src/base/common/dispose";
import { IEditorModel } from "src/editor/common/model";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorViewComponent } from "src/editor/view/viewComponent/viewComponent";
import { EditorItemProvider } from "src/editor/viewModel/editorItem";
import { EditorViewModelEventEmitter } from "src/editor/viewModel/editorViewModelEventEmitter";

/**
 * @class // TODO
 */
export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [event]
    
    // [field]
    
    private _model: IEditorModel;

    private _itemProvider: EditorItemProvider;

    private _eventEmitter: EditorViewModelEventEmitter;

    // [constructor]

    constructor(
        model: IEditorModel,
    ) {
        super();
        
        this._model = model;
        this._itemProvider = new EditorItemProvider();
        this._eventEmitter = new EditorViewModelEventEmitter();


        this.__registerModelListeners();
    }

    // [public methods]

    public getItemProvider(): EditorItemProvider {
        return this._itemProvider;
    }

    public addViewComponent(id: string, component: EditorViewComponent): IDisposable {
        return this._eventEmitter.addViewComponent(id, component);
    }

    // [private helper methods]

    /**
     * @description Registrations for {@link EditorModel} events.
     */
    private __registerModelListeners(): void {
        
        this._model.onDidChangeContent((changeEvents) => {
            
        });
    }

}