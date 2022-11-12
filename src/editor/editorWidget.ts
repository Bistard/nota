import { Disposable, IDisposable } from "src/base/common/dispose";
import { basename } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { IEditorModel } from "src/editor/common/model";

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
        
        this.logService.trace(`Reading file '${basename(URI.toString(model.source))}'.`);
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
    }

}