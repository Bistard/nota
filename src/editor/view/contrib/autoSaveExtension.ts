import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Time } from "src/base/common/date";
import { ILogService } from "src/base/common/logger";
import { UnbufferedScheduler } from "src/base/common/utilities/async";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { INotificationService } from "src/workbench/services/notification/notificationService";
import { WorkbenchConfiguration } from "src/workbench/services/workbench/configuration.register";

interface IEditorAutoSaveExtension extends IEditorExtension {
	
    /**
     * If auto save is enabled.
     */
    readonly autoSave: boolean;

    /**
     * The auto save delay time.
     */
    readonly autoSaveDelay: Time;

    /**
     * When editor is lost focus, file is saved immediately.
     */
    readonly autoSaveOnLoseFocus: boolean;
}

export class EditorAutoSaveExtension extends EditorExtension implements IEditorAutoSaveExtension {

    // [fields]

    public override readonly id = EditorExtensionIDs.AutoSave;

    private _autoSave = false;
    private _autoSaveOnLoseFocus = false;
    private _autoSaveDelay = Time.sec(1);
    
    private _scheduler: UnbufferedScheduler<void>;
    private _editorWidget: IEditorWidget;

    // [constructor]

    constructor(
        editorWidget: IEditorWidget,
        @ILogService logService: ILogService,
        @INotificationService private readonly notificationService: INotificationService,
        @IConfigurationService private readonly configurationService: IConfigurationService
    ) {
        super(editorWidget, logService);
        this._editorWidget = editorWidget;
        this._scheduler = this.__register(new UnbufferedScheduler(this._autoSaveDelay, () => {
            this.__saveEditorContent();
        }));

        this._autoSave = this.configurationService.get<boolean>(WorkbenchConfiguration.EditorAutoSave);
        // TODO: config init

        this.__registerConfigurationListener();
        this.__registerEditorStateListener();
        this.__registerLoseFocusListener();
    }

    // [getter]

    get autoSave(): boolean { return this._autoSave; }
    get autoSaveDelay(): Time { return this._autoSaveDelay; }
    get autoSaveOnLoseFocus(): boolean { return this._autoSaveOnLoseFocus; }

    // [protected methods]

    protected override onViewStateInit(state: EditorState): void {}

    protected override onViewInit(view: EditorView): void {}

    protected override onViewDestroy(view: EditorView): void {
        super.dispose();
    }

    // [private methods]

    private __registerConfigurationListener(): void {

        // autoSave: true -> false

        this.__register(this.configurationService.onDidConfigurationChange(e => {
            if (e.affect(WorkbenchConfiguration.EditorAutoSave)) {
                this._autoSave = this.configurationService.get<boolean>(WorkbenchConfiguration.EditorAutoSave);
            }
            // TODO: configuration sync
        }));
    }

    private __registerEditorStateListener(): void {
        this.__register(this._editorWidget.onDidStateChange(() => {
            if (this._autoSave) {
                this._scheduler.schedule();
            }
        }));
    }

    private __registerLoseFocusListener(): void {
        this.__register(this._editorWidget.onDidFocusChange(focused => {
            if (!focused && this._autoSaveOnLoseFocus) {
                this._scheduler.cancel();
                this.__saveEditorContent();
            }
        }));
    }

    private async __saveEditorContent(): Promise<void> {
        this._editorWidget.save().match<void>(
            () => {},
            (error) => this.notificationService.error(
                `Failed to save file: ${error.message}`,
                {
                    actions: [
                        { label: 'Close', run: 'noop' },
                        { label: 'Retry', run: () => this._scheduler.schedule() }
                    ]
                }
            )
        );
    }
}