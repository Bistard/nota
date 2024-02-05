import { FastElement } from "src/base/browser/basic/fastElement";
import { Disposable, DisposableManager, IDisposable } from "src/base/common/dispose";
import { Emitter, Event, Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ILogService, defaultLog } from "src/base/common/logger";
import { Constructor, isNonNullable } from "src/base/common/utilities/type";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { IEditorModel } from "src/editor/common/model";
import { IEditorView } from "src/editor/common/view";
import { EditorType, IEditorViewModel } from "src/editor/common/viewModel";
import { EditorOptions, EditorOptionsType, IEditorWidgetOptions, toJsonEditorOption } from "src/editor/common/configuration/editorConfiguration";
import { EditorModel } from "src/editor/model/editorModel";
import { EditorView } from "src/editor/view/editorView";
import { EditorViewModel } from "src/editor/viewModel/editorViewModel";
import { IContextService } from "src/platform/context/common/contextService";
import { IContextKey } from "src/platform/context/common/contextKey";
import { IProseEventBroadcaster, IOnBeforeRenderEvent, IOnClickEvent, IOnDidClickEvent, IOnDidDoubleClickEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnKeydownEvent, IOnKeypressEvent, IOnPasteEvent, IOnTextInputEvent, IOnTripleClickEvent } from "src/editor/view/viewPart/editor/adapter/proseEventBroadcaster";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { EditorExtension } from "src/editor/common/extension/editorExtension";

/**
 * An interface only for {@link EditorWidget}.
 */
export interface IEditorWidget extends IProseEventBroadcaster {

    /**
     * The current rendering mode of the view.
     */
    readonly renderMode: EditorType | null;

    /**
     * Fires when the editor render mode has changed.
     */
    readonly onDidRenderModeChange: Register<EditorType>;

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
 * @class `EditorWidget` serves as a comprehensive UI component within an editor 
 * framework, embodying the Model-View-ViewModel (MVVM) architectural pattern to 
 * offer a highly interactive and responsive editing environment. 
 * 
 * The widget's model (`IEditorModel`) represents the editor's data and business 
 * logic.
 * 
 * The view (`IEditorView`), on the other hand, is concerned with the visual 
 * representation of the editor's content, handling user interactions and 
 * rendering the text within the editor's UI.
 * 
 * Bridging the model and view, the viewModel (`IEditorViewModel`) acts as an 
 * intermediary, synchronizing the model's state with its representation in the 
 * view and reacting to user inputs to update the model accordingly.
 */
export class EditorWidget extends Disposable implements IEditorWidget {

    // [fields]

    /**
     * The HTML container of the entire editor.
     */
    private readonly _container: FastElement<HTMLElement>;
    
    /**
     * The smart editor options that supports API to self update.
     */
    private readonly _options: EditorOptionsType;

    // MVVM
    private _model: IEditorModel | null;
    private _viewModel: IEditorViewModel | null;
    private _view: IEditorView | null;
    private _editorData: EditorData | null;

    /**
     * Responsible for constructing a list of editor extensions
     */
    private readonly _extensionManager: EditorExtensionManager;

    // [events]

    private readonly _onDidFocusChange = this.__register(new Emitter<boolean>());
    public readonly onDidFocusChange = this._onDidFocusChange.registerListener;

    private readonly _onDidRenderModeChange = this.__register(new Emitter<EditorType>());
    public readonly onDidRenderModeChange = this._onDidRenderModeChange.registerListener;

    private readonly _onBeforeRender = this.__register(new Emitter<IOnBeforeRenderEvent>());
    public readonly onBeforeRender = this._onBeforeRender.registerListener;

    private readonly _onClick = this.__register(new Emitter<IOnClickEvent>());
    public readonly onClick = this._onClick.registerListener;

    private readonly _onDidClick = this.__register(new Emitter<IOnDidClickEvent>());
    public readonly onDidClick = this._onDidClick.registerListener;

    private readonly _onDoubleClick = this.__register(new Emitter<IOnDoubleClickEvent>());
    public readonly onDoubleClick = this._onDoubleClick.registerListener;

    private readonly _onDidDoubleClick = this.__register(new Emitter<IOnDidDoubleClickEvent>());
    public readonly onDidDoubleClick = this._onDidDoubleClick.registerListener;

