import { Disposable, IDisposable } from "src/base/common/dispose";
import { basename } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService } from "src/code/platform/lifecycle/browser/browserLifecycleService";
import { IEditorModel } from "src/editor/common/model";
import { EditorViewDisplayType, IEditorView } from "src/editor/common/view";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorModel } from "src/editor/model/editorModel";
import { EditorView } from "src/editor/view/editorView";
import { EditorViewModel } from "src/editor/viewModel/editorViewModel";

/**
 * An interface only for {@link EditorWidget}.
 */
export interface IEditorWidget extends IDisposable {
    
    /**
     * @description Opens the source in the editor.
     * @param source The source in URI form.
     * 
     * @throws An exception will be thrown if the editor cannot open it.
     */
    open(source: URI): Promise<void>;
}

/**
 * Consturctor option for {@link EditorWidget}.
 */
export interface IEditorWidgetOptions {
    
    /**
     * Determines how the editor is about to render the view.
     */
    readonly display: EditorViewDisplayType;
}

/**
 * @class // TODO
 */
export class EditorWidget extends Disposable implements IEditorWidget {

    // [fields]

    private _container: HTMLElement;
    private _options: IEditorWidgetOptions;

    private _model: IEditorModel | null;
    private _viewModel: IEditorViewModel | null;
    private _view: IEditorView | null;

    // [events]

    // [constructor]

    constructor(
        container: HTMLElement,
        options: IEditorWidgetOptions,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
    ) {
        super();

        this._container = container;
        this._model = null;
        this._viewModel = null;
        this._view = null;

        this._options = options;

        this.__registerListeners();
    }

    // [public methods]

    public async open(source: URI): Promise<void> {
        const textModel = this.instantiationService.createInstance(EditorModel, source);
        
        this.__attachModel(textModel);
    }

    public override dispose(): void {
        super.dispose();

        this._model?.dispose();
        this._view?.dispose();
    }

    // [private helper methods]

    private __attachModel(model?: IEditorModel): void {
        
        if (!model) {
            this._model = null;
            return;
        }

        if (this._model === model) {
            return;
        }
        
        this.logService.trace(`Reading file '${basename(URI.toString(model.source))}'.`);

        // model attachment
        this._model = model;

        // view-model connection
        this._viewModel = new EditorViewModel(model);

        // view construction
        this._view = new EditorView(
            this._container, 
            this._viewModel,
            {
                display: this._options.display,
            }
        );

        this._model.build();
    }

    private __registerListeners(): void {

        this.lifecycleService.onBeforeQuit(() => this.__onQuit());
    }

    private __onQuit(): void {
        this._model?.onQuit();
    }
}