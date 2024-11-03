import { FastElement } from "src/base/browser/basic/fastElement";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { Register, RelayEmitter } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { Constructor, isDefined } from "src/base/common/utilities/type";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { IEditorModel } from "src/editor/common/model";
import { EditorType, IEditorView } from "src/editor/common/view";
import { BasicEditorOption, EDITOR_OPTIONS_DEFAULT, EditorOptionsType, IEditorWidgetOptions, toJsonEditorOption } from "src/editor/common/editorConfiguration";
import { EditorModel } from "src/editor/model/editorModel";
import { EditorView } from "src/editor/view/editorView";
import { IContextService } from "src/platform/context/common/contextService";
import { IContextKey } from "src/platform/context/common/contextKey";
import { ConfigurationModuleType, IConfigurationService } from "src/platform/configuration/common/configuration";
import { IOnBeforeRenderEvent, IOnClickEvent, IOnDidClickEvent, IOnDidContentChangeEvent, IOnDidDoubleClickEvent, IOnDidRenderEvent, IOnDidSelectionChangeEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnKeydownEvent, IOnKeypressEvent, IOnPasteEvent, IOnRenderEvent, IOnTextInputEvent, IOnTripleClickEvent, IProseEventBroadcaster } from "src/editor/view/viewPart/editor/adapter/proseEventBroadcaster";
import { EditorExtension } from "src/editor/common/editorExtension";
import { assert } from "src/base/common/utilities/panic";
import { AsyncResult } from "src/base/common/result";

/**
 * An interface only for {@link EditorWidget}.
 */
export interface IEditorWidget extends 
    IProseEventBroadcaster, 
    Pick<IEditorModel, 
        'source' 
        | 'dirty'
        | 'onDidStateChange' 
        | 'onDidDirtyChange'
        | 'onDidSave'
        | 'onDidSaveError'
        | 'save' 
        | 'insertAt' 
        | 'deleteAt'>
{

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

    /**
     * @description Get an extension of this editor.
     * @param id The unique identifier of the extension.
     */
    getExtension<T extends EditorExtension>(id: string): T | undefined;
}

/**
 * @class // TODO
 */
export class EditorWidget extends Disposable implements IEditorWidget {

    // #region [fields]

    /**
     * The HTML container of the entire editor.
     */
    private readonly _container: FastElement<HTMLElement>;
    
    // MVVM
    private _model: EditorModel | null;
    private _view: EditorView | null;
    private _editorData: EditorData | null;

    /**
     * Responsible for constructing a list of editor extensions
     */
    private readonly _extensions: EditorExtensionController;

    /**
     * Responsible for initializing and managing the editor options.
     */
    private readonly _options: EditorOptionController;

    // #region [model events]

    private readonly _onDidStateChange = this.__register(new RelayEmitter<void>());
    public readonly onDidStateChange = this._onDidStateChange.registerListener;

    private readonly _onDidDirtyChange = this.__register(new RelayEmitter<boolean>());
    public readonly onDidDirtyChange = this._onDidDirtyChange.registerListener;

    private readonly _onDidSave = this.__register(new RelayEmitter<void>());
    public readonly onDidSave = this._onDidSave.registerListener;
    
    private readonly _onDidSaveError = this.__register(new RelayEmitter<unknown>());
    public readonly onDidSaveError = this._onDidSaveError.registerListener;

    // #region [view events]

    private readonly _onDidFocusChange = this.__register(new RelayEmitter<boolean>());
    public readonly onDidFocusChange = this._onDidFocusChange.registerListener;

    private readonly _onDidRenderModeChange = this.__register(new RelayEmitter<EditorType>());
    public readonly onDidRenderModeChange = this._onDidRenderModeChange.registerListener;

    private readonly _onBeforeRender = this.__register(new RelayEmitter<IOnBeforeRenderEvent>());
    public readonly onBeforeRender = this._onBeforeRender.registerListener;

    private readonly _onRender = this.__register(new RelayEmitter<IOnRenderEvent>());
    public readonly onRender = this._onRender.registerListener;
    
    private readonly _onDidRender = this.__register(new RelayEmitter<IOnDidRenderEvent>());
    public readonly onDidRender = this._onDidRender.registerListener;
    
    private readonly _onDidSelectionChange = this.__register(new RelayEmitter<IOnDidSelectionChangeEvent>());
    public readonly onDidSelectionChange = this._onDidSelectionChange.registerListener;
    
    private readonly _onDidContentChange = this.__register(new RelayEmitter<IOnDidContentChangeEvent>());
    public readonly onDidContentChange = this._onDidContentChange.registerListener;

    private readonly _onClick = this.__register(new RelayEmitter<IOnClickEvent>());
    public readonly onClick = this._onClick.registerListener;

    private readonly _onDidClick = this.__register(new RelayEmitter<IOnDidClickEvent>());
    public readonly onDidClick = this._onDidClick.registerListener;

    private readonly _onDoubleClick = this.__register(new RelayEmitter<IOnDoubleClickEvent>());
    public readonly onDoubleClick = this._onDoubleClick.registerListener;

