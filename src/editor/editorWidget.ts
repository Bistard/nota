import { FastElement } from "src/base/browser/basic/fastElement";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { Register, RelayEmitter } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { Constructor, isDefined } from "src/base/common/utilities/type";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { IEditorModel, IModelBuildData } from "src/editor/common/model";
import { EditorType, IEditorView } from "src/editor/common/view";
import { BasicEditorOption, EDITOR_OPTIONS_DEFAULT, EditorOptionsType, IEditorWidgetOptions, toJsonEditorOption } from "src/editor/common/editorConfiguration";
import { EditorModel } from "src/editor/model/editorModel";
import { EditorView } from "src/editor/view/editorView";
import { IContextService } from "src/platform/context/common/contextService";
import { IContextKey } from "src/platform/context/common/contextKey";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IEditorDragEvent, IEditorMouseEvent, IOnBeforeRenderEvent, IOnClickEvent, IOnDidClickEvent, IOnDidContentChangeEvent, IOnDidDoubleClickEvent, IOnDidRenderEvent, IOnDidSelectionChangeEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnFocusEvent, IOnKeydownEvent, IOnPasteEvent, IOnRenderEvent, IOnTextInputEvent, IOnTripleClickEvent, IProseEventBroadcaster } from "src/editor/view/proseEventBroadcaster";
import { EditorExtension } from "src/editor/common/editorExtension";
import { assert, errorToMessage } from "src/base/common/utilities/panic";
import { AsyncResult, err, ok, Result } from "src/base/common/result";
import { EditorDragState } from "src/editor/common/cursorDrop";
import { EditorViewModel } from "src/editor/viewModel/editorViewModel";
import { IEditorViewModel, IViewModelBuildData } from "src/editor/common/viewModel";
import { IEditorInputEmulator } from "src/editor/view/inputEmulator";

// region - [interface]

/**
 * An interface only for {@link EditorWidget}.
 */
export interface IEditorWidget extends 
    IProseEventBroadcaster, 
    Pick<IEditorModel, 
        | 'source'
        | 'dirty'
        | 'onDidDirtyChange'
        | 'onDidSave'
        | 'onDidSaveError'
        | 'save'
    >,
    Pick<IEditorView,
        | 'type'
    >
{
    /**
     * Is the editor initialized. if not, access to model, viewModel and view 
     * will panic.
     */
    readonly initialized: boolean;

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
     * @panic If the editor is not intialized.
     */
    readonly model: IEditorModel;

    /**
     * Returns the view model.
     * @panic If the editor is not intialized.
     */
    readonly viewModel: IEditorViewModel;

    /**
     * Returns the view.
     * @panic If the editor is not intialized.
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
    open(source: URI): Promise<Result<void, Error>>;

    /**
     * @description If the editor is opened. If this returns true, it is safe to
     * invoke {@link model}/{@link viewModel}/{@link view} without panic.
     */
    isOpened(): boolean;

    /**
     * @description Updates the options of the editor widget.
     * @param options The option.
     */
    updateOptions(options: Partial<IEditorWidgetOptions>): void;

    /**
     * @description Returns the editor option. The value of each configuration
     * is auto updated.
     */
    getOptions(): EditorOptionsType;

    /**
     * @description Get an extension of this editor.
     * @param id The unique identifier of the extension.
     */
    getExtension<T extends EditorExtension>(id: string): T | undefined;
    
    getContextKey<T>(name: string): IContextKey<T> | undefined;
    updateContext(name: string, value: any): boolean;

    /**
     * @description Let the world ends. Destroy EVERYTHING.
     * @note same as {@link dispose()}.
     */
    destroy(): void;
}

/**
 * @class // TODO
 */
export class EditorWidget extends Disposable implements IEditorWidget {

    // region - [fields]

    /**
     * The HTML container of the entire editor.
     */
    private readonly _container: FastElement<HTMLElement>;
    
    // MVVM
    private _model: EditorModel | null;
    private _viewModel: EditorViewModel | null;
    private _view: EditorView | null;
    private _editorData: EditorData | null;

    /**
     * Responsible for managing the context key of the editor.
     */
    private readonly _contextHub: EditorContextController;

    /**
     * Responsible for constructing a list of editor extensions.
     */
    private readonly _extensions: EditorExtensionController;

    /**
     * Responsible for initializing and managing the editor options.
     */
    private readonly _options: EditorOptionController;

    // region - [model events]

