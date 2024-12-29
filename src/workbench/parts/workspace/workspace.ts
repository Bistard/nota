import 'src/workbench/parts/workspace/workspace.scss';
import { Component, IAssembleComponentOpts } from "src/workbench/services/component/component";
import { ITabBarService, TabBarView } from "src/workbench/parts/workspace/tabBar/tabBar";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { Orientation } from 'src/base/browser/basic/dom';
import { IWorkspaceService } from 'src/workbench/parts/workspace/workspaceService';
import { EditorPaneModel } from 'src/workbench/services/editorPane/editorPaneModel';
import { IRegistrantService } from 'src/platform/registrant/common/registrantService';
import { IEditorPaneRegistrant } from 'src/workbench/services/editorPane/editorPaneRegistrant';
import { RegistrantType } from 'src/platform/registrant/common/registrant';
import { ErrorHandler } from 'src/base/common/error';
import { Result } from 'src/base/common/result';
import { IEditorPaneView } from 'src/workbench/services/editorPane/editorPaneView';

export class Workspace extends Component implements IWorkspaceService {

    declare _serviceMarker: undefined;

    // [field]

    private readonly _editorPaneRegistrant: IEditorPaneRegistrant;

    private _currEditor: IEditorPaneView | undefined;

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        @ITabBarService private readonly tabBarService: ITabBarService,
        @IEditorService private readonly editorService: IEditorService,
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        super('workspace', null, instantiationService);
        this._editorPaneRegistrant = registrantService.getRegistrant(RegistrantType.EditorPane);
        this._currEditor = undefined;
    }

    public override dispose(): void {
        this._currEditor?.dispose();
        super.dispose();
    }

    // [protected override methods]

    protected override _createContent(): void {
        this.__assembleParts();
    }

    protected override _registerListeners(): void { 
        /** noop */ 
    }

    // [public methods]

    public async openEditor(model: EditorPaneModel): Promise<void> {
        const matchedCtor = this._editorPaneRegistrant.getMatchEditor(model);
        
        /**
         * Case 1: Cannot find any registered matched panes that can handle this 
         * model properly, we treat as unexpected error.
         */
        if (!matchedCtor) {
            ErrorHandler.onUnexpectedError(new Error(`[Workspace] Cannot open editor with given editor pane model: ${model.getInfoString()}`));
            return;
        }

        /**
         * Case 2: The current editor is capable opening the new model, we open 
         * it in the current editor.
         */
        if (this._currEditor && this._currEditor instanceof matchedCtor) {
            const rerender = this._currEditor.setModel(model);
            if (rerender) {
                await this._currEditor.onRerender(this.editorService.element);
                return;
            }
        }
        
        /**
         * Case 3: First initiated or the current editor does not match, we 
         * construct the matched one.
         */
        Result.fromThrowable(
            () => this.instantiationService.createInstance(matchedCtor)
        )
        .map(newEditor => {
            newEditor.setModel(model); // bind the model ASAP
            newEditor.onInitialize();
            newEditor.onRender(this.editorService.element);

            // dispose the old one
            if (this._currEditor) {
                this._currEditor.dispose();
            }

            // replace with the new one
            this._currEditor = newEditor;
        })
        .match(
            () => {},
            err => ErrorHandler.onUnexpectedError(err)
        );
    }
    
    // [private helper methods]

    private __assembleParts(): void {
        const layout: IAssembleComponentOpts[] = [];
        layout.push({
            component: this.tabBarService,
            fixed: true,
            fixedSize: TabBarView.TAB_BAR_HEIGHT,
        });

        layout.push({
            component: this.editorService,
            initSize: null,
            maximumSize: null,
            minimumSize: null,
        });

        this.assembleComponents(Orientation.Vertical, layout);
    }
}