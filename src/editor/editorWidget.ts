import { FastElement } from "src/base/browser/basic/fastElement";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { basename } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { mixin } from "src/base/common/util/object";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService } from "src/code/platform/lifecycle/browser/browserLifecycleService";
import { IEditorModel, IEditorModelOptions } from "src/editor/common/model";
import { EditorViewDisplayType, IEditorView, IEditorViewOptions } from "src/editor/common/view";
import { IEditorViewModel, IEditorViewModelOptions } from "src/editor/common/viewModel";
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

    /**
     * @description Updates the options of the editor widget.
     * @param options The option.
     */
    updateOptions(options: Partial<IEditorWidgetOptions>): void;
}

/**
 * Consturctor option for {@link EditorWidget}.
 */
export interface IEditorWidgetOptions extends IEditorModelOptions, IEditorViewModelOptions, IEditorViewOptions {

}

/**
 * @class // TODO
 */
export class EditorWidget extends Disposable implements IEditorWidget {

    // [fields]

    private readonly _container: FastElement<HTMLElement>;
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

        this._container = new FastElement(container);
        this._model = null;
        this._viewModel = null;
        this._view = null;

        this._options = options;

        this.__registerListeners();
    }

    // [public methods]

    public async open(source: URI): Promise<void> {
        const textModel = this.instantiationService.createInstance(EditorModel, source, this._options);
        this.__attachModel(textModel);
    }

    public override dispose(): void {
        super.dispose();
        this._model?.dispose();
        this._view?.dispose();
    }

    public updateOptions(options: Partial<IEditorWidgetOptions>): void {
        this._options = mixin(this._options, options, true);
        this._model?.updateOptions(options);
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
        
        this.logService.trace(`EditorWidget#Reading file '${basename(URI.toString(model.source))}'`);

        // model attachment
        this._model = model;

        // view-model connection
        this._viewModel = this.instantiationService.createInstance(EditorViewModel, model, this._options);

        // view construction
        this._view = this.instantiationService.createInstance(EditorView, this._container.element, this._viewModel, this._options);

        this._model.build();
    }

    private __registerListeners(): void {

        this.lifecycleService.onBeforeQuit(() => this.__onQuit());
    }

    private __onQuit(): void {
        this._model?.onQuit();
    }
}