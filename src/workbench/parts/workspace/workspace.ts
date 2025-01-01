import 'src/workbench/parts/workspace/workspace.scss';
import { Component } from "src/workbench/services/component/component";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IWorkspaceService } from 'src/workbench/parts/workspace/workspaceService';
import { EditorPaneModel } from 'src/workbench/services/editorPane/editorPaneModel';
import { EditorGroupView } from 'src/workbench/parts/workspace/editor/editorGroupView';
import { assert } from 'src/base/common/utilities/panic';
import { IEditorGroupOpenOptions } from 'src/workbench/parts/workspace/editor/editorGroupModel';

export class Workspace extends Component implements IWorkspaceService {

    declare _serviceMarker: undefined;

    // [field]

    private _groupView?: EditorGroupView;

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super('workspace', null, instantiationService);
    }

    public override dispose(): void {
        super.dispose();
    }

    // [protected override methods]

    protected override _createContent(): void {
        this._groupView = this.instantiationService.createInstance(
            EditorGroupView, 
            this.element.raw,
            {
                editorToOpen: [],
                mostRecentUsed: 0,
            }
        );
    }

    protected override _registerListeners(): void { 
        /** noop */ 
    }

    // [public methods]

    public async openEditor(model: EditorPaneModel, options: IEditorGroupOpenOptions): Promise<void> {
        const groupView = assert(this._groupView);
        await groupView.openEditor(model, options);
    }
    
    // [private helper methods]
}