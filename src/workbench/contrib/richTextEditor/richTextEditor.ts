import { tryOrDefault } from "src/base/common/error";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { Throttler } from "src/base/common/utilities/async";
import { assert } from "src/base/common/utilities/panic";
import { EditorType } from "src/editor/common/view";
import { getBuiltInExtension } from "src/editor/contrib/builtInExtensionList";
import { EditorWidget, IEditorWidget } from "src/editor/editorWidget";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { HeadingItemProvider, HeadingItemRenderer } from "src/workbench/contrib/outline/headingItemRenderer";
import { OutlineTree } from "src/workbench/contrib/outline/outlineTree";
import { TextEditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";
import { EditorPaneView } from "src/workbench/services/editorPane/editorPaneView";

export class RichTextEditor extends EditorPaneView<TextEditorPaneModel> {
    
    // [fields]

    private _editorWidget: IEditorWidget | undefined = undefined;
    private _outline?: OutlineTree;

    /**
     * Stores editor open request. A throttler is needed to avoid excessive file
     * loading during a very short time.
     */
    private readonly _pendingRequest = new Throttler();

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IInstantiationService instantiationService: IInstantiationService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
    ) {
        super(instantiationService);
    }

    // [getter]

    override get type(): string { return 'RichTextEditorPane'; }

    override get container(): HTMLElement | undefined {
        // FIX: should not be editor, but a new container that includes outline
        return tryOrDefault(undefined, () => this._editorWidget?.view.editor.container);
    }

    // [public methods]

    public override onModel(candidate: TextEditorPaneModel): boolean {
        return true;
    }

    public override onRender(parent: HTMLElement): void {
        // TODO: should read editor configuration
        // const options = <IEditorWidgetOptions>deepCopy(this.configurationService.get('editor', {}));

        // editor construction
        this._editorWidget = this.instantiationService.createInstance(
            EditorWidget, 
            parent,
            getBuiltInExtension(),
            {
                mode: EditorType.Rich,
                writable: true,
                dropAnimation: true,
            },
        );

        // outline construction
        this._outline = this.instantiationService.createInstance(
            OutlineTree,
            parent,
            [new HeadingItemRenderer()],
            new HeadingItemProvider(),
            { 
                transformOptimization: true,
                collapsedByDefault: false,
                identityProvider: {
                    getID: heading => heading.id.toString(),
                },
            },
        );

        this.registerAutoLayout();
        this.__register(this.onDidLayout(() => {
            this._outline?.layout();
        }));

        // actual render
        this.onUpdate(parent);
    }

    public override onUpdate(parent: HTMLElement): void {
        const uri = this.model.resource;

        // queue an open request
        this._pendingRequest.queue(async () => {
            const editorWidget = assert(this._editorWidget);
            const outline = assert(this._outline);

            // do open
            this.logService.debug('RichTextEditor', `Opening at: ${URI.toString(uri)}`);
            await editorWidget.open(uri);
            this.logService.debug('RichTextEditor', `Open successfully at: ${URI.toString(uri)}`);

            // outline rendering
            outline.render(editorWidget);

            return uri;
        });
    }
    
    public override shouldUpdate(model: TextEditorPaneModel): boolean {
        // do not rerender on the same resource
        if (URI.equals(this.model.resource, model.resource)) {
            return false;
        }
        return true;
    }

    public override onVisibility(visibility: boolean): void {
        // todo
    }

    public override dispose(): void {
        this._editorWidget?.dispose();
        this._outline?.dispose();
        super.dispose();
    }
}