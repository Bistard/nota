import { Disposable } from "src/base/common/dispose";
import { URI } from "src/base/common/files/uri";
import { IEditorWidgetOptions } from "src/editor_new/common/editorConfiguration";
import { EditorModel } from "src/editor_new/model/editorModel";
import { EditorView } from "src/editor_new/view/editorView";
import { EditorViewModel } from "src/editor_new/viewModel/editorViewModel";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

/**
 * An interface only for {@link EditorWidget}.
 */
export interface IEditorWidget extends Disposable {

    /** 
     * The model component from the MVVM architecture.
     * @note Do not access this if you do not know what you are doing exactly.
     */
    readonly model: EditorModel | undefined;
    
    /** 
     * The view-model component from the MVVM architecture.
     * @note Do not access this if you do not know what you are doing exactly.
     */
    readonly viewModel: EditorViewModel | undefined;
    
    /** 
     * The view component from the MVVM architecture.
     * @note Do not access this if you do not know what you are doing exactly.
     */
    readonly view: EditorView | undefined;

    /**
     * @description Opens the source file in the editor. It will read the file
     * asynchronously.
     * @param source The source in URI form.
     */
    open(source: URI): Promise<void>;
}

/**
 * @class // TODO
 */
export class EditorWidget extends Disposable implements IEditorWidget {

    // [fields]

    private readonly _options: IEditorWidgetOptions;

    private _model?: EditorModel;
    private _viewModel?: EditorViewModel;
    private _view?: EditorView;
    
    // [constructor]

    constructor(
        opts: IEditorWidgetOptions,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
    ) {
        super();
        this._options = opts;
    }

    // [getter / setter]
    
    get model(): EditorModel | undefined {
        return this._model;
    }

    get viewModel(): EditorViewModel | undefined {
        return this._viewModel;
    }

    get view(): EditorView | undefined {
        return this._view;
    }

    // [public methods]

    public async open(source: URI): Promise<void> {
        this.__unload();
        this.__load(source);
    }

    public override dispose(): void {
        super.dispose();
    }

    // [private helper methods]

    /**
     * @description Destroys the previous models (along with all the metadata).
     */
    private __unload(): void {
        this._model?.dispose();
        this._viewModel?.dispose();
        this._view?.dispose();
        
        this._model = undefined;
        this._viewModel = undefined;
        this._view = undefined;
    }

    /**
     * @description Load the new source into the editor.
     */
    private __load(source: URI): void {

        // model
        const model = this.instantiationService.createInstance(
            EditorModel, 
            source,
            this._options,
        );

        // view-model
        const viewModel = this.instantiationService.createInstance(
            EditorViewModel, 
            model,
            this._options,
        );

        // view
        const view = this.instantiationService.createInstance(
            EditorView, 
            viewModel,
            this._options,
        );

        // registrations
        this._model = this.__register(model);
        this._viewModel = this.__register(viewModel);
        this._view = this.__register(view);
    }
}
