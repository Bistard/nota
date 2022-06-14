import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { IEditorModel } from "src/editor/common/model";
import { ViewEvent } from "src/editor/common/view";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorViewComponent } from "src/editor/view/component/viewComponent";
import { EditorItemProvider } from "src/editor/viewModel/editorItem";
import { EditorViewModelEventEmitter } from "src/editor/viewModel/editorViewModelEmitter";

/**
 * @class // TODO
 */
export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [event]
    
    private readonly _onViewEvent = this.__register(new Emitter<ViewEvent.Events>());
    public readonly onViewEvent = this._onViewEvent.registerListener;

    // [field]
    
    private readonly _model: IEditorModel;

    private readonly _itemProvider: EditorItemProvider;

    private readonly _emitter: EditorViewModelEventEmitter;

    // [constructor]

    constructor(
        model: IEditorModel,
    ) {
        super();
        
        this._model = model;
        this._itemProvider = new EditorItemProvider();
        this._emitter = new EditorViewModelEventEmitter();

        this.__registerModelListeners();
    }

    // [public methods]

    public getItemProvider(): EditorItemProvider {
        return this._itemProvider;
    }

    public addViewComponent(id: string, component: EditorViewComponent): IDisposable {
        return this._emitter.addViewComponent(id, component);
    }

    // [private helper methods]

    /**
     * @description Registrations for {@link EditorModel} events.
     */
    private __registerModelListeners(): void {
        
        this._model.onEvent((events) => {
            
            this._emitter.pause();

            // TODO

            this._emitter.resume();
        });
    }

}