import { Disposable, IDisposable } from "src/base/common/dispose";
import { basename } from "src/base/common/file/path";
import { ILogService } from "src/base/common/logger";
import { IEditorModel } from "src/editor/common/model";
import { IEditorView } from "src/editor/common/view";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorView } from "src/editor/view/editorView";
import { EditorViewModel } from "src/editor/viewModel/editorViewModel";

/**
 * An interface only for {@link EditorWidget}.
 */
export interface IEditorWidget extends IDisposable {
    
    /**
     * @description Attech the given {@link IEditorModel} to the editor.
     */
    attachModel(model: IEditorModel): void;

}

/**
 * Consturctor option for {@link EditorWidget}.
 */
export interface IEditorWidgetOptions {

}

/**
 * @class // TODO
 */
export class EditorWidget extends Disposable implements IEditorWidget {

    // [fields]

    private _container: HTMLElement;

    private _model: IEditorModel | null;
    private _viewModel: IEditorViewModel | null;
    private _view: IEditorView | null;

    // [events]

    // [constructor]

    constructor(
        container: HTMLElement,
        options: IEditorWidgetOptions,
        @ILogService private readonly logService: ILogService,
    ) {
        super();

        this._container = container;

        this._model = null;
        this._viewModel = null;
        this._view = null;
    }

    // [public methods]

    public attachModel(model: IEditorModel | null): void {

        if (this._model === model) {
            return;
        }

        if (model === null) {
            this._model = null;
            return;
        }
        
        this.logService.trace(`Reading file '${basename(model.source.toString())}' successed.`); // REVIEW
        this.logService.debug(`Reading file '${basename(model.source.toString())}' successed.`); // REVIEW
        this.logService.info(`Reading file '${basename(model.source.toString())}' successed.`); // REVIEW
        this.logService.warn(`Reading file '${basename(model.source.toString())}' successed.`); // REVIEW
        this.logService.error(`Reading file '${basename(model.source.toString())}' successed.`); // REVIEW
        this.logService.fatal(`Reading file '${basename(model.source.toString())}' successed.`); // REVIEW
        this.__attechModel(model);
    }

    public override dispose(): void {
         
    }

    // [private helper methods]

    /**
     * @description Given the {@link IEditorModel}, generates the corresponding
     * {@link IEditorViewModel} and {@link EditorView}.
     */
    private __attechModel(model: IEditorModel): void {

        this._model = model;
        const viewModel = new EditorViewModel(model);
        const view = new EditorView(this._container, viewModel);
        
        view.render(false, true);

        this._viewModel = viewModel;
        this._view = view;
    }

}