    private readonly _onDidDirtyChange = this.__register(RelayEmitter.createPriority<boolean>());
    public readonly onDidDirtyChange = this._onDidDirtyChange.registerListener;

    private readonly _onDidSave = this.__register(RelayEmitter.createPriority<void>());
    public readonly onDidSave = this._onDidSave.registerListener;
    
    private readonly _onDidSaveError = this.__register(RelayEmitter.createPriority<unknown>());
    public readonly onDidSaveError = this._onDidSaveError.registerListener;

    // region - [view events]

    private readonly _onDidBlur = this.__register(RelayEmitter.createPriority<IOnFocusEvent>());
    public readonly onDidBlur = this._onDidBlur.registerListener;
    
    private readonly _onDidFocus = this.__register(RelayEmitter.createPriority<IOnFocusEvent>());
    public readonly onDidFocus = this._onDidFocus.registerListener;

    private readonly _onDidRenderModeChange = this.__register(RelayEmitter.createPriority<EditorType>());
    public readonly onDidRenderModeChange = this._onDidRenderModeChange.registerListener;

    private readonly _onBeforeRender = this.__register(RelayEmitter.createPriority<IOnBeforeRenderEvent>());
    public readonly onBeforeRender = this._onBeforeRender.registerListener;

    private readonly _onRender = this.__register(RelayEmitter.createPriority<IOnRenderEvent>());
    public readonly onRender = this._onRender.registerListener;
    
    private readonly _onDidRender = this.__register(RelayEmitter.createPriority<IOnDidRenderEvent>());
    public readonly onDidRender = this._onDidRender.registerListener;
    
    private readonly _onDidSelectionChange = this.__register(RelayEmitter.createPriority<IOnDidSelectionChangeEvent>());
    public readonly onDidSelectionChange = this._onDidSelectionChange.registerListener;
    
    private readonly _onDidContentChange = this.__register(RelayEmitter.createPriority<IOnDidContentChangeEvent>());
    public readonly onDidContentChange = this._onDidContentChange.registerListener;

    private readonly _onClick = this.__register(RelayEmitter.createPriority<IOnClickEvent>());
    public readonly onClick = this._onClick.registerListener;

    private readonly _onDidClick = this.__register(RelayEmitter.createPriority<IOnDidClickEvent>());
    public readonly onDidClick = this._onDidClick.registerListener;

    private readonly _onDoubleClick = this.__register(RelayEmitter.createPriority<IOnDoubleClickEvent>());
    public readonly onDoubleClick = this._onDoubleClick.registerListener;

    private readonly _onDidDoubleClick = this.__register(RelayEmitter.createPriority<IOnDidDoubleClickEvent>());
    public readonly onDidDoubleClick = this._onDidDoubleClick.registerListener;

    private readonly _onTripleClick = this.__register(RelayEmitter.createPriority<IOnTripleClickEvent>());
    public readonly onTripleClick = this._onTripleClick.registerListener;

    private readonly _onDidTripleClick = this.__register(RelayEmitter.createPriority<IOnDidTripleClickEvent>());
    public readonly onDidTripleClick = this._onDidTripleClick.registerListener;

    private readonly _onKeydown = this.__register(RelayEmitter.createPriority<IOnKeydownEvent>());
    public readonly onKeydown = this._onKeydown.registerListener;

    private readonly _onTextInput = this.__register(RelayEmitter.createPriority<IOnTextInputEvent>());
    public readonly onTextInput = this._onTextInput.registerListener;
    
    private readonly _onCompositionStart = this.__register(RelayEmitter.createPriority<CompositionEvent>());
    public readonly onCompositionStart = this._onCompositionStart.registerListener;
    
    private readonly _onCompositionEnd = this.__register(RelayEmitter.createPriority<CompositionEvent>());
    public readonly onCompositionEnd = this._onCompositionEnd.registerListener;


    private readonly _onMouseOver = this.__register(RelayEmitter.createPriority<IEditorMouseEvent>());
    public readonly onMouseOver = this._onMouseOver.registerListener;
    
    private readonly _onMouseOut = this.__register(RelayEmitter.createPriority<IEditorMouseEvent>());
    public readonly onMouseOut = this._onMouseOut.registerListener;
    
    private readonly _onMouseEnter = this.__register(RelayEmitter.createPriority<IEditorMouseEvent>());
    public readonly onMouseEnter = this._onMouseEnter.registerListener;
    
    private readonly _onMouseLeave = this.__register(RelayEmitter.createPriority<IEditorMouseEvent>());
    public readonly onMouseLeave = this._onMouseLeave.registerListener;
    
