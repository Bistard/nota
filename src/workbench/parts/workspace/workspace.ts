import 'src/workbench/parts/workspace/workspace.scss';
import { Component } from "src/workbench/services/component/component";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { IWorkspaceService } from 'src/workbench/parts/workspace/workspaceService';
import { EditorPaneModel } from 'src/workbench/services/editorPane/editorPaneModel';
import { EditorGroupView } from 'src/workbench/parts/workspace/editor/editorGroup';
import { assert } from 'src/base/common/utilities/panic';

export class Workspace extends Component implements IWorkspaceService {

    declare _serviceMarker: undefined;

    // [field]

    private _groupView?: EditorGroupView;

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        @IEditorService private readonly editorService: IEditorService,
    ) {
        super('workspace', null, instantiationService);
    }

    public override dispose(): void {
        super.dispose();
    }

    // [protected override methods]

    protected override _createContent(): void {
        this._groupView = this.instantiationService.createInstance(EditorGroupView, this.element.raw);
    }

    protected override _registerListeners(): void { 
        /** noop */ 
    }

    // [public methods]

    public async openEditor(model: EditorPaneModel): Promise<void> {
        const groupView = assert(this._groupView);
        await groupView.openEditor(model);
    }
    
    // [private helper methods]

    // private __assembleParts(): void {
    //     const layout: IAssembleComponentOpts[] = [];
    //     layout.push({
    //         component: this.tabBarService,
    //         fixed: true,
    //         fixedSize: TabBarView.TAB_BAR_HEIGHT,
    //     });

    //     layout.push({
    //         component: this.editorService,
    //         initSize: null,
    //         maximumSize: null,
    //         minimumSize: null,
    //     });

    //     this.assembleComponents(Orientation.Vertical, layout);
    // }
}