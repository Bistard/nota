import 'src/workbench/parts/workspace/workspace.scss';
import { Component } from "src/workbench/services/component/component";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IWorkspaceService, IUnknownModel } from 'src/workbench/parts/workspace/workspaceService';
import { EditorPaneModel, TextEditorPaneModel } from 'src/workbench/services/editorPane/editorPaneModel';
import { EditorGroupView } from 'src/workbench/parts/workspace/editorGroupView';
import { assert } from 'src/base/common/utilities/panic';
import { IEditorGroupOpenOptions } from 'src/workbench/parts/workspace/editorGroupModel';
import { ICommandService } from 'src/platform/command/common/commandService';
import { AllCommands } from 'src/workbench/services/workbench/commandList';
import { isString } from 'src/base/common/utilities/type';
import { URI } from 'src/base/common/files/uri';
import { IFileService } from 'src/platform/files/common/fileService';
import { detectEncodingFromFile } from 'src/base/common/files/encoding';
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from 'src/platform/lifecycle/browser/browserLifecycleService';
import { ensureLoadKaTeXCssStyles } from 'src/workbench/contrib/richTextEditor/richTextEditor';
import { Emitter } from 'src/base/common/event';

export class Workspace extends Component implements IWorkspaceService {

    declare _serviceMarker: undefined;

    // [event]

    private readonly _onDidOpen = this.__register(new Emitter<EditorPaneModel | null>());
    public readonly onDidOpen = this._onDidOpen.registerListener;

    // [field]

    private _groupView?: EditorGroupView;
    private _currentOpenedEditor: null | URI;

    // [constructor]

    constructor(
        @ICommandService private readonly commandService: ICommandService,
        @IInstantiationService instantiationService: IInstantiationService,
        @IFileService private readonly fileService: IFileService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
    ) {
        super('workspace', null, instantiationService);
        this._currentOpenedEditor = null;
    }

    // [public]

    public getCurrentEditor(): URI | null {
        return this._currentOpenedEditor;
    }

    public override dispose(): void {
        super.dispose();
    }

    // [protected override methods]

    protected override __createContent(): void {
        this._groupView = this.__register(this.instantiationService.createInstance(
            EditorGroupView, 
            this.element.raw,
            {
                editorToOpen: [],
                mostRecentUsed: 0,
            }
        ));
    }

    protected override __registerListeners(): void { 
        this.lifecycleService.when(LifecyclePhase.Idle).then(() => {
            /**
             * Optimization: If KaTeX style never loaded, we load it when in 
             * Idle phase.
             */
            ensureLoadKaTeXCssStyles(this.logService);
        });
    }

    // [public methods]

    public async openEditor(model: EditorPaneModel, options: IEditorGroupOpenOptions): Promise<void>;
    public async openEditor(unknown: IUnknownModel, options: IEditorGroupOpenOptions): Promise<void>;
    public async openEditor(modelOrUnknown: EditorPaneModel | IUnknownModel, options: IEditorGroupOpenOptions): Promise<void> {
        let resolved: EditorPaneModel | string;
        
        // unknown URI, we try to analyze it.
        if (!(modelOrUnknown instanceof EditorPaneModel)) {
            resolved = await this.__resolveUnknownModel(modelOrUnknown);
        } else {
            resolved = modelOrUnknown;
        }

        // unresolved, error string detected.
        if (isString(resolved)) {
            this.commandService.executeCommand(AllCommands.alertError, 'workspace', new Error(`Failed to Open: ${resolved}`));
            return;
        }

        // resolved model, we open it in groups.
        const groupView = assert(this._groupView);
        await groupView.openEditor(resolved, options);

        // let the client knows
        this._currentOpenedEditor = resolved.resource ?? null;
        this._onDidOpen.fire(resolved);
    }
    
    // [private helper methods]

    private async __resolveUnknownModel(unknown: IUnknownModel): Promise<EditorPaneModel | string> {
        const uri = unknown.uri;

        const result = await detectEncodingFromFile(this.fileService, uri);
        if (result.seemsBinary) {
            return `Cannot open binary file: ${URI.basename(uri)}`;
        }

        // FIX: once supporting detect `utf-8`, we need to check it here.
        return new TextEditorPaneModel(uri);
        // return `Cannot resolve unknown model: ${URI.basename(uri)}`;
    }
}