    private readonly _onMouseDown = this.__register(RelayEmitter.createPriority<IEditorMouseEvent>());
    public readonly onMouseDown = this._onMouseDown.registerListener;
    
    private readonly _onMouseUp = this.__register(RelayEmitter.createPriority<IEditorMouseEvent>());
    public readonly onMouseUp = this._onMouseUp.registerListener;
    
    private readonly _onMouseMove = this.__register(RelayEmitter.createPriority<IEditorMouseEvent>());
    public readonly onMouseMove = this._onMouseMove.registerListener;
    
    private readonly _onPaste = this.__register(RelayEmitter.createPriority<IOnPasteEvent>());
    public readonly onPaste = this._onPaste.registerListener;

    private readonly _onDrop = this.__register(RelayEmitter.createPriority<IOnDropEvent>());
    public readonly onDrop = this._onDrop.registerListener;
    
    private readonly _onDropOverlay = this.__register(RelayEmitter.createPriority<IEditorDragEvent>());
    public readonly onDropOverlay = this._onDropOverlay.registerListener;
    
    private readonly _onDrag = this.__register(RelayEmitter.createPriority<IEditorDragEvent>());
    public readonly onDrag = this._onDrag.registerListener;
    
    private readonly _onDragStart = this.__register(RelayEmitter.createPriority<IEditorDragEvent>());
    public readonly onDragStart = this._onDragStart.registerListener;
    
    private readonly _onDragEnd = this.__register(RelayEmitter.createPriority<IEditorDragEvent>());
    public readonly onDragEnd = this._onDragEnd.registerListener;
    
    private readonly _onDragOver = this.__register(RelayEmitter.createPriority<IEditorDragEvent>());
    public readonly onDragOver = this._onDragOver.registerListener;
    
    private readonly _onDragEnter = this.__register(RelayEmitter.createPriority<IEditorDragEvent>());
    public readonly onDragEnter = this._onDragEnter.registerListener;
    
    private readonly _onDragLeave = this.__register(RelayEmitter.createPriority<IEditorDragEvent>());
    public readonly onDragLeave = this._onDragLeave.registerListener;
    
    private readonly _onWheel = this.__register(RelayEmitter.createPriority<WheelEvent>());
    public readonly onWheel = this._onWheel.registerListener;

    // region - [constructor]

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

        this._container = this.__register(new FastElement(container));
        this._model = null;
        this._viewModel = null;
        this._view = null;
        this._editorData = null;

        this._options    = instantiationService.createInstance(EditorOptionController, options);
        this._contextHub = instantiationService.createInstance(EditorContextController, this);
        this._extensions = instantiationService.createInstance(EditorExtensionController, this, extensions);

