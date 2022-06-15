import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { IEditorModel } from "src/editor/common/model";
import { ViewEvent } from "src/editor/common/view";
import { IEditorViewModel, ILineWidget } from "src/editor/common/viewModel";
import { EditorViewComponent } from "src/editor/view/component/viewComponent";
import { EditorViewModelEventEmitter } from "src/editor/viewModel/editorViewModelEmitter";
import { LineWidget } from "src/editor/viewModel/lineWidget";

/**
 * @class // TODO
 */
export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [event]
    
    private readonly _onViewEvent = this.__register(new Emitter<ViewEvent.Events>());
    public readonly onViewEvent = this._onViewEvent.registerListener;

    // [field]
    
    private readonly _model: IEditorModel;
    private readonly _lineWidget: LineWidget;

    private readonly _emitter: EditorViewModelEventEmitter;

    // [constructor]

    constructor(
        model: IEditorModel,
    ) {
        super();
        
        this._model = model;
        
        this._lineWidget = new LineWidget(this, model);
        // ViewEvent.ScrollEvent
        this.__register(this._lineWidget.onDidScroll(e => {
            this._emitter.fire(new ViewEvent.ScrollEvent(e));
        }));

        this._emitter = new EditorViewModelEventEmitter();

        this.__registerModelListeners();
    }

    // [public methods]

    public addViewComponent(id: string, component: EditorViewComponent): IDisposable {
        return this._emitter.addViewComponent(id, component);
    }

    public getLineWidget(): ILineWidget {
        return this._lineWidget;
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