    private readonly _onTripleClick = this.__register(new Emitter<IOnTripleClickEvent>());
    public readonly onTripleClick = this._onTripleClick.registerListener;

    private readonly _onDidTripleClick = this.__register(new Emitter<IOnDidTripleClickEvent>());
    public readonly onDidTripleClick = this._onDidTripleClick.registerListener;

    private readonly _onKeydown = this.__register(new Emitter<IOnKeydownEvent>());
    public readonly onKeydown = this._onKeydown.registerListener;

    private readonly _onKeypress = this.__register(new Emitter<IOnKeypressEvent>());
    public readonly onKeypress = this._onKeypress.registerListener;

    private readonly _onTextInput = this.__register(new Emitter<IOnTextInputEvent>());
    public readonly onTextInput = this._onTextInput.registerListener;

    private readonly _onPaste = this.__register(new Emitter<IOnPasteEvent>());
    public readonly onPaste = this._onPaste.registerListener;

    private readonly _onDrop = this.__register(new Emitter<IOnDropEvent>());
    public readonly onDrop = this._onDrop.registerListener;

    // [constructor]

    constructor(
        container: HTMLElement,
        extensions: { id: string, ctor: Constructor<EditorExtension> }[],
        options: IEditorWidgetOptions,
        @ILogService private readonly logService: ILogService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IContextService contextService: IContextService,
    ) {
        super();

        this._container = new FastElement(container);
        this._model = null;
        this._viewModel = null;
        this._view = null;
        this._editorData = null;

        this._options = this.__initOptions(options);
        
        const contextUpdater = new EditorContextUpdater(this, contextService);
        this._extensionManager = new EditorExtensionManager(extensions, instantiationService, logService);

        this.__registerListeners();
        this.__register(contextUpdater);
        this.__register(this._extensionManager);
    }

    // [getter]

    get model(): IEditorModel | null {
        return this._model;
    }

    get viewModel(): IEditorViewModel | null {
        return this._viewModel;
    }

    get view(): IEditorView | null {
        return this._view;
    }

    get renderMode(): EditorType | null {
        return this._viewModel?.renderMode ?? null;
    }

    // [public methods]

    public async open(source: URI): Promise<void> {
        this.logService.debug('EditorWidget', `Editor openning source at: ${URI.toString(source)}`);

        this.__detachModel();
        const textModel = this.instantiationService.createInstance(EditorModel, source, this._options);
        this.__attachModel(textModel);
    }

    public override dispose(): void {
        super.dispose();
        this.__detachModel();
        this.logService.debug('EditorWidget', 'Editor disposed.');
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

        this._model = model;
        this._viewModel = this.instantiationService.createInstance(
            EditorViewModel,
            model,
            this._options,
        );
        this._view = this.instantiationService.createInstance(
            EditorView,
            this._container.element,
            this._viewModel,
            this._extensionManager.getExtensions(),
            this._options,
        );

        const listeners = this.__registerMVVMListeners(this._model, this._viewModel, this._view);
        this._model.build();

        this._editorData = new EditorData(this._model, this._viewModel, this._view, listeners);
    }

    private __detachModel(): void {
        this._editorData?.dispose();
        this._model = null;
        this._viewModel = null;
        this._view = null;
        this._editorData = null;
    }

    private __registerListeners(): void {
        this.__register(this.lifecycleService.onBeforeQuit(() => this.__saveEditorOptions()));

        this.__register(this.configurationService.onDidConfigurationChange(e => {
            if (e.affect('editor')) {
                const newOption = this.configurationService.get<IEditorWidgetOptions>('editor');
                this.__updateOptions(this._options, newOption);
            }
        }));
    }

    private __initOptions(newOption: IEditorWidgetOptions): EditorOptionsType {
        const mixOptions = EditorOptions;
        this.__updateOptions(mixOptions, newOption);

        this.logService.debug('EditorWidget', 'Editor intialized with configurations.', toJsonEditorOption(mixOptions));
        return mixOptions;
    }

    private __updateOptions(option: EditorOptionsType, newOption: Partial<IEditorWidgetOptions>): void {
        for (const [key, value] of Object.entries(newOption)) {

            // only updates the option if they both have the same key
            if (isNonNullable(option[key])) {
                const opt = option[key];
                opt.updateWith(value);
            }
        }
    }

