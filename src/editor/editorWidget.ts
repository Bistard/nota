import { Disposable, IDisposable } from "src/base/common/dispose";
import { basename } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { EventBlocker } from "src/base/common/util/async";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IEditorModel } from "src/editor/common/model";
import { EditorViewDisplayType, IEditorView } from "src/editor/common/view";
import { EditorModel } from "src/editor/model/editorModel";
import { EditorView } from "src/editor/view/editorView";

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
     * @description Attech the given {@link IEditorModel} to the editor.
     */
    attachModel(model: IEditorModel): void;
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
    private _view: IEditorView | null;

    // [events]

    // [constructor]

    constructor(
        container: HTMLElement,
        options: IEditorWidgetOptions,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();

        this._container = container;
        this._model = null;
        this._view = null;

        this._options = options;
    }

    // [public methods]

    public async open(source: URI): Promise<void> {
        const textModel = new EditorModel(source, this.fileService);
        
        const build = new EventBlocker(textModel.onDidBuild, 3000);
        const result = await build.waiting();
        if (result) {
            throw result;
        }
        
        this.attachModel(textModel);
    }

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
        super.dispose();

        this._model?.dispose();
        this._view?.dispose();
    }

    // [private helper methods]

    private __attechModel(model: IEditorModel): void {

        this._model = model;

        this._view = new EditorView(this._container, {
            display: this._options.display,
        });
    }
}