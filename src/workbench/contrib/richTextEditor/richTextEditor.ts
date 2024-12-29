import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { Throttler } from "src/base/common/utilities/async";
import { assert } from "src/base/common/utilities/panic";
import { EditorType } from "src/editor/common/view";
import { getBuiltInExtension } from "src/editor/contrib/builtInExtensionList";
import { EditorWidget, IEditorWidget } from "src/editor/editorWidget";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { TextEditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";
import { EditorPaneView } from "src/workbench/services/editorPane/editorPaneView";

export class RichTextEditor extends EditorPaneView<TextEditorPaneModel> {
    
    // [fields]

    private _editorWidget: IEditorWidget | undefined = undefined;

    /**
     * Stores editor open request. A throttler is needed to avoid excessive file
     * loading during a very short time.
     */
    private readonly _pendingRequest = new Throttler();

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
    ) {
        super('RichTextEditorPane');
    }

    // [public methods]

    public override onRender(parent: HTMLElement): void {
        // TODO: should read editor configuration
        // const options = <IEditorWidgetOptions>deepCopy(this.configurationService.get('editor', {}));

        this.logService.debug('EditorService', 'Constructing editor...');

        // editor construction
        const editor = this.instantiationService.createInstance(
            EditorWidget, 
            parent,
            getBuiltInExtension(),
            {
                mode: EditorType.Rich,
                writable: true,
                dropAnimation: true,
            },
        );
        this._editorWidget = editor;

        // actual render
        this.onRerender(parent);

        this.logService.debug('EditorService', 'Editor constructed.');
    }

    public override onRerender(parent: HTMLElement): void {
        const uri = this.model.resource;

        // queue an open request
        this._pendingRequest.queue(async () => {
            const editorWidget = assert(this._editorWidget);

            // do open
            this.logService.debug('EditorService', `Opening at: ${URI.toString(uri)}`);
            await editorWidget.open(uri);
            this.logService.debug('EditorService', `Open successfully at: ${URI.toString(uri)}`);

            return uri;
        });
    }
    
    public override shouldRerender(model: TextEditorPaneModel): boolean {
        // do not rerender on the same resource
        if (URI.equals(this.model.resource, model.resource)) {
            return false;
        }
        return true;
    }
    
    public override onInitialize(): void {
        // TODO
    }

    public override dispose(): void {
        this._editorWidget?.dispose();
        super.dispose();
    }
}