    private __saveEditorOptions(): void {
        const option: IEditorWidgetOptions = {};
        for (const [key, value] of Object.entries(this._options)) {
            option[key] = value.value ?? null;
        }

        this.configurationService.set('editor', option);
    }

    private __registerMVVMListeners(model: IEditorModel, viewModel: IEditorViewModel, view: IEditorView): IDisposable {
        const disposables = new DisposableManager();

        // log out all the messages from MVVM
        disposables.register(Event.any([model.onLog, viewModel.onLog, view.onLog])((event) => {
            defaultLog(this.logService, event.level, 'EditorWidget', event.message, event.error, event.additionals);
        }));

        // binding to the view model
        disposables.register(viewModel.onDidRenderModeChange(e => this._onDidRenderModeChange.fire(e)));

        // binding to the view
        disposables.register(view.onDidFocusChange(e => this._onDidFocusChange.fire(e)));
        disposables.register(view.onBeforeRender(e => this._onBeforeRender.fire(e)));
        disposables.register(view.onClick(e => this._onClick.fire(e)));
        disposables.register(view.onDidClick(e => this._onDidClick.fire(e)));
        disposables.register(view.onDoubleClick(e => this._onDoubleClick.fire(e)));
        disposables.register(view.onDidDoubleClick(e => this._onDidDoubleClick.fire(e)));
        disposables.register(view.onTripleClick(e => this._onTripleClick.fire(e)));
        disposables.register(view.onDidTripleClick(e => this._onDidTripleClick.fire(e)));
        disposables.register(view.onKeydown(e => this._onKeydown.fire(e)));
        disposables.register(view.onKeypress(e => this._onKeypress.fire(e)));
        disposables.register(view.onTextInput(e => this._onTextInput.fire(e)));
        disposables.register(view.onPaste(e => this._onPaste.fire(e)));
        disposables.register(view.onDrop(e => this._onDrop.fire(e)));

        // TODO: configuration auto updation

        return disposables;
    }
}

class EditorData implements IDisposable {

    constructor(
        public readonly model: IEditorModel,
        public readonly viewModel: IEditorViewModel,
        public readonly view: IEditorView,
        public readonly listeners: IDisposable,
    ) { }

    public dispose(): void {
        this.listeners.dispose();
        this.model.dispose();
        this.viewModel.dispose();
        this.view.dispose();
    }
}

/**
 * @class Once the class is constructed, the {@link IContextKey} relates to 
 * editor will be self-updated.
 */
class EditorContextUpdater extends Disposable {

    // [context]

    private readonly focusedEditor: IContextKey<boolean>;
    private readonly editorRenderMode: IContextKey<EditorType | null>;

    // [constructor]

    constructor(
        private readonly editor: IEditorWidget,
        contextService: IContextService,
    ) {
        super();

        this.focusedEditor = contextService.createContextKey('isEditorFocused', false, 'Whether the editor is focused.');
        this.editorRenderMode = contextService.createContextKey('editorRenderMode', editor.renderMode, 'The render mode of the editor.');

        // Register auto update context listeners
        this.__registerListeners();
    }

    // [private helper methods]

    private __registerListeners(): void {
        this.__register(this.editor.onDidFocusChange(isFocused => this.focusedEditor.set(isFocused)));
        this.__register(this.editor.onDidRenderModeChange(mode => this.editorRenderMode.set(mode)));
    }
}

export type EditorExtensionInfo = { 
    readonly id: string;
    readonly extension: EditorExtension;
};

class EditorExtensionManager extends Disposable {

    // [fields]

    private readonly _extensions: Map<string, EditorExtension>;

    // [constructor]

    constructor(
        extensions: { id: string, ctor: Constructor<EditorExtension> }[],
        @IInstantiationService instantiationService: IInstantiationService,
        @ILogService logService: ILogService,
    ) {
        super();
        this._extensions = new Map();

        for (const { id, ctor} of extensions) {
            try {
                const instance = instantiationService.createInstance(ctor);
                this._extensions.set(id, instance);
                logService.debug('EditorWidget', `Editor extension constructed: ${id}`);
            } catch (error: any) {
                logService.error('EditorWidget', `Cannot create the editor extension: ${id}`, error);
            }
        }
    }

    // [public methods]

    public getExtensions(): EditorExtensionInfo[] {
        return [...Array.from(this._extensions.entries(), ([id, extension]) => { return { id, extension }; })];
    }
}