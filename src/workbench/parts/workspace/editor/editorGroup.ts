import 'src/workbench/parts/workspace/editor/media/editorGroup.scss';
import { ErrorHandler } from "src/base/common/error";
import { Result } from "src/base/common/result";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { EditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";
import { IEditorPaneRegistrant } from "src/workbench/services/editorPane/editorPaneRegistrant";
import { IEditorPaneView } from "src/workbench/services/editorPane/editorPaneView";
import { EditorTabView } from 'src/workbench/parts/workspace/tabBar/editorTabView';
import { Disposable } from 'src/base/common/dispose';

/**
 * An interface only for {@link EditorGroupView}.
 */
export interface IEditorGroupView extends Disposable {

    openEditor(model: EditorPaneModel): Promise<void>;
}

/**
 * Construction options for {@link EditorGroupView}.
 */
export interface IEditorGroupViewOptions {
    readonly editorToOpen: EditorPaneModel[];
    readonly mostRecentUsed: number;
}

/**
 * {@link EditorGroupView}
 * 
 * @description The editor group view consists of a tab view and an editor pane 
 * view where the content of the selected editor is rendered.
 * 
 * Structure:
 *       +=======================================+   <--\
 *       |               Tab View                |      |
 *       +=======================================+      |
 *       |                                       |      |
 *       |                                       |      | Editor Group View
 *       |           Editor Pane View            |      |
 *       |                                       |      |
 *       |                                       |      |
 *       +=======================================+   <--/
 */
export class EditorGroupView extends Disposable implements IEditorGroupView {

    // [fields]

    private readonly _registrant: IEditorPaneRegistrant;

    private readonly _container: HTMLElement;
    private readonly _tabContainer: HTMLElement;
    private readonly _editorContainer: HTMLElement;

    private readonly _tabView: EditorTabView;
    private _currEditor: IEditorPaneView | undefined; // todo: should not be undefined, use dashboard as default one.

    // [constructor]

    constructor(
        parent: HTMLElement,
        options: IEditorGroupViewOptions,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        super();
        this._registrant = registrantService.getRegistrant(RegistrantType.EditorPane);
        
        this._tabContainer = document.createElement('div');
        this._tabContainer.className = 'editor-tab-view-container';

        this._currEditor = undefined;
        this._editorContainer = document.createElement('div');
        this._editorContainer.className = 'editor-pane-view-container';

        // entire container
        this._container = document.createElement('div');
        this._container.className = 'editor-group-view-container';
        
        // editor tab view
        this._tabView = this.instantiationService.createInstance(EditorTabView, this._tabContainer);
        this._container.appendChild(this._tabContainer);

        // editor pane view
        // TODO: init editorPaneView based on options
        this._container.appendChild(this._editorContainer);
        
        parent.appendChild(this._container);
    }

    // [public methods]

    public override dispose(): void {
        this._tabView?.dispose();
        this._currEditor?.dispose();
        this._container.remove();
        super.dispose();
    }

    public async openEditor(model: EditorPaneModel): Promise<void> {
        const container = this._editorContainer;
        const matchedCtor = this._registrant.getMatchEditor(model);
        
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
                await this._currEditor.onRerender(container);
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
            newEditor.onRender(container);

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

    // [private methods]

}