import 'src/workbench/parts/workspace/editor/media/editorGroup.scss';
import { Widget } from "src/base/browser/basic/widget";
import { ErrorHandler } from "src/base/common/error";
import { Result } from "src/base/common/result";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { EditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";
import { IEditorPaneRegistrant } from "src/workbench/services/editorPane/editorPaneRegistrant";
import { IEditorPaneView } from "src/workbench/services/editorPane/editorPaneView";

/**
 * An interface only for {@link EditorGroupView}.
 */
export interface IEditorGroupView extends Widget {

    openEditor(model: EditorPaneModel): Promise<void>;
}

export class EditorGroupView extends Widget implements IEditorGroupView {

    // [fields]

    private readonly _editorPaneRegistrant: IEditorPaneRegistrant;

    private readonly _editorContainer: HTMLElement;
    private _currEditor: IEditorPaneView | undefined;

    // [constructor]

    constructor(
        parent: HTMLElement,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        super();
        this._editorPaneRegistrant = registrantService.getRegistrant(RegistrantType.EditorPane);
        
        this._currEditor = undefined;
        this._editorContainer = document.createElement('div');
        this._editorContainer.className = 'editor-pane-view-container';

        // entire container
        const groupContainer = document.createElement('div');
        groupContainer.className = 'editor-group-view-container';
        
        // self call
        this.render(groupContainer);
        parent.appendChild(groupContainer);
    }

    // [protected methods]

    protected override __render(element: HTMLElement): void {
        
        // editor tab bar
        // TODO

        // editor pane view
        element.appendChild(this._editorContainer);
    }

    protected override __applyStyle(element: HTMLElement): void {
        
    }

    protected override __registerListeners(element: HTMLElement): void {
        
    }

    // [public methods]

    public override dispose(): void {
        this._currEditor?.dispose();
        super.dispose();
    }

    public async openEditor(model: EditorPaneModel): Promise<void> {
        const container = this._editorContainer;
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