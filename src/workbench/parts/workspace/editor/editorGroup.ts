import 'src/workbench/parts/workspace/editor/media/editorGroup.scss';
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { EditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";
import { IEditorPaneRegistrant } from "src/workbench/services/editorPane/editorPaneRegistrant";
import { IEditorPaneView } from "src/workbench/services/editorPane/editorPaneView";
import { EditorTabView } from 'src/workbench/parts/workspace/tabBar/editorTabView';
import { Disposable } from 'src/base/common/dispose';
import { EditorPaneCollection } from 'src/workbench/parts/workspace/editor/editorPane';
import { ErrorHandler } from 'src/base/common/error';

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

    private readonly _editorTabs: EditorTabView;
    private readonly _editorPane: EditorPaneCollection;
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
        
        // entire container
        this._container = document.createElement('div');
        this._container.className = 'editor-group-view-container';
        
        // editor tab view
        this._tabContainer = document.createElement('div');
        this._tabContainer.className = 'editor-tab-view-container';
        this._editorTabs = this.instantiationService.createInstance(EditorTabView, this._tabContainer);
        this._container.appendChild(this._tabContainer);

        // editor pane view
        this._currEditor = undefined;
        this._editorContainer = document.createElement('div');
        this._editorContainer.className = 'editor-pane-view-container';
        this._editorPane = this.instantiationService.createInstance(EditorPaneCollection, this._editorContainer);
        this._container.appendChild(this._editorContainer);
        
        parent.appendChild(this._container);
    }

    // [public methods]

    public override dispose(): void {
        this._editorTabs?.dispose();
        this._currEditor?.dispose();
        this._container.remove();
        super.dispose();
    }

    public async openEditor(model: EditorPaneModel): Promise<void> {
        /**
         * We open the editor first and open tab after only if it succeed. 
         * Avoiding potential data misplacement.
         */
        return this._editorPane.openEditor(model)
        .match(
            async () => {
                this._editorTabs.openEditor(model);
            },
            async err => {
                ErrorHandler.onUnexpectedError(err);
            }
        );
    }

    // [private methods]

}