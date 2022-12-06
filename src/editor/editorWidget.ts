import { FastElement } from "src/base/browser/basic/fastElement";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { Event } from "src/base/common/event";
import { basename } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { defaultLog, ILogService } from "src/base/common/logger";
import { isNonNullable } from "src/base/common/util/type";
import { ICommandService } from "src/code/platform/command/common/commandService";
import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { BuiltInConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService } from "src/code/platform/lifecycle/browser/browserLifecycleService";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";
import { IEditorModel } from "src/editor/common/model";
import { IEditorView } from "src/editor/common/view";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorOptions, EditorOptionsType, IEditorOption, IEditorWidgetOptions } from "src/editor/common/configuration/editorConfiguration";
import { IEditorExtension } from "src/editor/common/extensions/editorExtension";
import { IEditorExtensionRegistrant } from "src/editor/common/extensions/editorExtensionRegistrant";
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
 * @class // TODO
 */
export class EditorWidget extends Disposable implements IEditorWidget {

    // [fields]

    private readonly _container: FastElement<HTMLElement>;
    private readonly _options: EditorOptionsType;

    private _model: IEditorModel | null;
    private _viewModel: IEditorViewModel | null;
    private _view: IEditorView | null;

    private readonly _extensionCentre: EditorExtensionCentre;

    // [events]

    // [constructor]

    constructor(
        container: HTMLElement,
        options: IEditorWidgetOptions,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @IConfigService private readonly configService: IConfigService,
        @ICommandService private readonly commandService: ICommandService,
    ) {
        super();

        this._container = new FastElement(container);
        this._model = null;
        this._viewModel = null;
        this._view = null;

        this._options = this.__initOptions(options);

        this._extensionCentre = new EditorExtensionCentre(this, instantiationService);

        this.__registerListeners();

        // resource registrantion
        this.__register(this._extensionCentre);
    }

    // [public methods]

    public async open(source: URI): Promise<void> {
        this.__detachModel();
        const textModel = this.instantiationService.createInstance(EditorModel, source, this._options);
        this.__attachModel(textModel);
    }

    public override dispose(): void {
        super.dispose();
        this.__detachModel();
    }

    public updateOptions(newOption: Partial<IEditorWidgetOptions>): void {
        this.__updateOptions(this._options, newOption);
        this._model?.updateOptions(this._options);
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

        this.__registerMVVMListeners(this._model, this._viewModel, this._view);

        this._model.build();
    }

    private __detachModel(): void {
        if (this._model) {
            this._model.dispose();
            this._model = null;
        }

        if (this._viewModel) {
            this._viewModel.dispose();
            this._viewModel = null;
        }

        if (this._view) {
            this._view.dispose();
            this._view = null;
        }
    }

    private __registerListeners(): void {
        this.lifecycleService.onBeforeQuit(() => this.__saveEditorOptions());

        this.configService.onDidChange<IEditorWidgetOptions>(BuiltInConfigScope.User, 'editor', (newOption) => {
            console.log('[on did change config]', newOption);
            this.__updateOptions(this._options, newOption);
        });
    }

    private __initOptions(newOption: IEditorWidgetOptions): EditorOptionsType {
        const mixOptions = EditorOptions;
        this.__updateOptions(mixOptions, newOption);
        return mixOptions;
    }

    private __updateOptions(option: EditorOptionsType, newOption: Partial<IEditorWidgetOptions>): void {
        for (const [key, value] of Object.entries(newOption)) {
            
            // only updates the option if they both have the same key
            if (isNonNullable(option[key])) {
                const opt = <IEditorOption<any, any>>option[key];
                opt.updateWith(value);
            }
        }
    }

    private __saveEditorOptions(): void {

        let option: IEditorWidgetOptions = {};
        for (const [key, value] of Object.entries(this._options)) {
            option[key] = value.value;
        }

        this.configService.set(BuiltInConfigScope.User, 'editor', option);
    }

    private __registerMVVMListeners(model: IEditorModel, viewModel: IEditorViewModel, view: IEditorView): void {

        // log out all the messages from MVVM.
        Event.any([model.onLog, viewModel.onLog, view.onLog])((event) => {
            defaultLog(this.logService, event.level, event.data);
        });

        // TODO: configuration auto updation
    }
}

/**
 * @internal
 * @class Use to manage all the editor-related extensions lifecycle.
 */
class EditorExtensionCentre implements IDisposable {

    // [field]

    private readonly _extensions: Map<string, IEditorExtension>;
    private readonly _registrant: IEditorExtensionRegistrant;

    // [constructor]

    constructor(
        editorWidget: IEditorWidget,
        instantiationService: IInstantiationService,
    ) {

        this._extensions = new Map();
        this._registrant = REGISTRANTS.get(IEditorExtensionRegistrant);

        // constructs all the extensions for the editor
        const descriptors = this._registrant.getEditorExtensions();
        for (const { ID, ctor } of descriptors) {

            const exist = this._extensions.get(ID);
            if (exist) {
                ErrorHandler.onUnexpectedError(new Error(`Cannot register two editor extensions with the same ID: '${ID}'`));
                continue;
            }

            try {
                const extension = instantiationService.createInstance(ctor, editorWidget, this);
                this._extensions.set(ID, extension);
            } catch (err) {
                ErrorHandler.onUnexpectedError(err);
            }
        }
    }

    // [public methods]

    public dispose(): void {
        for (const extension of this._extensions.values()) {
            extension.dispose();
        }
        this._extensions.clear();
    }
}