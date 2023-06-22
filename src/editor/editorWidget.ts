import "src/editor/contrib/contribution.register";
import "src/editor/common/command/command.register";
import { FastElement } from "src/base/browser/basic/fastElement";
import { Disposable, DisposableManager, IDisposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { Emitter, Event, Register } from "src/base/common/event";
import { basename } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { defaultLog, ILogService } from "src/base/common/logger";
import { isNonNullable } from "src/base/common/util/type";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService } from "src/code/platform/lifecycle/browser/browserLifecycleService";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";
import { IEditorModel } from "src/editor/common/model";
import { IEditorView } from "src/editor/common/view";
import { EditorType, IEditorViewModel } from "src/editor/common/viewModel";
import { EditorOptions, EditorOptionsType, IEditorOption, IEditorWidgetOptions } from "src/editor/common/configuration/editorConfiguration";
import { IEditorExtension } from "src/editor/common/extension/editorExtension";
import { IEditorExtensionRegistrant } from "src/editor/common/extension/editorExtensionRegistrant";
import { EditorModel } from "src/editor/model/editorModel";
import { EditorView } from "src/editor/view/editorView";
import { EditorViewModel } from "src/editor/viewModel/editorViewModel";
import { IContextService } from "src/code/platform/context/common/contextService";
import { IContextKey } from "src/code/platform/context/common/contextKey";
import { IEditorEventBroadcaster, IOnBeforeRenderEvent, IOnClickEvent, IOnDidClickEvent, IOnDidDoubleClickEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnKeydownEvent, IOnKeypressEvent, IOnPasteEvent, IOnTextInputEvent, IOnTripleClickEvent } from "src/editor/common/eventBroadcaster";
import { IConfigurationService } from "src/code/platform/configuration/common/configuration";

/**
 * An interface only for {@link EditorWidget}.
 */
export interface IEditorWidget extends IEditorEventBroadcaster {
    
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

export interface IEditorWidgetFriendship extends IEditorWidget {
    readonly model: IEditorModel | null;
    readonly viewModel: IEditorViewModel | null;
    readonly view: IEditorView | null;
}

/**
 * @class // TODO
 */
export class EditorWidget extends Disposable implements IEditorWidgetFriendship {

    // [fields]

    private readonly _container: FastElement<HTMLElement>;
    private readonly _options: EditorOptionsType;

    private _model: IEditorModel | null;
    private _viewModel: IEditorViewModel | null;
    private _view: IEditorView | null;
    private _editorData: EditorData | null;

    private readonly _extensionManager: EditorExtensionManager;
    private readonly _editorContextManager: EditorContextManager;

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

        this._extensionManager = new EditorExtensionManager(this, instantiationService);
        this._editorContextManager = new EditorContextManager(this, contextService);

        this.__registerListeners();

        // resource registrantion
        this.__register(this._extensionManager);
        this.__register(this._editorContextManager);
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
        
        this.logService.trace(`[EditorWidget] Reading file '${basename(URI.toString(model.source))}'`);
        
        this._model = model;
        this._viewModel = this.instantiationService.createInstance(
            EditorViewModel, 
            model, 
            this._extensionManager.getExtensions(), 
            this._options,
        );
        this._view = this.instantiationService.createInstance(
            EditorView, 
            this._container.element, 
            this._viewModel, 
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

        this.configurationService.set('editor', option);
    }

    private __registerMVVMListeners(model: IEditorModel, viewModel: IEditorViewModel, view: IEditorView): IDisposable {
        const disposables = new DisposableManager();

        // log out all the messages from MVVM
        disposables.register(Event.any([model.onLog, viewModel.onLog, view.onLog])((event) => {
            defaultLog(this.logService, event.level, event.data);
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
    ) {}

    public dispose(): void {
        this.listeners.dispose();
        this.model.dispose();
        this.viewModel.dispose();
        this.view.dispose();
    }
}

/**
 * @internal
 * @class Use to manage all the editor-related extensions lifecycle.
 */
class EditorExtensionManager implements IDisposable {

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
                const extension = instantiationService.createInstance(ctor, editorWidget);
                this._extensions.set(ID, extension);
            } catch (err) {
                ErrorHandler.onUnexpectedError(err);
            }
        }
    }

    // [public methods]

    public getExtensions(): IEditorExtension[] {
        const extensions: IEditorExtension[] = [];
        for (const [id, extension] of this._extensions) {
            extensions.push(extension);
        }
        return extensions;
    }

    public dispose(): void {
        for (const extension of this._extensions.values()) {
            extension.dispose();
        }
        this._extensions.clear();
    }
}

class EditorContextManager extends Disposable {

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

        this.__registerListeners();
    }

    // [private helper methods]

    private __registerListeners(): void {
        this.__register(this.editor.onDidFocusChange(isFocused => this.focusedEditor.set(isFocused)));
        this.__register(this.editor.onDidRenderModeChange(mode => this.editorRenderMode.set(mode)));
    }
}