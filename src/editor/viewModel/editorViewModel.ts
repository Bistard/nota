import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { IEditorModel } from "src/editor/common/model";
import { ViewEvent } from "src/editor/common/view";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorItemProvider } from "src/editor/viewModel/editorItem";

/**
 * @class // TODO
 */
export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [event]
    
    private readonly _onDidFlush = this.__register(new Emitter<void>());
    public readonly onDidFlush = this._onDidFlush.registerListener;

    private readonly _onDidLineInserted = this.__register(new Emitter<ViewEvent.LineInsertedEvent>());
    public readonly onDidLineInserted = this._onDidLineInserted.registerListener;

    private readonly _onDidLineDeleted = this.__register(new Emitter<ViewEvent.LineDeletedEvent>());
    public readonly onDidLineDeleted = this._onDidLineDeleted.registerListener;

    private readonly _onDidLineChanged = this.__register(new Emitter<ViewEvent.LineChangedEvent>());
    public readonly onDidLineChanged = this._onDidLineChanged.registerListener;

    // [field]
    
    private readonly _model: IEditorModel;

    private readonly _itemProvider: EditorItemProvider;

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
        
        this._model.onDidChangeContent((events) => {
            
            const changes = events.changes;
            // TODO

        });
    }

}