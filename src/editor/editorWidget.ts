import { FastElement } from "src/base/browser/basic/fastElement";
import { Disposable, DisposableManager, IDisposable } from "src/base/common/dispose";
import { Emitter, Event, Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ILogService, defaultLog } from "src/base/common/logger";
import { Constructor, isDefined } from "src/base/common/utilities/type";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { IEditorModel } from "src/editor/common/model";
import { IEditorView } from "src/editor/common/view";
import { EditorType, IEditorViewModel } from "src/editor/common/viewModel";
import { BasicEditorOption, EditorDefaultOptions, EditorOptionsType, IEditorOption, IEditorWidgetOptions, toJsonEditorOption } from "src/editor/common/configuration/editorConfiguration";
import { EditorModel } from "src/editor/model/editorModel";
import { EditorView } from "src/editor/view/editorView";
import { EditorViewModel } from "src/editor/viewModel/editorViewModel";
import { IContextService } from "src/platform/context/common/contextService";
import { IContextKey } from "src/platform/context/common/contextKey";
import { ConfigurationModuleType, IConfigurationService } from "src/platform/configuration/common/configuration";
import { IOnBeforeRenderEvent, IOnClickEvent, IOnDidClickEvent, IOnDidContentChangeEvent, IOnDidDoubleClickEvent, IOnDidRenderEvent, IOnDidSelectionChangeEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnKeydownEvent, IOnKeypressEvent, IOnPasteEvent, IOnRenderEvent, IOnTextInputEvent, IOnTripleClickEvent, IProseEventBroadcaster } from "src/editor/view/viewPart/editor/adapter/proseEventBroadcaster";
import { EditorExtension } from "src/editor/common/extension/editorExtension";
import { assert } from "src/base/common/utilities/panic";

/**
 * An interface only for {@link EditorWidget}.
 */
export interface IEditorWidget extends IProseEventBroadcaster {

    /**
     * Determine if the editor is readonly. If false, it means the file is 
     * writable.
     */
    readonly readonly: boolean;

    /**
     * The current rendering mode of the view.
     */
    readonly renderMode: EditorType | null;

    /**
     * Returns the model.
     */
    readonly model: IEditorModel;

    /**
     * Returns the view model.
     */
    readonly viewModel: IEditorViewModel;

    /**
     * Returns the view.
     */
    readonly view: IEditorView;

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
    
    // MVVM
    private _model: IEditorModel | null;
    private _viewModel: IEditorViewModel | null;
    private _view: IEditorView | null;
    private _editorData: EditorData | null;

    /**
     * Responsible for constructing a list of editor extensions
     */
    private readonly _extensions: EditorExtensionController;

    /**
     * Responsible for initializing and managing the editor options.
     */
    private readonly _options: EditorOptionController;

    // [events]

    private readonly _onDidFocusChange = this.__register(new Emitter<boolean>());
    public readonly onDidFocusChange = this._onDidFocusChange.registerListener;

    private readonly _onDidRenderModeChange = this.__register(new Emitter<EditorType>());
    public readonly onDidRenderModeChange = this._onDidRenderModeChange.registerListener;

    private readonly _onBeforeRender = this.__register(new Emitter<IOnBeforeRenderEvent>());
    public readonly onBeforeRender = this._onBeforeRender.registerListener;

    private readonly _onRender = this.__register(new Emitter<IOnRenderEvent>());
    public readonly onRender = this._onRender.registerListener;
    
    private readonly _onDidRender = this.__register(new Emitter<IOnDidRenderEvent>());
    public readonly onDidRender = this._onDidRender.registerListener;
    
    private readonly _onDidSelectionChange = this.__register(new Emitter<IOnDidSelectionChangeEvent>());
    public readonly onDidSelectionChange = this._onDidSelectionChange.registerListener;
    