        this.__registerListeners();
        this.__register(this._contextHub);
        this.__register(this._extensions);
    }

    // region - [getter]

    get initialized(): boolean { return !!this._model; }

    get model(): IEditorModel { return this.__assertModel(); }
    get viewModel(): IEditorViewModel { return assert(this._viewModel); }
    get view(): IEditorView { return assert(this._view); }

    get readonly(): boolean { return !this._options.getOptions().writable.value; }
    get renderMode(): EditorType | null { return null; } // TODO

    // region - [public]

    public async open(source: URI): Promise<Result<void, Error>> {
        // same source, do nothing.
        if (this._model?.source && URI.equals(source, this._model.source)) {
            return ok();
        }

        // cleanup first
        this.__detachData();

        // model
        return (await this.__createModel(source)).andThen(([model, modelData]) => {
            this._model = model;
            const extensions = this._extensions.getExtensions();

            // view-model
            this._viewModel = this.__createViewModel(extensions);
            const viewModelData = this._viewModel.build(modelData);

            // view
            this._view = this.__createView(extensions, viewModelData);

            // listeners
            this.__registerMVVMListeners(this._model, this._viewModel, this._view);

            // cache data
            this._editorData = this.__register(new EditorData(this._model, this._viewModel, this._view, undefined));
            return ok();
        });
    }

    public isOpened(): boolean {
        return !!this._model && !!this._viewModel && !!this._view;
    }

    public save(): AsyncResult<void, Error> {
        if (!this._model) {
            return AsyncResult.ok();
        }
        return this._model.save();
    }

    public override dispose(): void {
        super.dispose();
        this.__detachData();
        this._extensions.dispose();
        this.logService.debug('EditorWidget', 'Editor disposed.');
    }

    public updateOptions(newOption: Partial<IEditorWidgetOptions>): void {
        this._options.updateOptions(newOption);
    }

    public getOptions(): EditorOptionsType {
        return this._options.getOptions();
    }

    public getExtension<T extends EditorExtension>(id: string): T | undefined {
        return <T>this._extensions.getExtensionByID(id);
    }

    public getContextKey<T>(name: string): IContextKey<T> | undefined {
        return this._contextHub.getContextKey(name);
    }

    public updateContext(name: string, value: any): boolean {
        return this._contextHub.updateContext(name, value);
    }

    // region - [model]

    get source(): URI { return this.model.source; }
    get dirty(): boolean { return assert(this._model).dirty; }

    public destroy(): void {
        return this.dispose();
    }

    // region - [viewModel]
    


    // region - [View]

    public type(text: string, from?: number, to?: number): void {
        this.view.type(text, from, to);
    }

    // region - [private]

    private __detachData(): void {
        this.release(this._editorData);
        this._editorData = null;
        this._model = null;
        this._view = null;
    }

    private __assertModel(): EditorModel {
        return assert(this._model, '[EditorWidget] EditorModel is not initialized.');
    }
    
    private __assertViewModel(): EditorViewModel {
        return assert(this._viewModel, '[EditorWidget] EditorViewModel is not initialized.');
    }
    
    private __assertView(): EditorView {
        return assert(this._view, '[EditorWidget] EditorView is not initialized.');
    }

    private async __createModel(source: URI): Promise<Result<[EditorModel, IModelBuildData], Error>> {
        const model = this.instantiationService.createInstance(
            EditorModel, 
            source, 
            this._options.getOptions(),
        );
        const build = await model.build();

        // unexpected behavior, we need to let the user know.
        if (build.isErr()) {
            const error = new Error(`Cannot open editor at '${URI.toFsPath(source)}'. ${errorToMessage(build.unwrapErr(), false)}`);
            return err(error);
        }
        const modelData = build.unwrap();
        
        return ok([model, modelData]);
    }

    private __createViewModel(extensions: EditorExtension[]): EditorViewModel {
        return this.instantiationService.createInstance(
            EditorViewModel, 
            this.model,
            extensions,
        );
    }

    private __createView(extensions: EditorExtension[], viewModelData: IViewModelBuildData): EditorView {
        const inputEmulator: IEditorInputEmulator = {
            type: e => this._onTextInput.fire(e),
            keydown: e => this._onKeydown.fire(e),
        };
        
        return this.instantiationService.createInstance(
            EditorView,
            this._container.raw,
            this.viewModel,
            viewModelData.state,
            extensions,
            inputEmulator,
            this._options.getOptions(),
        );
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

    private __registerMVVMListeners(model: IEditorModel, viewModel: IEditorViewModel, view: IEditorView): void {

        // binding to the model
        this._onDidDirtyChange.setInput(model.onDidDirtyChange);
        this._onDidSave.setInput(model.onDidSave);
        this._onDidSaveError.setInput(model.onDidSaveError);

        // binding to the viewModel
        // TODO

        // binding to the view
        this._onDidBlur.setInput(this.view.onDidBlur);
        this._onDidFocus.setInput(this.view.onDidFocus);
        
        this._onBeforeRender.setInput(this.view.onBeforeRender);
        this._onRender.setInput(this.view.onRender);
        this._onDidRender.setInput(this.view.onDidRender);
        this._onDidSelectionChange.setInput(this.view.onDidSelectionChange);
        this._onDidContentChange.setInput(this.view.onDidContentChange);
        this._onClick.setInput(this.view.onClick);
        this._onDidClick.setInput(this.view.onDidClick);
        this._onDoubleClick.setInput(this.view.onDoubleClick);
        this._onDidDoubleClick.setInput(this.view.onDidDoubleClick);
        this._onTripleClick.setInput(this.view.onTripleClick);
        this._onDidTripleClick.setInput(this.view.onDidTripleClick);
        
        this._onKeydown.setInput(this.view.onKeydown);
        this._onTextInput.setInput(this.view.onTextInput);
        
        this._onCompositionStart.setInput(this.view.onCompositionStart);
        this._onCompositionEnd.setInput(this.view.onCompositionEnd);

        this._onMouseOver.setInput(this.view.onMouseOver);
        this._onMouseOut.setInput(this.view.onMouseOut);
        this._onMouseEnter.setInput(this.view.onMouseEnter);
        this._onMouseLeave.setInput(this.view.onMouseLeave);
        this._onMouseDown.setInput(this.view.onMouseDown);
        this._onMouseUp.setInput(this.view.onMouseUp);
        this._onMouseMove.setInput(this.view.onMouseMove);
        
        this._onPaste.setInput(this.view.onPaste);
        this._onDrop.setInput(this.view.onDrop);
        this._onDropOverlay.setInput(this.view.onDropOverlay);
        this._onDrag.setInput(this.view.onDrag);
        this._onDragStart.setInput(this.view.onDragStart);
        this._onDragEnd.setInput(this.view.onDragEnd);
        this._onDragOver.setInput(this.view.onDragOver);
        this._onDragEnter.setInput(this.view.onDragEnter);
        this._onDragLeave.setInput(this.view.onDragLeave);
        
        this._onWheel.setInput(this.view.onWheel);
        // TODO: configuration auto update
    }
}