    private readonly _onDidDoubleClick = this.__register(new RelayEmitter<IOnDidDoubleClickEvent>());
    public readonly onDidDoubleClick = this._onDidDoubleClick.registerListener;

    private readonly _onTripleClick = this.__register(new RelayEmitter<IOnTripleClickEvent>());
    public readonly onTripleClick = this._onTripleClick.registerListener;

    private readonly _onDidTripleClick = this.__register(new RelayEmitter<IOnDidTripleClickEvent>());
    public readonly onDidTripleClick = this._onDidTripleClick.registerListener;

    private readonly _onKeydown = this.__register(new RelayEmitter<IOnKeydownEvent>());
    public readonly onKeydown = this._onKeydown.registerListener;

    private readonly _onKeypress = this.__register(new RelayEmitter<IOnKeypressEvent>());
    public readonly onKeypress = this._onKeypress.registerListener;

    private readonly _onTextInput = this.__register(new RelayEmitter<IOnTextInputEvent>());
    public readonly onTextInput = this._onTextInput.registerListener;

    private readonly _onPaste = this.__register(new RelayEmitter<IOnPasteEvent>());
    public readonly onPaste = this._onPaste.registerListener;

    private readonly _onDrop = this.__register(new RelayEmitter<IOnDropEvent>());
    public readonly onDrop = this._onDrop.registerListener;

    // #region [constructor]

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
        this._view = null;
        this._editorData = null;

        this._options    = instantiationService.createInstance(EditorOptionController, options);
        const contextHub = instantiationService.createInstance(EditorContextHub, this);
        this._extensions = instantiationService.createInstance(EditorExtensionController, this, extensions);

        this.__registerListeners();
        this.__register(contextHub);
        this.__register(this._extensions);
    }

    // #region [getter]

    get model(): IEditorModel { return assert(this._model); }
    get view(): IEditorView { return assert(this._view); }

    get readonly(): boolean { return !this._options.getOptions().writable.value; }
    get renderMode(): EditorType | null { return null; } // TODO

    // #region [public methods]

    public async open(source: URI): Promise<void> {
        const currSource = this._model?.source;
        if (currSource && URI.equals(source, currSource)) {
            return;
        }

        this.__detachData();
        const extensionList = this._extensions.getExtensions();

        // model
        this._model = this.instantiationService.createInstance(EditorModel, source, this._options.getOptions());
        const initState = await this._model.build(extensionList).unwrap();

        // view
        this._view = this.instantiationService.createInstance(
            EditorView,
            this._container.raw,
            this._model,
            initState,
            extensionList,
            this._options.getOptions(),
        );

        // listeners
        this.__registerMVVMListeners(this._model, this._view);

        // cache data
        this._editorData = new EditorData(this._model, this._view, undefined);
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

    public getExtension<T extends EditorExtension>(id: string): T | undefined {
        return <T>this._extensions.getExtensionByID(id);
    }

    // #region [editor-model methods]

    get source(): URI { return this.__assertModel().source; }
    get dirty(): boolean { return assert(this._model).dirty; }

    public insertAt(textOffset: number, text: string): void {
        return this.__assertModel().insertAt(textOffset, text);
    }
    
    public deleteAt(textOffset: number, length: number): void {
        return this.__assertModel().deleteAt(textOffset, length);
    }

    // #region [private helper methods]

    private __detachData(): void {
        this._editorData?.dispose();
        this._model = null;
        this._view = null;
        this._editorData = null;
    }

    private __assertModel(): EditorModel {
        return assert(this._model, '[EditorWidget] EditorModel is not initialized.');
    }
    
    private __assertView(): EditorView {
        return assert(this._view, '[EditorWidget] EditorView is not initialized.');
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

    private __registerMVVMListeners(model: IEditorModel, view: IEditorView): void {

        // binding to the model
        this._onDidStateChange.setInput(model.onDidStateChange);
        this._onDidDirtyChange.setInput(model.onDidDirtyChange);
        this._onDidSave.setInput(model.onDidSave);
        this._onDidSaveError.setInput(model.onDidSaveError);

        // binding to the view
        this._onDidFocusChange.setInput(this.view.onDidFocusChange);
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
        this._onKeypress.setInput(this.view.onKeypress);
        this._onTextInput.setInput(this.view.onTextInput);
        this._onPaste.setInput(this.view.onPaste);
        this._onDrop.setInput(this.view.onDrop);

        // TODO: configuration auto update
    }
}

class EditorData implements IDisposable {

    constructor(
        public readonly model: IEditorModel,
        public readonly view: IEditorView,
        public readonly listeners?: IDisposable,
    ) { }

    public dispose(): void {
        this.listeners?.dispose();
        this.model.dispose();
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
        editorWidget: IEditorWidget,
        extensions: { id: string, ctor: Constructor<EditorExtension> }[],
        @IInstantiationService instantiationService: IInstantiationService,
        @ILogService logService: ILogService,
    ) {
        super();
        this._extensions = new Map();

        for (const { id, ctor} of extensions) {
            try {
                logService.trace('EditorWidget', `Editor extension constructing: ${id}`);
                const instance = instantiationService.createInstance(ctor, editorWidget);
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