    private readonly _onDidContentChange = this.__register(new Emitter<IOnDidContentChangeEvent>());
    public readonly onDidContentChange = this._onDidContentChange.registerListener;

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
    ) {
        super();

        this._container = new FastElement(container);
        this._model = null;
        this._viewModel = null;
        this._view = null;
        this._editorData = null;

        this._options    = instantiationService.createInstance(EditorOptionController, options);
        const contextHub = instantiationService.createInstance(EditorContextHub, this);
        this._extensions = instantiationService.createInstance(EditorExtensionController, extensions);

        this.__registerListeners();
        this.__register(contextHub);
        this.__register(this._extensions);
    }

    // [getter]

    get readonly(): boolean {
        return !this._options.getOptions().writable.value;
    }

    get model(): IEditorModel {
        return assert(this._model);
    }

    get viewModel(): IEditorViewModel {
        return assert(this._viewModel);
    }

    get view(): IEditorView {
        return assert(this._view);
    }

    get renderMode(): EditorType | null {
        return this._viewModel?.renderMode ?? null;
    }

    // [public methods]

    public async open(source: URI): Promise<void> {
        const currSource = this._model?.source;
        if (currSource && URI.equals(source, currSource)) {
            return;
        }

        this.__detachModel();
        const textModel = this.instantiationService.createInstance(EditorModel, source, this._options.getOptions());
        await this.__attachModel(textModel);
    }

    public override dispose(): void {
        super.dispose();
        this.__detachModel();
        this.logService.debug('EditorWidget', 'Editor disposed.');
    }

    public updateOptions(newOption: Partial<IEditorWidgetOptions>): void {
        this._options.updateOptions(newOption);
        this._model?.updateOptions(this._options.getOptions());
    }

    // [private helper methods]

    private async __attachModel(model?: IEditorModel): Promise<void> {
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
            this._options.getOptions(),
        );
        this._view = this.instantiationService.createInstance(
            EditorView,
            this._container.raw,
            this._viewModel,
            this._extensions.getExtensions(),
            this._options.getOptions(),
        );

        const listeners = this.__registerMVVMListeners(this._model, this._viewModel, this._view);
        await this._model.build();

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
        this.__register(this.lifecycleService.onBeforeQuit(() => this._options.saveOptions()));

        this.__register(this.configurationService.onDidConfigurationChange(e => {
            if (e.affect('editor')) {
                const newOption = this.configurationService.get<IEditorWidgetOptions>('editor');
                this._options.updateOptions(newOption);
            }
        }));
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
        disposables.register(view.onRender(e => this._onRender.fire(e)));
        disposables.register(view.onDidRender(e => this._onDidRender.fire(e)));
        disposables.register(view.onDidSelectionChange(e => this._onDidSelectionChange.fire(e)));
        disposables.register(view.onDidContentChange(e => this._onDidContentChange.fire(e)));
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

        // TODO: configuration auto update

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
class EditorContextHub extends Disposable {

    // [context]

    private readonly focusedEditor: IContextKey<boolean>;
    private readonly isEditorReadonly: IContextKey<boolean>;
    private readonly isEditorWritable: IContextKey<boolean>;
    private readonly editorRenderMode: IContextKey<EditorType | null>;

    // [constructor]

    constructor(
        private readonly editor: IEditorWidget,
        @IContextService contextService: IContextService,
    ) {
        super();

        this.focusedEditor = contextService.createContextKey('isEditorFocused', false, 'Whether the editor is focused.');
        this.isEditorReadonly = contextService.createContextKey('isEditorReadonly', editor.readonly, 'Whether the editor is currently readonly.');
        this.isEditorWritable = contextService.createContextKey('isEditorWritable', !editor.readonly, 'Whether the editor is currently writable.');
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

class EditorExtensionController extends Disposable {

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
                logService.trace('EditorWidget', `Editor extension constructing: ${id}`);
                const instance = instantiationService.createInstance(ctor, this);
                this._extensions.set(id, instance);
                logService.trace('EditorWidget', `Editor extension constructed: ${id}`);
            } catch (error: any) {
                logService.error('EditorWidget', `Cannot create the editor extension: ${id}`, error);
            }
        }
    }

    // [public methods]

    public getExtensions(): EditorExtension[] {
        return [...this._extensions.values()];
    }

    public getExtensionByID(id: string): EditorExtension | undefined {
        return this._extensions.get(id);
    }
}

class EditorOptionController {

    // [fields]

    private readonly _options: EditorOptionsType;

    // [constructor]

    constructor(
        unresolvedOption: IEditorWidgetOptions,
        @ILogService private readonly logService: ILogService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
    ) {
        const resolvedOption = this.__initOptions(unresolvedOption);
        this._options = resolvedOption;
    }

    // [public methods]

    public getOptions(): EditorOptionsType {
        return this._options;
    }

    public updateOptions(newOption: Partial<IEditorWidgetOptions>): void {
        this.__updateOptions(this._options, newOption);
    }

    public saveOptions(): void {
        const option = {};
        for (const [key, value] of Object.entries(this._options)) {
            option[key] = value.value ?? null;
        }
        this.configurationService.set('editor', option, { type: ConfigurationModuleType.Memory });
    }

    // [private methods]

    private __initOptions(newOption: IEditorWidgetOptions): EditorOptionsType {
        const mixOptions = EditorDefaultOptions;
        this.__updateOptions(mixOptions, newOption);

        this.logService.debug('EditorWidget', 'Editor initialized with configurations.', toJsonEditorOption(mixOptions));
        return mixOptions;
    }

    private __updateOptions(option: EditorOptionsType, newOption: Partial<IEditorWidgetOptions>): void {
        for (const [key, value] of Object.entries(newOption)) {

            // only updates the option if they both have the same key
            if (!isDefined(option[key]) || !(option[key] instanceof BasicEditorOption)) {
                this.logService.warn('EditorWidget', `Cannot find editor option with key name: ${key}`);
                continue;
            }
            
            const opt = option[key];
            opt.updateWith(value);
        }
    }
}