// region - private

class EditorData extends Disposable {

    constructor(
        public readonly model: IEditorModel,
        public readonly viewModel: IEditorViewModel,
        public readonly view: IEditorView,
        public readonly listeners?: IDisposable,
    ) {
        super();
        this.__register(model);
        this.__register(viewModel);
        this.__register(view);
        if (listeners) {
            this.__register(listeners);
        }
    }
}

// region - EditorContextController

/**
 * @class Once the class is constructed, the {@link IContextKey} relates to 
 * editor will be self-updated.
 */
class EditorContextController extends Disposable {

    // [context]

    private readonly focusedEditor: IContextKey<boolean>;
    private readonly isEditorReadonly: IContextKey<boolean>;
    private readonly isEditorWritable: IContextKey<boolean>;
    private readonly editorRenderMode: IContextKey<EditorType | null>;
    private readonly editorDragState: IContextKey<EditorDragState>;

    // [constructor]

    constructor(
        private readonly editor: IEditorWidget,
        @IContextService contextService: IContextService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();

        this.focusedEditor = contextService.createContextKey('isEditorFocused', false, 'Whether the editor is focused.');
        this.isEditorReadonly = contextService.createContextKey('isEditorReadonly', editor.readonly, 'Whether the editor is currently readonly.');
        this.isEditorWritable = contextService.createContextKey('isEditorWritable', !editor.readonly, 'Whether the editor is currently writable.');
        this.editorRenderMode = contextService.createContextKey('editorRenderMode', editor.renderMode, 'The render mode of the editor.');
        this.editorDragState = contextService.createContextKey('editorDragState', EditorDragState.None, 'Indicates the current status of a drag action within the editor.');

        // Register auto update context listeners
        this.__registerListeners();
    }

    // [public methods]

    public getContextKey<T>(name: string): IContextKey<T> | undefined {
        return this[name];
    }

    public updateContext(name: string, value: any): boolean {
        const contextKey: IContextKey<unknown> | undefined = this[name];
        if (!contextKey) {
            return false;
        }

        if (contextKey.key !== name) {
            this.logService.warn('EditorWidget', `Cannot update context (incompatible name): '${name}' !== '${contextKey.key}'`);
            return false;
        }

        contextKey.set(value);
        return true;
    }

    // [private helper methods]

    private __registerListeners(): void {
        this.__register(this.editor.onDidFocus(() => this.focusedEditor.set(true)));
        this.__register(this.editor.onDidBlur(() => this.focusedEditor.set(false)));
        this.__register(this.editor.onDidRenderModeChange(mode => this.editorRenderMode.set(mode)));
    }
}

// region - EditorExtension

class EditorExtensionController extends Disposable {

    // [fields]

    private readonly _extensions: Map<string, EditorExtension>;

    // [constructor]

    constructor(
        editorWidget: IEditorWidget,
        extensions: { id: string, ctor: Constructor<EditorExtension> }[],
        @IInstantiationService instantiationService: IInstantiationService,
        @ILogService logService: ILogService,
    ) {
        super();
        this._extensions = new Map();

        for (const { id, ctor} of extensions) {
            try {
                const instance = this.__register(instantiationService.createInstance(ctor, editorWidget));
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

    public override dispose(): void {
        super.dispose();
        for (const ext of this._extensions.values()) {
            ext.dispose();
        }
    }
}

// region - EditorOption

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
        // TODO
    }

    // [private methods]

    private __initOptions(newOption: IEditorWidgetOptions): EditorOptionsType {
        const mixOptions = EDITOR_OPTIONS_DEFAULT;
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